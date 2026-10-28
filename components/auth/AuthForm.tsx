'use client'

import { useEffect, useId, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ErrorLine = ({ text }: { text: string }) => (
  <div className="helper err" role="alert" style={{ marginTop: 0, marginBottom: 12 }}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
    <span>{text}</span>
  </div>
)

/** Google or email link (SPEC 8.6). `beforeRedirect` runs just before the browser leaves, to store the user's intent. */
export default function AuthForm({ beforeRedirect, headingId }: { beforeRedirect?: () => void; headingId?: string }) {
  const [email, setEmail] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [wait, setWait] = useState(0)
  const id = useId()
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  useEffect(() => { // resend only after 30 s
    if (wait <= 0) return
    const t = setTimeout(() => setWait(w => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  async function google() {
    setBusy(true); setError('')
    beforeRedirect?.()
    const { error } = await createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
    if (error) { setError('Google sign-in didn’t work. Use email instead.'); setBusy(false) }
  }

  async function sendLink() {
    if (!emailOk) { setError('Enter a valid email address.'); return }
    setBusy(true); setError('')
    beforeRedirect?.()
    const { error } = await createClient().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
    setBusy(false)
    if (error) { setError('We couldn’t send the link. Try again.'); return }
    setSent(true); setWait(30)
  }

  if (sent) {
    return (
      <div role="status">
        <h3 id={headingId} style={{ fontSize: 20, lineHeight: 1.3, letterSpacing: '-.02em', margin: '0 0 8px' }}>Check your inbox</h3>
        <p>We sent a sign-in link to <b style={{ color: 'var(--ink)' }}>{email.trim()}</b>. It works once.</p>
        {wait === 0 && <p className="caption">Nothing yet? Check your spam folder.</p>}
        <div className="row" style={{ display: 'flex', gap: 8 }}>
          <button className="btn lg" type="button" style={{ flex: 1 }} onClick={sendLink} disabled={wait > 0 || busy}>{wait > 0 ? `Resend in 0:${String(wait).padStart(2, '0')}` : 'Resend link'}</button>
          <button className="btn ghost lg" type="button" style={{ flex: 1 }} onClick={() => { setSent(false); setError('') }}>Use a different email</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {error && <ErrorLine text={error} />}
      <button className="btn primary lg" type="button" style={{ width: '100%', marginBottom: 8 }} onClick={google} disabled={busy} aria-busy={busy}>
        <svg viewBox="0 0 18 18" aria-hidden="true" style={{ width: 18, height: 18, stroke: 'none' }}>
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
        </svg>
        {busy && !showEmail ? 'Redirecting…' : 'Continue with Google'}
      </button>
      {!showEmail ? (
        <button className="btn lg" type="button" style={{ width: '100%' }} onClick={() => setShowEmail(true)}>Continue with email</button>
      ) : (
        <div>
          <label className="caption" htmlFor={`${id}-email`}>Email</label>
          <input id={`${id}-email`} type="email" className="field" placeholder="you@example.com" autoComplete="email" inputMode="email" autoFocus
            value={email} aria-invalid={!!error && !emailOk} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendLink()} />
          <button className="btn lg" type="button" style={{ width: '100%', marginTop: 8 }} onClick={sendLink} disabled={busy} aria-busy={busy}>{busy ? 'Sending…' : 'Send link'}</button>
        </div>
      )}
      <p className="caption" style={{ margin: '16px 0 0' }}>No password. We use your email only to sign you in.</p>
    </div>
  )
}
