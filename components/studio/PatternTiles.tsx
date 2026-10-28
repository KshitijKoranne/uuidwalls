'use client'

import { useEffect, useRef, useState } from 'react'
import { FAMS, FAM_LABEL } from '@/lib/wall'
import { isAbort, wallRenderer } from '@/lib/wall/client'
import { IconCheck } from './icons'
import { useStudio } from './context'

/** Six thumbnails of the CURRENT seed, one per family (SPEC 7.2). A radiogroup: arrows move the choice. */
export default function PatternTiles({ disabled }: { disabled: boolean }) {
  const s = useStudio()
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const [ready, setReady] = useState<Record<string, boolean>>({})
  const lookKey = `${s.P.seed}|${s.P.hue}|${s.P.sat}|${s.P.lum1}|${s.P.lum2}|${s.P.accent}|${s.P.density}|${s.P.angle}|${s.P.mood}`

  useEffect(() => {
    if (disabled) return
    const ctl = new AbortController()
    const t = setTimeout(() => {
      setReady({})
      FAMS.forEach((f, i) => {
        const c = refs.current[i]?.querySelector('canvas'); if (!c) return
        wallRenderer.draw(c, { P: { ...s.P, family: f }, w: 240, h: 150, hq: false }, { lane: 'thumb', signal: ctl.signal })
          .then(() => setReady(r => ({ ...r, [f]: true })))
          .catch(e => { if (!isAbort(e)) console.warn('tile failed', f) })
      })
    }, 200)
    return () => { clearTimeout(t); ctl.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the look matters, not the chosen family
  }, [lookKey, disabled])

  function onKey(e: React.KeyboardEvent, i: number) {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const n = (i + d + FAMS.length) % FAMS.length
    s.selectFamily(FAMS[n]); refs.current[n]?.focus()
  }

  return (
    <div className={`tiles${disabled ? ' dis' : ''}`} role="radiogroup" aria-label="Pattern" aria-disabled={disabled}>
      {FAMS.map((f, i) => (
        <button key={f} ref={el => { refs.current[i] = el }} type="button" role="radio" aria-checked={s.family === f}
          tabIndex={s.family === f ? 0 : -1} className="tile" onClick={() => s.selectFamily(f)} onKeyDown={e => onKey(e, i)} disabled={disabled}>
          <span className={`th${ready[f] ? ' ready' : ''}`}><canvas aria-hidden="true" /><span className="check"><IconCheck /></span></span>
          <span>{FAM_LABEL[f]}</span>
        </button>
      ))}
    </div>
  )
}
