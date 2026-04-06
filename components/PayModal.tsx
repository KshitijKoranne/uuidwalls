'use client'

import { useState } from 'react'

interface PayModalProps {
  userEmail: string
  onClose: () => void
  onSuccess: () => void
}

export default function PayModal({ userEmail, onClose }: PayModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/razorpay/create-order', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create payment link')
      }

      if (data.alreadyPaid) {
        // Already paid — refresh page to pick up state
        window.location.reload()
        return
      }

      // Redirect to Razorpay hosted payment page
      // Razorpay will redirect back to our callback URL after payment
      window.location.href = data.paymentUrl

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="auth-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-box">
        <button className="auth-close" onClick={onClose} aria-label="Close">×</button>

        <div className="auth-title">Unlock Full Resolution</div>
        <p className="auth-sub">One payment. Yours forever. On every device.</p>

        <div className="auth-price-badge">
          One-time · <strong>₹99</strong> · Lifetime access
        </div>

        <ul className="pay-features">
          <li>2K downloads — 2560×1440, crisp on any monitor</li>
          <li>4K downloads — 3840×2160, Retina & OLED ready</li>
          <li>All 6 pattern families included</li>
          <li>Works for every UUID you generate, forever</li>
          <li>Watermark-free export option</li>
        </ul>

        {error && (
          <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: '#f87171', marginBottom: '1rem', lineHeight: '1.6' }}>
            {error}
          </p>
        )}

        <button className="btn-pay" onClick={handlePay} disabled={loading}>
          {loading ? 'Opening payment page…' : 'Pay ₹99 — Unlock Forever'}
        </button>

        <p style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--p30)', letterSpacing: '0.04em', lineHeight: '1.7' }}>
          Secured by Razorpay · UPI, Cards, NetBanking, Wallets<br />
          You will be redirected to Razorpay&apos;s secure payment page<br />
          Signed in as {userEmail}
        </p>
      </div>
    </div>
  )
}
