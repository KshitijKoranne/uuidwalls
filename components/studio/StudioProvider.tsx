'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import FindDialog from '@/components/dialogs/FindDialog'
import MergeDialog from '@/components/dialogs/MergeDialog'
import ShareDialog from '@/components/dialogs/ShareDialog'
import SigninDialog from '@/components/dialogs/SigninDialog'
import UnlockDialog from '@/components/dialogs/UnlockDialog'
import { useAuth } from '@/hooks/useAuth'
import { useLibrary } from '@/hooks/useLibrary'
import { useToast } from '@/hooks/useToast'
import { DL_SIZES, SIZE_LABEL, saveBlob, slug } from '@/lib/download'
import { ACCOUNTS_ENABLED } from '@/lib/env'
import { isPaidSize, type DlSizeKey } from '@/lib/payments/catalog'
import { FAMS, parseUUID, type UUIDParams } from '@/lib/wall'
import { isAbort, wallRenderer } from '@/lib/wall/client'
import { wallName } from '@/lib/wall/name'
import { HERO_UUID } from '@/lib/wall/presets'
import { isFamily, randomUUID } from '@/lib/wall/random'
import { decodeWall, encodeWall } from '@/lib/wall/token'
import Toast from './Toast'
import { StudioContext, type DialogState, type PreviewMode, type SeedKind, type Studio } from './context'

