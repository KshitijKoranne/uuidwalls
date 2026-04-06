'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  const supabase = createClient()

  async function signInWithGoogle() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
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
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError('Failed to send link. Try again.')
      setLoading(false)
      return
    }
    setEmailSent(true)
    setLoading(false)
  }

  const heading = trigger === 'download'
    ? 'Unlock 2K & 4K Downloads'
    : 'Sign in to UUIDWalls'

  const subtext = trigger === 'download'
    ? 'Sign in first — then pay once (₹99) for lifetime 2K/4K access on any device.'
    : 'Sign in to manage your wallpaper and unlock high-resolution downloads.'

  return (
    <div className="auth-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-box">
        <button className="auth-close" onClick={onClose} aria-label="Close">×</button>

        {emailSent ? (
          <>
            <div className="auth-title" style={{ fontSize: '1.5rem' }}>Check your inbox</div>
            <p className="auth-sub" style={{ marginTop: '0.75rem' }}>
              We sent a magic link to <strong style={{ color: 'var(--paper)' }}>{email}</strong>.
              Click it to sign in — no password needed.
            </p>
            <p className="auth-note">Didn&apos;t receive it? Check spam or try again.</p>
            <button className="btn-email" style={{ marginTop: '1rem' }} onClick={() => setEmailSent(false)}>
              Try a different email
            </button>
          </>
        ) : (
          <>
            <div className="auth-title">{heading}</div>
            <p className="auth-sub">{subtext}</p>

            {trigger === 'download' && (
              <div className="auth-price-badge">
                One-time · <strong>₹99</strong> · Lifetime 2K/4K
              </div>
            )}

            {error && (
              <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: '#f87171', marginBottom: '1rem' }}>
                {error}
              </p>
            )}

            <button className="btn-google" onClick={signInWithGoogle} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {loading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            {!showEmail ? (
              <button className="btn-email" onClick={() => setShowEmail(true)}>
                Continue with email instead
              </button>
            ) : (
              <div>
                <div className="email-input-wrap">
                  <input
                    type="email"
                    className="email-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMagicLink()}
                    autoFocus
                  />
                </div>
                <button className="btn-email" onClick={sendMagicLink} disabled={loading}>
                  {loading ? 'Sending…' : 'Send magic link'}
                </button>
              </div>
            )}

            <p className="auth-note">
              No password. No spam. Signing in creates your free account.<br />
              2K/4K is a one-time ₹99 unlock after sign-in.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
