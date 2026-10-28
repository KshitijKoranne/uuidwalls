'use client'

import { FAM_LABEL } from '@/lib/wall'
import { SHOWCASE } from '@/lib/wall/presets'
import WallThumb from '@/components/WallThumb'
import { useStudio } from '@/components/studio/context'
import { Eyebrow, H2, Lead } from './SectionHead'

export default function Showcase() {
  const { loadWall } = useStudio()
  return (
    <section style={{ padding: '7rem 1.5rem', background: 'var(--base)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Eyebrow>Six families</Eyebrow>
        <H2>Same UUID. Six faces.</H2>
        <Lead>Every pattern family produces a completely different aesthetic from the same seed.</Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          {SHOWCASE.map(d => (
            <WallThumb key={d.fam} data={d} label={FAM_LABEL[d.fam]} onClick={() => loadWall(d.uuid, d.fam)} />
          ))}
        </div>
      </div>
    </section>
  )
}
