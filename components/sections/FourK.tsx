'use client'

import Link from 'next/link'
import { useStudio } from '@/components/studio/context'
import { PRICE } from '@/lib/payments/catalog'

export default function FourK() {
  const s = useStudio()
  return (
    <section className="s alt" aria-labelledby="fk-h">
      <div className="wrap four">
        <div>
          <h2 className="h2" id="fk-h" style={{ marginBottom: 'var(--s-4)' }}>Free to try, 2K and 4K when you want them</h2>
          <ul><li>Screen and Phone downloads are free</li><li>2K (2560×1440) and 4K (3840×2160) are one unlock</li><li>No subscription, works on every device you sign in on</li></ul>
        </div>
        <div>
          <p className="price">{PRICE.display}</p>
          <p className="caption" style={{ margin: '0 0 16px' }}>once, for your account. <Link href="/refund" style={{ color: 'var(--soft)' }}>Refund policy</Link></p>
          {s.isPaid
            ? <p className="status" role="status"><i className="dot" />2K &amp; 4K unlocked</p>
            : <button className="btn accent lg" type="button" onClick={() => s.openDialog({ kind: 'unlock', size: '4k', step: 'intro' })}>Unlock 2K &amp; 4K</button>}
        </div>
      </div>
    </section>
  )
}
