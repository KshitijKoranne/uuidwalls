'use client'

import { useEffect, useRef } from 'react'
import { ctaParams } from '@/lib/wall'
import { isAbort, wallRenderer } from '@/lib/wall/client'
import { useStudio } from '@/components/studio/context'

export default function Cta() {
  const { shareOnX } = useStudio()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctl = new AbortController()
    const section = canvas.parentElement!
    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return
      io.disconnect()
      wallRenderer.draw(canvas, { P: ctaParams(), w: section.offsetWidth || 900, h: section.offsetHeight || 500, hq: false }, { lane: 'thumb', signal: ctl.signal })
        .catch(e => { if (!isAbort(e)) console.warn('cta render failed', e) })
    }, { rootMargin: '300px' })
    io.observe(canvas)
    return () => { io.disconnect(); ctl.abort() }
  }, [])

  return (
    <section style={{ background: 'var(--surface-1)', position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '8rem 1.5rem' }}>
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1 }} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontFamily: 'var(--font)', fontSize: 'clamp(2.5rem,6vw,5rem)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.025em', lineHeight: 1.05, marginBottom: '1rem' }}>
          What does your<br /><em style={{ fontStyle: 'italic', fontWeight: 400 }}>device look like?</em>
        </h2>
        <p style={{ fontSize: '1rem', fontWeight: 300, color: 'var(--soft)', marginBottom: '2.5rem' }}>No install. Enter your UUID, pick your pattern, download your wall.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: 'var(--ink)', color: 'var(--base)', border: 'none', borderRadius: 'var(--r-sm)', padding: '16px 32px', fontFamily: 'var(--font)', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>
            Generate my wall
          </button>
          <button onClick={shareOnX} style={{ background: 'transparent', color: 'var(--soft)', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-sm)', padding: '16px 24px', fontFamily: 'var(--font)', fontSize: '15px', fontWeight: 400, cursor: 'pointer' }}>
            Post on X
          </button>
        </div>
      </div>
    </section>
  )
}
