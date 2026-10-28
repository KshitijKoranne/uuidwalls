'use client'

import { useState } from 'react'
import { FAM_LABEL } from '@/lib/wall'
import { GALLERY } from '@/lib/wall/presets'
import WallThumb from '@/components/WallThumb'
import { useStudio } from '@/components/studio/context'
import { Eyebrow, H2, Lead } from './SectionHead'

export default function Gallery() {
  const { loadWall } = useStudio()
  const [shown, setShown] = useState(4)
  return (
    <section style={{ padding: '7rem 1.5rem', background: 'var(--base)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Eyebrow>Community walls</Eyebrow>
        <H2>Walls from real machines</H2>
        <Lead>Generated from real UUIDs. Click any to load it.</Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 10, marginBottom: '2rem' }}>
          {GALLERY.slice(0, shown).map(d => (
            <WallThumb key={d.uuid} data={d} label={FAM_LABEL[d.fam]} sub={d.uuid.slice(0, 8) + '…'} aspect="16/10" onClick={() => loadWall(d.uuid, d.fam)} />
          ))}
        </div>
        {shown < GALLERY.length && (
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => setShown(n => n + 4)} style={{ background: 'transparent', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-sm)', padding: '12px 28px', fontFamily: 'var(--font)', fontSize: '13px', color: 'var(--soft)', cursor: 'pointer' }}>Load more walls</button>
          </div>
        )}
      </div>
    </section>
  )
}
