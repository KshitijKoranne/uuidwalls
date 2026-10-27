import { Eyebrow, H2, Lead } from './SectionHead'

const STEPS = [
  { n: '01', h: 'Find your UUID', p: 'Every device has one. Mac, Windows, Linux, iPhone, Android — each carries a UUID that is cryptographically unique.' },
  { n: '02', h: 'Enter & render', p: 'Paste it in. The algorithm maps every hex character to visual parameters — hue, density, angle, pattern family.' },
  { n: '03', h: 'Pick your pattern', p: 'Six families: Flow Field, Voronoi, Geometric, ASCII, Mandala, Wave. Same UUID, six different faces.' },
  { n: '04', h: 'Download your wall', p: 'Screen, mobile, 2K, or 4K. Renders locally — your UUID never leaves your browser.' },
]

export default function HowItWorks() {
  return (
    <section style={{ padding: '7rem 1.5rem', background: 'var(--ink2)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Eyebrow>How it works</Eyebrow>
        <H2>Mathematically yours.</H2>
        <Lead>Your UUID is not random to us — it is the seed. Same input, same output. Always.</Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 1, background: 'var(--p08)', border: '1px solid var(--p08)', borderRadius: 'var(--r14)', overflow: 'hidden' }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ background: 'var(--ink2)', padding: '2.25rem 1.75rem' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '4rem', fontWeight: 700, color: 'rgba(240,237,232,0.05)', lineHeight: 1, marginBottom: '1.25rem', letterSpacing: '-0.04em' }}>{s.n}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '0.6rem' }}>{s.h}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--p85)', lineHeight: 1.75, fontWeight: 300 }}>{s.p}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
