import type { ReactNode } from 'react'

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--p30)', marginBottom: '1rem' }}>{children}</div>
}

export function H2({ children, mb = '0.875rem' }: { children: ReactNode; mb?: string }) {
  return <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.2rem,4.5vw,3.5rem)', fontWeight: 700, color: 'var(--paper)', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: mb }}>{children}</h2>
}

export function Lead({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: '1rem', fontWeight: 300, color: 'var(--p85)', maxWidth: 520, lineHeight: 1.75, marginBottom: '3.5rem' }}>{children}</p>
}
