'use client'

import { useStudio } from './context'
import { PRICE } from '@/lib/payments/catalog'

const linkBtn = { fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--p55)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em' } as const

export default function Nav() {
  const s = useStudio()
  return (
    <nav style={{ position: 'fixed', inset: '0 0 auto', zIndex: 100, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', background: 'rgba(10,9,8,0.75)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--p08)' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--paper)', letterSpacing: '-0.01em' }}>
        UUID<em style={{ fontStyle: 'italic', opacity: 0.55 }}>Walls</em>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {s.authChecked && s.accountsEnabled && (
          <>
            {s.isPaid && <span className="unlock-badge">2K/4K Unlocked</span>}
            {s.user ? (
              <button onClick={s.signOut} style={linkBtn}>Sign out</button>
            ) : (
              <button onClick={() => s.openAuth('unlock')} style={linkBtn}>Sign in</button>
            )}
            {!s.isPaid && (
              <button onClick={s.unlock}
                style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--paper)', background: 'var(--p08)', border: '1px solid var(--p15)', borderRadius: 20, padding: '5px 14px', cursor: 'pointer', letterSpacing: '0.04em' }}>
                Unlock 2K/4K · {PRICE.display}
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  )
}