const store = {
  get: (k: string) => { try { return window.localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { window.localStorage.setItem(k, v) } catch { /* private mode */ } },
}
const day = 24 * 3600 * 1000

/** Where the wall is drawn, in CSS pixels, for each preview mode (mirrors the stage CSS). */
function previewBox(mode: PreviewMode) {
  const iw = window.innerWidth, ih = window.innerHeight
  if (iw < 900) return { w: iw, h: Math.max(Math.round(ih * 0.62), 420) }
  const stageH = Math.max(ih, 560)
  if (mode === 'desktop') return { w: iw - 56 - 440, h: stageH - 96 - 56 }
  if (mode === 'phone') { const h = stageH - 128; return { w: h * 0.462, h } }
  return { w: iw, h: stageH }
}
const screenDims = () => { const d = window.devicePixelRatio || 1; return `${Math.floor(window.innerWidth * d)}×${Math.floor(window.innerHeight * d)}` }

export default function StudioProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const onShare = pathname.startsWith('/w/')
  const onHome = pathname === '/' || onShare

  // A shared wall (/w/<token>, ?w=<token>, or opened from My walls) has no UUID, only its look.
  const [initialShared] = useState(() => { const m = /^\/w\/([^/]+)/.exec(pathname); return m ? decodeWall(decodeURIComponent(m[1])) : null })
  const [shared, setShared] = useState<UUIDParams | null>(initialShared)
  const [uuid, setUuid] = useState(initialShared ? '' : HERO_UUID)
  const [family, setFamily] = useState(initialShared?.family ?? 'flowfield')
  const [seedKind, setSeedKind] = useState<SeedKind>(initialShared ? 'hidden' : 'sample')
  const [interacted, setInteracted] = useState(false)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('full')
  const [panelOpen, setPanelOpen] = useState(true)
  const [heroGone, setHeroGone] = useState(false)
  const [hintVisible, setHintVisible] = useState(false)
  const [backToWalls, setBackToWalls] = useState(false)
  const [size, setSize] = useState<DlSizeKey>('screen')
  const [wmEnabled, setWmEnabled] = useState(false)
  const [dimScreen, setDimScreen] = useState('screen')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [downloading, setDownloading] = useState(false)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [coarse, setCoarse] = useState<HTMLCanvasElement | null>(null)
  const [renderState, setRenderState] = useState<'ready' | 'busy' | 'error'>('ready')
  const [progress, setProgress] = useState(0)
  const [busyShown, setBusyShown] = useState(false)
  const [resizeTick, setResizeTick] = useState(0)
  const [retryTick, setRetryTick] = useState(0)
  const [nudgeDismissed, setNudgeDismissed] = useState(true)
  const dlCtl = useRef<AbortController | null>(null)

  const { toast, show: showToast, update: updateToast, hide: hideToast, pause: pauseToast } = useToast()
  const auth = useAuth()
  const { user, isPaid } = auth
  const library = useLibrary(user)

  // ── the wall ───────────────────────────────────────────────────────────────
  const P = useMemo<UUIDParams>(() => (shared ? { ...shared, family } : parseUUID(uuid, family)), [shared, uuid, family])
  const token = useMemo(() => encodeWall(P), [P])
  const saved = library.tokens.get(token)
  const name = saved?.label ?? wallName(P)

  // the UI quietly belongs to each wall (SPEC 4.1)
  useEffect(() => { document.documentElement.style.setProperty('--wall-hue', String(Number.isFinite(P.hue) ? P.hue : 210)) }, [P.hue])

  const touch = useCallback(() => { setInteracted(true); setHeroGone(true); store.set('uw_seen', '1') }, [])

  // ── first load: payment return, ?w=, legacy ?uuid=&p=, remembered choices ──
  useEffect(() => {
    const t = setTimeout(() => {
      setDimScreen(screenDims())
      const params = new URLSearchParams(window.location.search)
      const lastSize = store.get('uw_size') as DlSizeKey | null
      if (lastSize && lastSize in SIZE_LABEL && !isPaidSize(lastSize)) setSize(lastSize)
      setWmEnabled(store.get('uw_wm') === '1')
      setNudgeDismissed(Date.now() - Number(store.get('uw_nudge') ?? 0) < 30 * day)
      if (store.get('uw_seen')) setHeroGone(true)

      const payment = params.get('payment')
      if (payment) {
        history.replaceState(null, '', window.location.pathname)
        const step = payment === 'success' ? 'confirming' : payment === 'cancelled' ? 'cancelled' : 'error'
        setDialog({ kind: 'unlock', size: '4k', step })
        try { const i = JSON.parse(sessionStorage.getItem('uw_intent') ?? 'null'); if (i?.token && decodeWall(i.token)) { setShared(decodeWall(i.token)); setFamily(decodeWall(i.token)!.family); setUuid(''); setSeedKind('hidden') } } catch { /* no intent */ }
        return
      }
      if (initialShared) return
      const w = params.get('w'), pu = params.get('uuid'), pf = params.get('p')
      const fromToken = w ? decodeWall(w) : null
      if (fromToken) { setShared(fromToken); setFamily(fromToken.family); setUuid(''); setSeedKind('hidden'); setBackToWalls(params.get('b') === 'walls'); setHeroGone(true) }
      else if (pu && pu.replace(/-/g, '').length >= 8) { // legacy link: render exactly as before, then move the address bar to a token
        const fam = isFamily(pf) ? pf : 'flowfield'
        setUuid(pu); setFamily(fam); setSeedKind('yours'); setHeroGone(true)
        history.replaceState(null, '', `/?w=${encodeWall(parseUUID(pu, fam))}`)
      }
      if (!store.get('uw_hint') && window.innerWidth >= 900) {
        setTimeout(() => { setHintVisible(true); store.set('uw_hint', '1'); setTimeout(() => setHintVisible(false), 6000) }, 1200)
      }
    }, 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on load
  }, [])

  // keep the address bar on the wall's token (never the UUID)
  useEffect(() => {
    if (!interacted) return
    if (shared && onShare) history.replaceState(null, '', `/w/${token}`) // still a link wall: stay on its page
    else if (onHome) history.replaceState(null, '', `/?w=${token}`) // a wall you made: the address is a token, never your UUID
  }, [token, interacted, onShare, onHome, shared])

  // ── drawing the stage ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvas || !onHome) return
    const ctl = new AbortController()
    const { w, h } = previewBox(previewMode)
    const dpr = window.devicePixelRatio || 1
    const t = setTimeout(() => { setRenderState('busy'); setProgress(0) }, 0)
    // A quick, small pass behind the sharp one, so the first picture is there within a moment (SPEC 8.2).
    // Skipped once the stage already shows a wall: old pixels stay until the new render is ready.
    if (coarse && !canvas.dataset.drawn) {
      coarse.style.opacity = '1'
      void wallRenderer.draw(coarse, { P, w: Math.max(160, Math.floor(w * dpr / 4)), h: Math.max(100, Math.floor(h * dpr / 4)), hq: false }, { signal: ctl.signal }).catch(() => { /* the sharp pass is what matters */ })
    }
    wallRenderer.draw(canvas, { P, w: Math.floor(w * dpr), h: Math.floor(h * dpr), hq: true }, { signal: ctl.signal, onProgress: r => setProgress(r) })
      .then(() => { setRenderState('ready'); canvas.dataset.drawn = '1'; if (coarse) coarse.style.opacity = '0'; canvas.classList.remove('swap'); void canvas.offsetWidth; canvas.classList.add('swap') })
      .catch(e => { if (!isAbort(e)) setRenderState('error') })
    return () => { clearTimeout(t); ctl.abort() }
  }, [canvas, coarse, onHome, P, previewMode, resizeTick, retryTick])

  useEffect(() => { // "Sharpening…" only if it takes a moment (SPEC 8.2)
    if (renderState !== 'busy') { const t = setTimeout(() => setBusyShown(false), 0); return () => clearTimeout(t) }
    const t = setTimeout(() => setBusyShown(true), 150)
    return () => clearTimeout(t)
  }, [renderState])

  useEffect(() => { // resize: 300 ms debounce, old pixels stay until the new render is ready
    let t: ReturnType<typeof setTimeout>
    const on = () => { clearTimeout(t); t = setTimeout(() => { setDimScreen(screenDims()); setResizeTick(n => n + 1) }, 300) }
    window.addEventListener('resize', on)
    return () => { clearTimeout(t); window.removeEventListener('resize', on) }
  }, [])

  const renderInfo = {
    state: renderState,
    progress,
    label: renderState === 'error' ? 'Couldn’t draw this wall' : renderState === 'busy' && busyShown ? `Sharpening… ${Math.round(progress * 100)}%` : 'Ready',
  }

  // ── wall actions ───────────────────────────────────────────────────────────
  const leaveShared = useCallback(() => { setShared(null); setBackToWalls(false) }, [])

  const setSeed = useCallback((value: string) => { touch(); leaveShared(); setUuid(value); setSeedKind('yours') }, [touch, leaveShared])
  const selectFamily = useCallback((fam: string) => { touch(); setFamily(fam) }, [touch])
  const stepFamily = useCallback((dir: 1 | -1) => { touch(); setFamily(f => FAMS[(FAMS.indexOf(f as (typeof FAMS)[number]) + dir + FAMS.length) % FAMS.length]) }, [touch])
  const randomize = useCallback(() => { touch(); leaveShared(); setUuid(randomUUID()); setSeedKind('random') }, [touch, leaveShared])
  const loadWall = useCallback((u: string, fam: string) => { touch(); leaveShared(); setUuid(u); setFamily(fam); setSeedKind('yours'); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [touch, leaveShared])
  const loadToken = useCallback((t: string, opts?: { fromWalls?: boolean }) => {
    const p = decodeWall(t); if (!p) return false
    touch(); setShared(p); setFamily(p.family); setUuid(''); setSeedKind('hidden'); setBackToWalls(!!opts?.fromWalls)
    return true
  }, [touch])
  const retryRender = useCallback(() => setRetryTick(n => n + 1), [])

  // ── size, download ─────────────────────────────────────────────────────────
  const openDialog = useCallback((d: NonNullable<DialogState>) => setDialog(d), [])
  const closeDialog = useCallback(() => setDialog(null), [])

  const chooseSize = useCallback((k: DlSizeKey) => {
    if (isPaidSize(k) && !isPaid) { setDialog({ kind: 'unlock', size: k as '2k' | '4k', step: 'intro' }); return }
    setSize(k); store.set('uw_size', k)
  }, [isPaid])

  const runDownload = useCallback(async (sizeKey: DlSizeKey, wall: UUIDParams, label: string) => {
    const { w, h } = DL_SIZES[sizeKey]()
    const ctl = new AbortController(); dlCtl.current = ctl
    setDownloading(true)
    const text = `Rendering ${w}×${h}`
    showToast(`${text}…`, { sticky: true, progress: 0, actions: [{ label: 'Cancel', run: () => ctl.abort() }] })
    try {
      const blob = await wallRenderer.exportPng({ P: wall, w, h, watermark: wmEnabled }, { signal: ctl.signal, onProgress: r => updateToast({ text: `${text}… ${Math.round(r * 100)}%`, progress: r }) })
      saveBlob(blob, `uuidwalls-${slug(label)}-${sizeKey === 'mobile' ? 'phone' : sizeKey}.png`)
      showToast('Saved to your downloads.')
    } catch (e) {
      if (isAbort(e)) showToast('Download cancelled.')
      else showToast('Couldn’t make that file here. Try a smaller size.', { error: true, ms: 8000, actions: isPaid && (sizeKey === '4k') ? [{ label: 'Try 2K', run: () => void runDownload('2k', wall, label) }] : undefined })
    } finally {
      setDownloading(false); dlCtl.current = null
    }
  }, [showToast, updateToast, wmEnabled, isPaid])

  const download = useCallback(() => {
    if (downloading) return
    touch()
    if (isPaidSize(size) && !isPaid) { setDialog({ kind: 'unlock', size: size as '2k' | '4k', step: 'intro' }); return }
    void runDownload(size, P, name)
  }, [downloading, touch, size, isPaid, runDownload, P, name])
  const cancelDownload = useCallback(() => dlCtl.current?.abort(), [])
  const toggleWatermark = useCallback(() => setWmEnabled(w => { store.set('uw_wm', w ? '0' : '1'); return !w }), [])

  // after a payment: carry on with the download the user asked for (SPEC 8.4)
  const markPaid = auth.markPaid
  useEffect(() => {
    if (!isPaid || dialog?.kind !== 'unlock' || dialog.step !== 'success') return
    try {
      const i = JSON.parse(sessionStorage.getItem('uw_intent') ?? 'null'); sessionStorage.removeItem('uw_intent')
      if (i?.action === 'download' && i.size in SIZE_LABEL) { const p = i.token ? decodeWall(i.token) : null; if (p) void runDownload(i.size, p, wallName(p)); setSize(i.size) }
    } catch { /* nothing to resume */ }
  }, [isPaid, dialog, runDownload])

  // ── library ────────────────────────────────────────────────────────────────
  const toggleSave = useCallback(() => {
    touch()
    if (saved) {
      const r = library.removeWall(saved.id)
      if (r.removed) showToast(`Removed “${name}”.`, { actions: [{ label: 'Undo', run: () => library.undoRemove(r.removed!, r.index) }] })
      return
    }
    const r = library.saveWall(token, family)
    if (r.status === 'added') showToast('Saved to My walls', { actions: [{ label: 'Undo', run: () => { const x = library.removeWall(r.wall!.id); void x } }, { label: 'View', run: () => router.push('/walls') }] })
    else if (r.status === 'exists') showToast('Already in My walls')
    else showToast('Your library is full (500 walls). Delete a few to save more.', { error: true })
  }, [touch, saved, library, showToast, name, token, family, router])

  const syncNudge = !user && ACCOUNTS_ENABLED && library.lib.walls.length >= 3 && !nudgeDismissed
  const dismissSyncNudge = useCallback(() => { store.set('uw_nudge', String(Date.now())); setNudgeDismissed(true) }, [])

  // ── sharing ────────────────────────────────────────────────────────────────
  const getShareLinks = useCallback(() => {
    const origin = window.location.origin
    const privateUrl = `${origin}/w/${token}`
    if (shared) return { privateUrl, rawUrl: null }
    const q = new URLSearchParams(); q.set('uuid', uuid); q.set('p', family)
    return { privateUrl, rawUrl: `${origin}/?${q.toString()}` }
  }, [token, shared, uuid, family])

  const copyShareLink = useCallback(async (kind: 'private' | 'raw') => {
    const { privateUrl, rawUrl } = getShareLinks()
    const url = kind === 'raw' ? rawUrl : privateUrl
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      showToast(kind === 'raw' ? 'Link copied. It contains your UUID.' : 'Link copied. It doesn’t include your UUID.')
    } catch { showToast('Couldn’t copy. Select the link and press Ctrl or ⌘ + C.', { error: true }) }
  }, [getShareLinks, showToast])

  const shareOnX = useCallback(() => {
    const { privateUrl } = getShareLinks()
    const txt = `${name}: the wallpaper my device's UUID makes. See it → ${privateUrl}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}`, '_blank', 'noopener')
  }, [getShareLinks, name])

  const signOut = useCallback(async () => {
    try { await fetch('/auth/signout', { method: 'POST' }); window.location.href = '/' } catch { showToast('Couldn’t sign out. Try again.', { error: true }) }
  }, [showToast])

  // ── keyboard (SPEC 7.16): off while typing or while a dialog is open ───────
  useEffect(() => {
    if (!onHome) return
    const on = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (dialog || e.metaKey || e.ctrlKey || e.altKey || el?.closest('input, textarea, select, [contenteditable], dialog')) return
      if (e.key === ' ' && el?.closest('button, a, summary, [role=radio], [role=menuitem]')) return
      if (e.key === ' ') { e.preventDefault(); randomize() }
      else if (e.key === 's' || e.key === 'S') toggleSave()
      else if (e.key === 'h' || e.key === 'H') setPanelOpen(o => !o)
      else if (e.key === 'ArrowRight' && !el?.closest('[role=radiogroup]')) stepFamily(1)
      else if (e.key === 'ArrowLeft' && !el?.closest('[role=radiogroup]')) stepFamily(-1)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onHome, dialog, randomize, toggleSave, stepFamily])

  const value = useMemo<Studio>(() => ({
    uuid, family, P, token, name, seedKind, sharedWall: !!shared, render: renderInfo,
    previewMode, setPreviewMode, panelOpen, setPanelOpen, heroGone, hintVisible,
    attachWallCanvas: setCanvas, attachCoarseCanvas: setCoarse, setSeed, selectFamily, stepFamily, randomize, loadWall, loadToken, retryRender, backToWalls,
    size, chooseSize, download, downloading, cancelDownload, wmEnabled, toggleWatermark, dimScreen,
    library, saved, toggleSave, syncNudge, dismissSyncNudge,
    user, isPaid, authChecked: auth.authChecked, accountsEnabled: ACCOUNTS_ENABLED, signOut, confirmPaid: auth.confirmPaid, markPaid,
    dialog, openDialog, closeDialog, getShareLinks, copyShareLink, shareOnX, showToast,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- renderInfo is derived from the listed render fields
  }), [uuid, family, P, token, name, seedKind, shared, renderState, progress, busyShown, previewMode, panelOpen, heroGone, hintVisible, setSeed, selectFamily, stepFamily, randomize, loadWall, loadToken, retryRender, backToWalls,
    size, chooseSize, download, downloading, cancelDownload, wmEnabled, toggleWatermark, dimScreen, library, saved, toggleSave, syncNudge, dismissSyncNudge,
    user, isPaid, auth.authChecked, auth.confirmPaid, signOut, markPaid, dialog, openDialog, closeDialog, getShareLinks, copyShareLink, shareOnX, showToast])

  return (
    <StudioContext.Provider value={value}>
      {children}
      <Toast toast={toast} onHover={pauseToast} onDismiss={hideToast} />
      {dialog?.kind === 'find' && <FindDialog />}
      {dialog?.kind === 'share' && <ShareDialog />}
      {dialog?.kind === 'signin' && <SigninDialog />}
      {dialog?.kind === 'unlock' && <UnlockDialog />}
      {library.mergePrompt && !dialog && <MergeDialog />}
    </StudioContext.Provider>
  )
}
