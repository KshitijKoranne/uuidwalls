'use client'

import { useEffect, useRef } from 'react'
import { FAM_LABEL, parseUUID } from '@/lib/wall'
import { isAbort, wallRenderer } from '@/lib/wall/client'
import { wallName } from '@/lib/wall/name'
import { useStudio } from '@/components/studio/context'
import { IconDice } from '@/components/studio/icons'

// A fixed, named list (SPEC 6.4): a wall you liked is still here next visit. "Surprise me" makes a random
// seed; it never reshuffles this grid.
const SAMPLES = [
  { uuid: '550e8400-e29b-41d4-a716-446655440000', fam: 'voronoi' },
  { uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', fam: 'flowfield' },
  { uuid: '7c9e6679-7425-40de-944b-e07fc1f90ae7', fam: 'geometric' },
  { uuid: '9c858900-8a4d-11d1-8f14-001b62e03e77', fam: 'ascii' },
  { uuid: '9f8e7d6c-5b4a-4392-8170-0f1e2d3c4b5a', fam: 'mandala' },
]

function Sample({ uuid, fam }: { uuid: string; fam: string }) {
  const s = useStudio()
  const ref = useRef<HTMLCanvasElement>(null)
  const P = parseUUID(uuid, fam)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctl = new AbortController()
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return
      io.disconnect()
      wallRenderer.draw(c, { P: parseUUID(uuid, fam), w: 480, h: 300, hq: false }, { lane: 'thumb', signal: ctl.signal }).catch(e => { if (!isAbort(e)) console.warn('sample failed') })
    }, { rootMargin: '300px' })
    io.observe(c)
    return () => { io.disconnect(); ctl.abort() }
  }, [uuid, fam])
  return (
    <button type="button" className="ex" onClick={() => s.loadWall(uuid, fam)} aria-label={`Open ${wallName(P)}, ${FAM_LABEL[fam]}`}>
      <canvas ref={ref} aria-hidden="true" />
      <b>{wallName(P)}</b><span>{FAM_LABEL[fam]}</span>
    </button>
  )
}

export default function Explore() {
  const s = useStudio()
  return (
    <section className="s" id="explore" aria-labelledby="ex-h">
      <div className="wrap">
        <h2 className="h2" id="ex-h">Explore</h2>
        <p className="lead">A few sample walls to start from. Tap one to open it above.</p>
        <div className="explore">
          <button type="button" className="ex surprise" onClick={() => { s.randomize(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} aria-label="Surprise me: a random seed">
            <i><IconDice /></i><b>Surprise me</b><span>A random seed</span>
          </button>
          {SAMPLES.map(x => <Sample key={x.uuid} {...x} />)}
        </div>
      </div>
    </section>
  )
}
