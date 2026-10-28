import { FAQ } from '@/lib/content/faq'

export default function Faq() {
  const half = Math.ceil(FAQ.length / 2)
  return (
    <section className="s" aria-labelledby="faq-h">
      <div className="wrap">
        <h2 className="h2" id="faq-h" style={{ marginBottom: 'var(--s-6)' }}>Questions</h2>
        <div className="faq">
          {[FAQ.slice(0, half), FAQ.slice(half)].map((col, i) => (
            <div key={i}>{col.map(({ q, a }) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
          ))}
        </div>
      </div>
    </section>
  )
}
