import { FAQ } from '@/lib/content/faq'
import { Eyebrow, H2 } from './SectionHead'


export default function Faq() {
  return (
    <section style={{ padding: '7rem 1.5rem', background: 'var(--surface-1)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Eyebrow>Questions</Eyebrow>
        <H2 mb="3rem">Honest answers</H2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          {FAQ.map(({ q, a }) => (
            <div key={q} style={{ background: 'var(--surface-1)', padding: '2rem 1.75rem' }}>
              <h3 style={{ fontFamily: 'var(--font)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>{q}</h3>
              <div style={{ fontSize: '0.875rem', fontWeight: 300, color: 'var(--soft)', lineHeight: 1.75 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
