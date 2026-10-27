import Link from 'next/link'

const link = { fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p30)', textDecoration: 'none', letterSpacing: '0.06em' } as const

export default function Footer() {
  return (
    <footer style={{ background: 'var(--ink)', borderTop: '1px solid var(--p08)', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--paper)' }}>UUIDWalls</div>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <a href="mailto:kjrlabs9@gmail.com" style={link}>Contact</a>
        <a href="https://kjrlabs.in" target="_blank" rel="noopener noreferrer" style={link}>KJR Labs</a>
        <Link href="/privacy" style={link}>Privacy</Link>
        <Link href="/terms" style={link}>Terms</Link>
        <Link href="/refund" style={link}>Refund</Link>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--p55)', letterSpacing: '0.04em' }}>Deterministic · Private · Universal</div>
    </footer>
  )
}
