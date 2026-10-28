'use client'

import { useId, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import { PRICE } from '@/lib/payments/catalog'

interface PayModalProps {
  userEmail: string
  onClose: () => void
  onSuccess: () => void
}

export default function PayModal({ userEmail, onClose }: PayModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const titleId = useId()

  async function handlePay() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create payment link')
      }

      if (data.alreadyPaid) {
        // Already paid — refresh page to pick up state
        window.location.reload()
        return
      }

      // Hosted payment page of the active provider; it sends the browser back to /api/checkout/return
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <Dialog onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId}>Unlock Full Resolution</h2>
      <p>One payment. Yours forever. On every device.</p>
      <p style={{ color: 'var(--ink)' }}><b>{PRICE.display}</b> once · Lifetime access</p>

      <ul style={{ listStyle: 'none', display: 'grid', gap: 8, margin: '0 0 16px', color: 'var(--soft)' }}>
        <li>✓ 2K downloads — 2560×1440, crisp on any monitor</li>
        <li>✓ 4K downloads — 3840×2160, Retina &amp; OLED ready</li>
        <li>✓ All 6 pattern families included</li>
        <li>✓ Works for every UUID you generate, forever</li>
        <li>✓ Watermark-free export option</li>
      </ul>

      {error && (
        <div className="helper err" role="alert" style={{ marginTop: 0, marginBottom: 12 }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
          <span>{error}</span>
        </div>
      )}

      <button className="btn accent lg" type="button" style={{ width: '100%' }} onClick={handlePay} disabled={loading} aria-busy={loading}>
        {loading ? 'Opening payment page…' : `Pay ${PRICE.display} — Unlock Forever`}
      </button>

      <p className="caption" style={{ margin: '12px 0 0' }}>
        Secured by Razorpay · UPI, Cards, NetBanking, Wallets. You will be redirected to Razorpay&apos;s secure payment page. Signed in as {userEmail}
      </p>
    </Dialog>
  )
}
