'use client'

import Link from 'next/link'
import { FAM_LABEL } from '@/lib/wall'
import { useStudio } from './context'
import { IconArrowLeft } from './icons'
import Panel from './Panel'
import WallCanvas from './WallCanvas'

export default function Stage() {
  const s = useStudio()
  const busy = s.render.state === 'busy'
  return (
    <section className="stage" id="stage" aria-label="Wall preview">
      <div className="progress" aria-hidden="true" style={{ width: busy ? `${Math.max(4, s.render.progress * 100)}%` : 0, opacity: busy ? 1 : 0 }} />
      <div className={`frame ${s.previewMode}`}>
        <WallCanvas />
      </div>
      <div className="topscrim" /><div className="scrim" />

      {s.backToWalls && <Link href="/walls" className="pill back-pill"><span style={{ width: 18, height: 18, display: 'inline-flex' }}><IconArrowLeft /></span>My walls</Link>}

      <div className={`hero${s.heroGone ? ' gone' : ''}`} aria-hidden={s.heroGone}>
        <h1>Your device has a face.</h1>
        <p>Paste your device’s UUID. We turn it into a wallpaper only that UUID makes. It all happens on your device.</p>
      </div>

      <div className="nameline">
        <h2>{s.name}</h2>
        <span className="label" style={{ color: 'var(--soft)' }}>{FAM_LABEL[s.family]}</span>
        <span className={`status${busy ? ' busy' : ''}${s.render.state === 'error' ? ' err' : ''}`} role="status" aria-live="polite"><i className="dot" /><span>{s.render.label}</span></span>
      </div>

      <p className={`hint${s.hintVisible ? '' : ' out'}`} aria-hidden={!s.hintVisible}>Press <kbd>Space</kbd> for a random seed</p>

      {s.render.state === 'error' && (
        <div className="stage-error" role="alert"><div className="card">
          <h3>Couldn’t draw this wall</h3>
          <p>Your browser may have run out of memory. Retry, or pick a different pattern.</p>
          <div className="row"><button className="btn primary" type="button" onClick={s.retryRender}>Retry</button></div>
        </div></div>
      )}

      <Panel />
      {!s.panelOpen && <button className="pill show-panel" type="button" onClick={() => s.setPanelOpen(true)} autoFocus>Show controls</button>}
    </section>
  )
}
