'use client'

import { useId, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import { createClient } from '@/lib/supabase/client'
import { PRICE } from '@/lib/payments/catalog'

interface AuthModalProps {
  onClose: () => void
  trigger: 'download' | 'unlock' // what triggered the modal
}

export default function AuthModal({ onClose, trigger }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const titleId = useId()

  const supabase = createClient()

  async function signInWithGoogle() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError('Google sign-in failed. Try email instead.')
      setLoading(false)
    }
  }

  async function sendMagicLink() {
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError('Failed to send link. Try again.')
      setLoading(false)
      return
    }
    setEmailSent(true)
    setLoading(false)
  }

  const heading = trigger === 'download' ? 'Unlock 2K & 4K Downloads' : 'Sign in to UUIDWalls'
  const subtext = trigger === 'download'
    ? `Sign in first — then pay once (${PRICE.display}) for lifetime 2K/4K access on any device.`
    : 'Sign in to manage your wallpaper and unlock high-resolution downloads.'

  return (
    <Dialog onClose={onClose} labelledBy={titleId}>
      {emailSent ? (
        <>
          <h2 id={titleId}>Check your inbox</h2>
          <p>We sent a magic link to <strong style={{ color: 'var(--ink)' }}>{email}</strong>. Click it to sign in — no password needed.</p>
          <p className="caption">Didn&apos;t receive it? Check spam or try again.</p>
          <button className="btn lg" type="button" onClick={() => setEmailSent(false)}>Try a different email</button>
        </>
      ) : (
        <>
          <h2 id={titleId}>{heading}</h2>
          <p>{subtext}</p>

          {error && (
            <div className="helper err" role="alert" style={{ marginTop: 0, marginBottom: 12 }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
              <span>{error}</span>
            </div>
          )}

          <button className="btn primary lg" type="button" style={{ width: '100%', marginBottom: 8 }} onClick={signInWithGoogle} disabled={loading}>
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          {!showEmail ? (
            <button className="btn lg" type="button" style={{ width: '100%' }} onClick={() => setShowEmail(true)}>Continue with email instead</button>
          ) : (
            <div>
              <label className="caption" htmlFor={`${titleId}-email`}>Email</label>
              <input
                id={`${titleId}-email`}
                type="email"
                className="field"
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                value={email}
                aria-invalid={!!error}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
                autoFocus
              />
              <button className="btn lg" type="button" style={{ width: '100%', marginTop: 8 }} onClick={sendMagicLink} disabled={loading}>
                {loading ? 'Sending…' : 'Send magic link'}
              </button>
            </div>
          )}

          <p className="caption" style={{ margin: '16px 0 0' }}>
            No password. No spam. Signing in creates your free account. 2K/4K is a one-time {PRICE.display} unlock after sign-in.
          </p>
        </>
      )}
    </Dialog>
  )
}
