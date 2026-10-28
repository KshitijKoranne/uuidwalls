'use client'

import { useEffect, useRef } from 'react'
import { paramsWithPalette, type UUIDParams } from '@/lib/wall'
import { isAbort, wallRenderer } from '@/lib/wall/client'

interface Props {
  data: { uuid: string; fam: string; pal?: Partial<UUIDParams> }
  onClick: () => void
  label: string
  sub?: string
  aspect?: string
}

/** A small wall card. Renders in the thumbnail worker lane once it scrolls near the viewport. */
export default function WallThumb({ data, onClick, label, sub, aspect = '4/3' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctl = new AbortController()
    let started = false
    const start = () => {
      if (started) return; started = true
      const w = Math.max(canvas.parentElement?.offsetWidth || 240, 240)
      const h = Math.max(canvas.parentElement?.offsetHeight || 160, 160)
      wallRenderer.draw(canvas, { P: paramsWithPalette(data.uuid, data.fam, data.pal), w, h, hq: false }, { lane: 'thumb', signal: ctl.signal })
        .catch(e => { if (!isAbort(e)) console.warn('thumbnail render failed', e) })
    }
    const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); start() } }, { rootMargin: '300px' })
    io.observe(canvas)
    return () => { io.disconnect(); ctl.abort() }
  }, [data])

  return (
    <div onClick={onClick} style={{ position: 'relative', overflow: 'hidden', aspectRatio: aspect, cursor: 'pointer', background: 'var(--surface-1)', transition: 'transform 0.3s ease' }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
      <canvas ref={canvasRef} role="img" aria-label={`${label} wall`} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(10,9,8,0.92))', padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {sub && <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--faint)', letterSpacing: '0.04em', marginBottom: 3 }}>{sub}</div>}
        <div style={{ fontFamily: 'var(--font)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)' }}>{label}</div>
      </div>
    </div>
  )
}
