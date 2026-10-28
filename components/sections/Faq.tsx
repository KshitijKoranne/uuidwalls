import { FAQ } from '@/lib/content/faq'
import { Eyebrow, H2 } from './SectionHead'


export default function Faq() {
  return (
    <section style={{ padding: '7rem 1.5rem', background: 'var(--ink2)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Eyebrow>Questions</Eyebrow>
        <H2 mb="3rem">Honest answers</H2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--p08)', border: '1px solid var(--p08)', borderRadius: 'var(--r14)', overflow: 'hidden' }}>
          {FAQ.map(({ q, a }) => (
            <div key={q} style={{ background: 'var(--ink2)', padding: '2rem 1.75rem' }}>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.5rem' }}>{q}</h3>
              <div style={{ fontSize: '0.875rem', fontWeight: 300, color: 'var(--p85)', lineHeight: 1.75 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
