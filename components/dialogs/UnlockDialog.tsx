'use client'

import { useEffect, useId, useRef, useState } from 'react'
import AuthForm from '@/components/auth/AuthForm'
import Dialog from '@/components/ui/Dialog'
import { useStudio, type UnlockStep } from '@/components/studio/context'
import { PRICE } from '@/lib/payments/catalog'
import { isAbort, wallRenderer } from '@/lib/wall/client'

const SIZES = [{ k: '2k', label: '2K', dim: '2560×1440' }, { k: '4k', label: '4K', dim: '3840×2160' }] as const

/** The paywall moment (SPEC 8.4): value first, identity second, money third. The label never names a payment provider. */
export default function UnlockDialog() {
  const s = useStudio()
  const id = useId()
  const d = s.dialog as { kind: 'unlock'; size: 'screen-free' | '2k' | '4k'; step: UnlockStep }
  const [step, setStep] = useState<UnlockStep>(d.step)
  const [size, setSize] = useState<'2k' | '4k'>(d.size === '2k' ? '2k' : '4k')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const previewRef = useRef<HTMLCanvasElement>(null)
  const stepNo = step === 'intro' ? 1 : step === 'signin' ? 2 : 3
  const showSteps = step === 'intro' || step === 'signin' || step === 'pay'

  // a real preview of this wall (SPEC 8.4)
  useEffect(() => {
    const c = previewRef.current; if (!c || step !== 'intro') return
    const ctl = new AbortController()
    wallRenderer.draw(c, { P: s.P, w: 640, h: 360, hq: false }, { lane: 'thumb', signal: ctl.signal }).catch(e => { if (!isAbort(e)) console.warn('preview failed') })
    return () => ctl.abort()
  }, [s.P, step])

  // coming back from the payment page: wait for the unlock to land
  useEffect(() => {
    if (step !== 'confirming') return
    let alive = true
    void s.confirmPaid().then(ok => { if (alive) setStep(ok ? 'success' : 'pending') })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per entry to this step
  }, [step])

  // if the user is already signed in there is nothing to do in step 2
  const next = () => setStep(s.user ? 'pay' : 'signin')
  const storeIntent = (stage: string) => { try { sessionStorage.setItem('uw_intent', JSON.stringify({ action: 'download', size, token: s.token, stage })) } catch { /* no storage */ } }

  async function pay() {
    setPaying(true); setPayError(''); storeIntent('pay')
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'checkout')
      if (data.alreadyPaid) { s.markPaid(); setStep('success'); return }
      window.location.href = data.url
    } catch (e) {
      setPayError(e instanceof Error && e.message !== 'checkout' ? e.message : 'The payment page had a problem. If you were charged, write to kjrlabs9@gmail.com with your email and we’ll sort it out.')
      setPaying(false)
    }
  }

  const title = step === 'confirming' ? 'Confirming your payment…' : step === 'success' ? '✓ 2K & 4K unlocked' : step === 'pending' ? 'Still confirming' : step === 'cancelled' ? 'Payment cancelled' : step === 'error' ? 'Something went wrong' : step === 'signin' ? 'Sign in to unlock 2K & 4K' : step === 'pay' ? 'Pay once, keep 2K & 4K' : 'Unlock 2K & 4K'

  return (
    <Dialog onClose={s.closeDialog} labelledBy={id} locked={paying || step === 'confirming'}>
      {showSteps && <div className="steps" role="img" aria-label={`Step ${stepNo} of 3`}>{[1, 2, 3].map(n => <i key={n} className={n <= stepNo ? 'on' : ''} />)}</div>}
      <h2 id={id} className={step === 'success' ? 'success-title' : undefined}>{title}</h2>

      {step === 'intro' && (
        <>
          <div className="preview"><canvas ref={previewRef} role="img" aria-label={`Preview of ${s.name}`} /><span className="badge">{size.toUpperCase()}</span></div>
          <p>2K and 4K for every wall you make. {PRICE.display} once. No subscription.</p>
          <div className="sizes" role="radiogroup" aria-label="Size">
            {SIZES.map(z => (
              <div key={z.k} className={size === z.k ? 'on' : ''} role="radio" aria-checked={size === z.k} tabIndex={0} onClick={() => setSize(z.k)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSize(z.k))}>
                <b>{z.label}</b><span>{z.dim}</span>
              </div>
            ))}
          </div>
          <div className="row">
            <button className="btn primary lg" type="button" onClick={next}>Continue</button>
            <button className="btn lg" type="button" onClick={() => { s.chooseSize('screen'); s.closeDialog(); s.showToast('Screen selected. Tap Download.') }}>Download Phone or Screen free instead</button>
          </div>
          <p className="caption" style={{ margin: '12px 0 0' }}><a href="/refund">Refund policy</a></p>
        </>
      )}

      {step === 'signin' && (
        <>
          <p>We use your email only to sign you in.</p>
          <AuthForm beforeRedirect={() => storeIntent('signin')} />
        </>
      )}

      {step === 'pay' && (
        <>
          <p>2K &amp; 4K lifetime · <b style={{ color: 'var(--ink)' }}>{PRICE.display}</b><br /><span className="caption">Paying as {s.user?.email ?? 'your account'}</span></p>
          {!s.accountsEnabled && <div className="banner warn" style={{ margin: '0 0 12px' }}>Preview build: payments are off.</div>}
          {payError && <div className="helper err" role="alert" style={{ marginTop: 0, marginBottom: 12 }}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg><span>{payError}</span></div>}
          <button className="btn accent lg" type="button" style={{ width: '100%' }} onClick={pay} disabled={paying || !s.accountsEnabled} aria-busy={paying}
            title={!s.accountsEnabled ? 'Payments are off on preview builds' : undefined}>
            {paying ? <><span className="spin" /> Opening…</> : `Pay ${PRICE.display}`}
          </button>
          <p className="caption" style={{ margin: '12px 0 0' }}>You’ll go to our secure payment page. Payment methods are shown there.</p>
        </>
      )}

      {step === 'confirming' && <p role="status"><span className="spin" style={{ display: 'inline-block', verticalAlign: -3, marginRight: 8 }} />This usually takes a few seconds.</p>}

      {step === 'success' && (
        <>
          <p>Your download is starting.</p>
          <button className="btn primary lg" type="button" style={{ width: '100%' }} onClick={s.closeDialog}>Done</button>
        </>
      )}

      {step === 'pending' && (
        <>
          <p>We have your payment and are still confirming. This can take a minute. We’ll unlock 2K and 4K as soon as it lands. Check again in a moment, or write to kjrlabs9@gmail.com with your email.</p>
          <div className="row"><button className="btn primary lg" type="button" onClick={() => setStep('confirming')}>Check again</button><button className="btn lg" type="button" onClick={s.closeDialog}>Close</button></div>
        </>
      )}

      {step === 'cancelled' && (
        <>
          <p>You weren’t charged.</p>
          <div className="row"><button className="btn primary lg" type="button" onClick={() => setStep(s.user ? 'pay' : 'intro')}>Try again</button><button className="btn lg" type="button" onClick={s.closeDialog}>Not now</button></div>
        </>
      )}

      {step === 'error' && (
        <>
          <p>The payment page had a problem. If you were charged, write to kjrlabs9@gmail.com with your email and we’ll sort it out.</p>
          <div className="row"><button className="btn primary lg" type="button" onClick={() => setStep(s.user ? 'pay' : 'intro')}>Try again</button><button className="btn lg" type="button" onClick={s.closeDialog}>Close</button></div>
        </>
      )}
    </Dialog>
  )
}
