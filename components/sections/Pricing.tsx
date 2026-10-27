'use client'

import { PRICE } from '@/lib/payments/catalog'
import { useStudio } from '@/components/studio/context'
import { Eyebrow, H2 } from './SectionHead'

const FREE = ['All 6 pattern families', 'Screen resolution download', 'Mobile resolution download', 'Permalink sharing', 'Watermark toggle']
const PAID = ['Everything in Free', '2K downloads (2560×1440)', '4K downloads (3840×2160)', 'Watermark-free export', 'All future resolutions']

export default function Pricing() {
  const { isPaid, unlock, accountsEnabled } = useStudio()
  return (
    <section style={{ padding: '7rem 1.5rem', background: 'var(--ink2)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <Eyebrow>Pricing</Eyebrow>
        <H2 mb="3rem">Simple. One-time.</H2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--p08)', border: '1px solid var(--p08)', borderRadius: 'var(--r14)', overflow: 'hidden', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--ink2)', padding: '2.5rem 2rem', textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--p30)', marginBottom: '0.75rem' }}>Free</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '1.5rem' }}>₹0</div>
            {FREE.map(f => (
              <div key={f} style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--p55)', padding: '5px 0', borderBottom: '1px solid var(--p08)', display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--p30)' }}>✓</span> {f}
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--ink3)', padding: '2.5rem 2rem', textAlign: 'left', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 20, padding: '3px 10px', fontFamily: 'var(--mono)', fontSize: '9px', color: '#4ade80' }}>Forever</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--p30)', marginBottom: '0.75rem' }}>Lifetime</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--paper)', marginBottom: '1.5rem' }}>{PRICE.display}</div>
            {PAID.map(f => (
              <div key={f} style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--p85)', padding: '5px 0', borderBottom: '1px solid var(--p08)', display: 'flex', gap: 8 }}>
                <span style={{ color: '#4ade80' }}>✓</span> {f}
              </div>
            ))}
            <button onClick={unlock} disabled={isPaid}
              style={{ marginTop: '1.5rem', width: '100%', background: 'var(--paper)', color: 'var(--ink)', border: 'none', borderRadius: 'var(--r6)', padding: '13px 20px', fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 500, cursor: isPaid ? 'default' : 'pointer', opacity: isPaid ? 0.5 : 1 }}>
              {isPaid ? 'Already unlocked' : accountsEnabled ? `Unlock for ${PRICE.display}` : 'Checkout is off on previews'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
