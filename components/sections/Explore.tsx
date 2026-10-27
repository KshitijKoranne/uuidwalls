'use client'

import { useEffect, useState } from 'react'
import { FAM_LABEL } from '@/lib/wall'
import { randomCard } from '@/lib/wall/random'
import WallThumb from '@/components/WallThumb'
import { useStudio } from '@/components/studio/context'
import { Eyebrow, H2, Lead } from './SectionHead'

const six = () => Array.from({ length: 6 }, randomCard)

export default function Explore() {
  const { loadWall } = useStudio()
  // Random on the client only: server and first client render agree on an empty list.
  const [items, setItems] = useState<Array<{ uuid: string; fam: string }>>([])
  useEffect(() => {
    const t = setTimeout(() => setItems(six()), 0)
    return () => clearTimeout(t)
  }, [])
  return (
    <section style={{ padding: '7rem 1.5rem', background: 'var(--ink3)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Eyebrow>Explore mode</Eyebrow>
        <H2>Not sure where to start?</H2>
        <Lead>Six random walls. Click any to load it — or shuffle again.</Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10, marginBottom: '1.5rem' }}>
          {items.map(d => (
            <WallThumb key={d.uuid} data={d} label={FAM_LABEL[d.fam]} aspect="16/10" onClick={() => loadWall(d.uuid, d.fam)} />
          ))}
        </div>
        <button onClick={() => setItems(six())} style={{ background: 'transparent', border: '1px solid var(--p15)', borderRadius: 'var(--r6)', padding: '11px 22px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--p55)', cursor: 'pointer', letterSpacing: '0.06em' }}>
          ↻ Shuffle six new walls
        </button>
      </div>
    </section>
  )
}
