'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useStudio, type PreviewMode } from './context'
import { IconDownload, IconHeart, IconShare } from './icons'
import PatternTiles from './PatternTiles'
import SeedField from './SeedField'
import SizePicker from './SizePicker'
import { FAM_LABEL } from '@/lib/wall'

const MODES: Array<{ id: PreviewMode; label: string }> = [{ id: 'full', label: 'Full screen' }, { id: 'desktop', label: 'Desktop' }, { id: 'phone', label: 'Phone' }]

export default function Panel() {
  const s = useStudio()
  const [invalid, setInvalid] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [atEnd, setAtEnd] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const onInvalid = useCallback((v: boolean) => setInvalid(v), [])

  const measure = useCallback(() => {
    const el = scroller.current; if (!el) return
    setScrolled(el.scrollTop > 4); setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 4)
  }, [])
  useEffect(() => { const t = setTimeout(measure, 0); window.addEventListener('resize', measure); return () => { clearTimeout(t); window.removeEventListener('resize', measure) } }, [measure])

  const onSaved = !!s.saved
  return (
    <aside className={`panel${s.panelOpen ? '' : ' closed'}`} id="panel" aria-label="Wall controls" tabIndex={-1} inert={!s.panelOpen}>
      <div className="phead">
        <span className="label">Controls</span>
        <button className="btn ghost sm" type="button" onClick={() => s.setPanelOpen(false)} aria-expanded={s.panelOpen} title="Hide controls (H)">Hide <kbd>H</kbd></button>
      </div>
      <div ref={scroller} className={`scroll${scrolled ? ' scrolled' : ''}${atEnd ? ' end' : ''}`} onScroll={measure}>
        <div className="sec"><SeedField onInvalid={onInvalid} /></div>
        <div className="sec">
          <h3><span className="label" id="pattern-l">Pattern</span><em>{FAM_LABEL[s.family]}</em></h3>
          <PatternTiles disabled={invalid} />
        </div>
        <div className="sec seg-view">
          <h3><span className="label" id="preview-l">Preview on</span></h3>
          <div className="seg" role="radiogroup" aria-labelledby="preview-l">
            {MODES.map(m => <button key={m.id} type="button" role="radio" aria-checked={s.previewMode === m.id} onClick={() => s.setPreviewMode(m.id)}>{m.label}</button>)}
          </div>
        </div>
      </div>

      {!s.accountsEnabled && <div className="banner warn" role="region" aria-label="Preview build"><div><b>Preview build.</b> Payments and sign-in are off here.</div></div>}
      {s.syncNudge && (
        <div className="banner" role="region" aria-label="Sync">
          <div><b>{s.library.lib.walls.length} walls saved on this device.</b> Sign in to keep them across devices.
            <div className="acts"><button className="btn primary sm" type="button" onClick={() => s.openDialog({ kind: 'signin', trigger: 'sync' })}>Sign in</button><button className="btn ghost sm" type="button" onClick={s.dismissSyncNudge}>Not now</button></div></div>
        </div>
      )}

      <div className="foot">
        <div className="split">
          <SizePicker />
          <button className="btn primary lg main" type="button" onClick={s.download} aria-busy={s.downloading} disabled={invalid}>
            {s.downloading ? <><span className="spin" />Rendering…</> : <><IconDownload />Download</>}
          </button>
        </div>
        <button className="btn lg" type="button" onClick={s.toggleSave} aria-pressed={onSaved} title="Save to My walls (S)" disabled={invalid}>
          <IconHeart style={onSaved ? { fill: 'var(--wall-accent)', stroke: 'var(--wall-accent)' } : undefined} />{onSaved ? 'Saved' : 'Save'}
        </button>
        <button className="btn lg" type="button" onClick={() => s.openDialog({ kind: 'share' })} disabled={invalid}><IconShare />Share</button>
      </div>
    </aside>
  )
}
