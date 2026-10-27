import { Eyebrow, H2 } from './SectionHead'

const QA = [
  { q: 'Does this send my UUID anywhere?', a: 'No. Everything runs in your browser. Your UUID is never transmitted. There is no backend, no analytics on your input.' },
  { q: 'What resolution will my wallpaper be?', a: 'You choose. Screen res matches your display. 2K exports at 2560×1440. 4K at 3840×2160. Mobile at 1290×2796.' },
  { q: 'Can two machines get the same wall?', a: 'Only if they share a UUID — cryptographically impossible by design. Your wall is provably yours.' },
  { q: 'Will my wall look the same next year?', a: 'Yes. The algorithm is deterministic and versioned. Same UUID, same result, always.' },
  { q: 'What does the ₹99 unlock?', a: '2K and 4K resolution downloads, permanently, for your account. Screen and mobile downloads remain free forever.' },
  { q: 'Is a native app coming?', a: 'Yes. Native apps will read your UUID automatically and set the wallpaper with one tap. Web first, apps soon.' },
]

export default function Faq() {
  return (
    <section style={{ padding: '7rem 1.5rem', background: 'var(--ink2)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Eyebrow>Questions</Eyebrow>
        <H2 mb="3rem">Honest answers</H2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--p08)', border: '1px solid var(--p08)', borderRadius: 'var(--r14)', overflow: 'hidden' }}>
          {QA.map(({ q, a }) => (
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
