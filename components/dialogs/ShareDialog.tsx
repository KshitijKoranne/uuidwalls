'use client'

import { useEffect, useId, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import { useStudio } from '@/components/studio/context'
import { saveBlob, slug } from '@/lib/download'

/**
 * Share (SPEC 8.5). The link is /w/<token>: the wall's look, not the device UUID. Sharing the raw UUID is
 * a separate, collapsed, off-by-default choice that does not exist for walls opened from a link.
 */
export default function ShareDialog() {
  const s = useStudio()
  const id = useId()
  const [imgReady, setImgReady] = useState(false)
  const [includeUuid, setIncludeUuid] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  useEffect(() => { const t = setTimeout(() => setCanNativeShare(typeof navigator.share === 'function'), 0); return () => clearTimeout(t) }, [])

  const { privateUrl, rawUrl } = s.getShareLinks()
  const link = includeUuid && rawUrl ? rawUrl : privateUrl

  async function nativeShare() {
    try { await navigator.share({ title: s.name, text: `${s.name}: the wallpaper my device's UUID makes.`, url: link }) } catch { /* cancelled */ }
  }
  async function downloadCard() {
    try {
      const res = await fetch(`/w/${s.token}/og.jpg`)
      if (!res.ok) throw new Error('card')
      saveBlob(await res.blob(), `uuidwalls-${slug(s.name)}-card.jpg`)
      s.showToast('Saved to your downloads.')
    } catch { s.showToast('Couldn’t make the card. Copy the link instead.', { error: true }) }
  }

  return (
    <Dialog onClose={s.closeDialog} labelledBy={id}>
      <h2 id={id}>Share this wall</h2>
      <div className={`cardthumb${imgReady ? '' : ' sk'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- generated per wall, not a static asset */}
        <img src={`/w/${s.token}/og.jpg`} alt={`Preview card for ${s.name}`} onLoad={() => setImgReady(true)} onError={() => setImgReady(true)} />
      </div>
      <div className="row" style={{ marginTop: 0 }}>
        {canNativeShare
          ? <button className="btn primary lg" type="button" onClick={nativeShare}>Share…</button>
          : <button className="btn primary lg" type="button" onClick={() => void s.copyShareLink(includeUuid ? 'raw' : 'private')}>Copy link</button>}
        {canNativeShare && <button className="btn lg" type="button" onClick={() => void s.copyShareLink(includeUuid ? 'raw' : 'private')}>Copy link</button>}
      </div>
      <label className="sr" htmlFor={`${id}-link`}>Link</label>
      <input id={`${id}-link`} className="readonly" style={{ marginTop: 8 }} readOnly value={link} onFocus={e => e.currentTarget.select()} />
      <p className="caption" style={{ margin: '8px 0 16px' }}>{includeUuid ? 'This link contains your UUID.' : 'The link doesn’t include your UUID.'}</p>
      <div className="row" style={{ marginTop: 0 }}>
        <button className="btn" type="button" onClick={downloadCard}>Download card</button>
        <button className="btn" type="button" onClick={s.shareOnX}>Post on X</button>
      </div>
      {rawUrl && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ minHeight: 44, fontSize: 14 }}>Advanced</summary>
          <div className="switch-row" style={{ padding: 0 }}>
            <span id={`${id}-incl`}>Include my UUID in the link</span>
            <button className="switch" type="button" role="switch" aria-checked={includeUuid} aria-labelledby={`${id}-incl`} onClick={() => setIncludeUuid(v => !v)} />
          </div>
          <p className="caption" style={{ margin: '0 0 8px', padding: 0 }}>A UUID identifies your device. Only turn this on if you’re comfortable linking this wall to your machine.</p>
        </details>
      )}
    </Dialog>
  )
}
