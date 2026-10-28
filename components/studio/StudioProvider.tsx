'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import AuthModal from '@/components/AuthModal'
import PayModal from '@/components/PayModal'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { DL_SIZES, saveBlob } from '@/lib/download'
import { ACCOUNTS_ENABLED } from '@/lib/env'
import { isPaidSize, type DlSizeKey } from '@/lib/payments/catalog'
import { FAM_LABEL, parseUUID, type UUIDParams } from '@/lib/wall'
import { isAbort, wallRenderer } from '@/lib/wall/client'
import { HERO_UUID } from '@/lib/wall/presets'
import { isFamily, randomUUID } from '@/lib/wall/random'
import { decodeWall, encodeWall } from '@/lib/wall/token'
import ProgressOverlay from './ProgressOverlay'
import Toast from './Toast'
import { StudioContext, type Studio } from './context'

const SLOW_FAMILIES = ['voronoi', 'flowfield']
const LIVE = 'Live · rendering'

function writePermalink(uuid: string, fam: string) {
  const p = new URLSearchParams(); p.set('uuid', uuid); p.set('p', fam)
  history.replaceState(null, '', '?' + p.toString())
}

export default function StudioProvider({ children, initialToken }: { children: ReactNode; initialToken?: string }) {
  const wallCanvasRef = useRef<HTMLCanvasElement | null>(null)
  // A shared wall (/w/<token>) has no UUID, only its look. While set, it is the wall; typing a UUID leaves it.
  // Decoded from the prop on the first render so the server HTML already shows the shared state (no UUID in it).
  const [initialShared] = useState(() => (initialToken ? decodeWall(initialToken) : null))
  const [shared, setShared] = useState<UUIDParams | null>(initialShared)
  const [uuid, setUuid] = useState(initialShared ? '' : HERO_UUID)
  const [family, setFamily] = useState(initialShared?.family ?? 'flowfield')
  const [metaText, setMetaText] = useState(LIVE)
  const [progress, setProgress] = useState(0)
  const [showProgress, setShowProgress] = useState(false)
  const [wmEnabled, setWmEnabled] = useState(false)
  const [dimScreen, setDimScreen] = useState('screen')
  const [showAuth, setShowAuth] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [authTrigger, setAuthTrigger] = useState<'download' | 'unlock'>('download')
  const renderToken = useRef(0)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toast, visible, show: showToast } = useToast()
  const { user, isPaid, authChecked, confirmPaid, markPaid } = useAuth()

  /** The wall for a family: from the shared look if there is one, else from the UUID. */
  const paramsFor = useCallback((fam: string, u = uuid, sh = shared): UUIDParams => (sh ? { ...sh, family: fam } : parseUUID(u, fam)), [uuid, shared])

  // ── hero render ────────────────────────────────────────────────────────────
  const applyHero = useCallback((P: UUIDParams, withProgress: boolean) => {
    const canvas = wallCanvasRef.current; if (!canvas) return
    const token = ++renderToken.current
    const dpr = window.devicePixelRatio || 1
    const cw = window.innerWidth, ch = window.innerHeight
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px'
    setMetaText(`${FAM_LABEL[P.family] ?? P.family} · rendering…`)
    if (withProgress && SLOW_FAMILIES.includes(P.family)) { setProgress(0); setShowProgress(true) }
    wallRenderer.draw(canvas, { P, w: Math.floor(cw * dpr), h: Math.floor(ch * dpr), hq: true }, {
      onProgress: r => { if (token === renderToken.current) setProgress(r) },
    }).then(() => {
      if (token !== renderToken.current) return
      setShowProgress(false); setMetaText(LIVE)
    }).catch(e => {
      if (isAbort(e) || token !== renderToken.current) return
      setShowProgress(false); setMetaText('Render failed')
      showToast('Could not render this wall on this device')
    })
  }, [showToast])

  // ── first load: payment return + permalink or shared wall ──────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    if (payment) {
      history.replaceState(null, '', window.location.pathname)
      if (payment === 'success') {
        setTimeout(async () => { if (await confirmPaid()) showToast('2K & 4K downloads unlocked!', 3000) }, 500)
      } else if (payment === 'cancelled') showToast('Payment cancelled.')
      else if (payment === 'error') showToast('Payment error — contact kjrlabs9@gmail.com', 4000)
    }
    const d = window.devicePixelRatio || 1
    setDimScreen(`${Math.floor(window.innerWidth * d)}×${Math.floor(window.innerHeight * d)}`)

    let first: UUIDParams
    if (initialShared) {
      first = initialShared
    } else {
      const pu = params.get('uuid'), pf = params.get('p')
      const initUUID = (pu && pu.replace(/-/g, '').length >= 8) ? pu : HERO_UUID
      const initFam = isFamily(pf) ? pf : 'flowfield'
      setUuid(initUUID); setFamily(initFam)
      first = parseUUID(initUUID, initFam)
    }
    const t = setTimeout(() => applyHero(first, false), 50)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on load
  }, [])

  // ── resize ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const handler = () => {
      clearTimeout(t)
      t = setTimeout(() => {
        const d = window.devicePixelRatio || 1
        setDimScreen(`${Math.floor(window.innerWidth * d)}×${Math.floor(window.innerHeight * d)}`)
        applyHero(paramsFor(family), false)
      }, 300)
    }
    window.addEventListener('resize', handler)
    return () => { clearTimeout(t); window.removeEventListener('resize', handler) }
  }, [family, paramsFor, applyHero])

  // ── actions ────────────────────────────────────────────────────────────────
  const leaveShared = useCallback(() => {
    if (!shared) return
    setShared(null)
    if (window.location.pathname.startsWith('/w/')) history.replaceState(null, '', '/')
  }, [shared])

  const onUuidInput = useCallback((value: string) => {
    setUuid(value)
    if (shared) { setShared(null); if (window.location.pathname.startsWith('/w/')) history.replaceState(null, '', '/') }
    if (debounce.current) clearTimeout(debounce.current)
    if (value.replace(/-/g, '').length < 8) return
    debounce.current = setTimeout(() => { applyHero(parseUUID(value, family), false); writePermalink(value, family) }, 420)
  }, [family, shared, applyHero])

  const selectFamily = useCallback((fam: string) => {
    setFamily(fam)
    const P = paramsFor(fam)
    applyHero(P, true)
    if (shared) history.replaceState(null, '', `/w/${encodeWall(P)}`)
    else writePermalink(uuid, fam)
  }, [uuid, shared, paramsFor, applyHero])

  const randomize = useCallback(() => {
    leaveShared()
    const u = randomUUID(); setUuid(u); applyHero(parseUUID(u, family), true)
  }, [family, leaveShared, applyHero])

  const loadWall = useCallback((u: string, fam: string) => {
    leaveShared()
    setUuid(u); setFamily(fam); applyHero(parseUUID(u, fam), true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [leaveShared, applyHero])

  const openAuth = useCallback((trigger: 'download' | 'unlock') => {
    if (!ACCOUNTS_ENABLED) { showToast('Sign-in and payments are off on preview builds'); return }
    setAuthTrigger(trigger); setShowAuth(true)
  }, [showToast])

  const openPay = useCallback(() => {
    if (!ACCOUNTS_ENABLED) { showToast('Sign-in and payments are off on preview builds'); return }
    setShowPay(true)
  }, [showToast])

  const unlock = useCallback(() => {
    if (!user) openAuth('download'); else if (!isPaid) openPay()
  }, [user, isPaid, openAuth, openPay])

  const signOut = useCallback(async () => {
    await fetch('/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }, [])

  const download = useCallback(async (size: DlSizeKey) => {
    if (isPaidSize(size) && !isPaid) { unlock(); return }
    const { w, h } = DL_SIZES[size]()
    const P = paramsFor(family)
    const label = shared ? encodeWall(P).slice(0, 8) : uuid.slice(0, 8)
    setMetaText(`Exporting ${w}×${h}…`)
    try {
      const blob = await wallRenderer.exportPng({ P, w, h, watermark: wmEnabled }, {
        onProgress: r => setMetaText(`Exporting ${w}×${h} · ${Math.round(r * 100)}%`),
      })
      saveBlob(blob, `uuidwalls-${label}-${family}-${size}.png`)
      showToast(`Downloading ${w}×${h}`)
    } catch (e) {
      if (!isAbort(e)) showToast(e instanceof Error && e.message ? e.message : 'Render failed — try a smaller size')
    } finally {
      setMetaText(LIVE)
    }
  }, [isPaid, unlock, paramsFor, family, shared, uuid, wmEnabled, showToast])

  // ── sharing: private link (look only) by default, raw UUID only on request ─
  const getShareLinks = useCallback(() => {
    const origin = window.location.origin
    const privateUrl = `${origin}/w/${encodeWall(paramsFor(family))}`
    if (shared) return { privateUrl, rawUrl: null }
    const q = new URLSearchParams(); q.set('uuid', uuid); q.set('p', family)
    return { privateUrl, rawUrl: `${origin}/?${q.toString()}` }
  }, [paramsFor, family, shared, uuid])

  const copyShareLink = useCallback(async (kind: 'private' | 'raw') => {
    const { privateUrl, rawUrl } = getShareLinks()
    const url = kind === 'raw' ? rawUrl : privateUrl
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      showToast(kind === 'raw' ? 'Link copied · it contains your UUID' : 'Link copied · your UUID is not in it')
    } catch { showToast('Could not copy. Select the address bar instead.') }
  }, [getShareLinks, showToast])

  const shareOnX = useCallback(() => {
    const { privateUrl } = getShareLinks()
    const txt = `Every device has a UUID no other machine on earth shares.\n\nMine generates a wall that belongs to no one else — mathematically, permanently.\n\nSee mine → ${privateUrl}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}`, '_blank', 'noopener')
  }, [getShareLinks])

  const getMyUUID = useCallback(() => {
    const ua = navigator.userAgent.toLowerCase()
    const isMac = ua.includes('mac') && !ua.includes('iphone') && !ua.includes('ipad')
    const isWin = ua.includes('win')
    const isLinux = ua.includes('linux') && !ua.includes('android')
    const copy = (text: string, msg: string) => { navigator.clipboard.writeText(text).then(() => showToast(msg)).catch(() => { }) }
    if (isMac) return copy("system_profiler SPHardwareDataType | grep 'Hardware UUID'", 'Terminal command copied')
    if (isWin) return copy('wmic csproduct get UUID', 'Command copied')
    if (isLinux) return copy('cat /etc/machine-id', 'Command copied')
    showToast('Settings → General → About → UUID')
  }, [showToast])

  const attachWallCanvas = useCallback((el: HTMLCanvasElement | null) => { wallCanvasRef.current = el }, [])

  const value = useMemo<Studio>(() => ({
    uuid, family, metaText, wmEnabled, dimScreen, attachWallCanvas,
    user, isPaid, authChecked, accountsEnabled: ACCOUNTS_ENABLED,
    openAuth, openPay, signOut, unlock,
    onUuidInput, selectFamily, randomize, loadWall,
    toggleWatermark: () => setWmEnabled(w => !w),
    download, showToast, shareOnX, getMyUUID,
    sharedWall: !!shared, getShareLinks, copyShareLink,
  }), [uuid, family, metaText, wmEnabled, dimScreen, attachWallCanvas, user, isPaid, authChecked, openAuth, openPay, signOut, unlock,
    onUuidInput, selectFamily, randomize, loadWall, download, showToast, shareOnX, getMyUUID, shared, getShareLinks, copyShareLink])

  return (
    <StudioContext.Provider value={value}>
      {showAuth && <AuthModal trigger={authTrigger} onClose={() => setShowAuth(false)} />}
      {showPay && user && (
        <PayModal
          userEmail={user.email ?? ''}
          onClose={() => setShowPay(false)}
          onSuccess={() => { markPaid(); setShowPay(false); showToast('Unlocked! 2K & 4K downloads are yours forever.') }}
        />
      )}
      <Toast text={toast} visible={visible} />
      {showProgress && <ProgressOverlay progress={progress} />}
      {children}
    </StudioContext.Provider>
  )
}
