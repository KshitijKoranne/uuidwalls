import { describe, expect, it } from 'vitest'
import { assertPaymentsAllowed, isRazorpayLiveKey } from '@/lib/payments/env'
import { getPaymentProvider, PaymentsDisabledError, PROVIDERS } from '@/lib/payments'
import { safeNext } from '@/lib/auth/safeNext'
import { createRateLimiter } from '@/lib/rateLimit'

describe('environment guard: no real payments outside production', () => {
  it('Vercel preview: payments are off, whatever the key', () => {
    expect(() => assertPaymentsAllowed({ VERCEL_ENV: 'preview' }, false)).toThrow(PaymentsDisabledError)
    expect(() => assertPaymentsAllowed({ VERCEL_ENV: 'preview' }, true)).toThrow(PaymentsDisabledError)
  })
  it('live key is refused anywhere except production (preview, development, local, unset)', () => {
    for (const where of ['development', undefined, 'staging'])
      expect(() => assertPaymentsAllowed({ VERCEL_ENV: where }, true)).toThrow(/Live payment keys are refused/)
  })
  it('production accepts live and test keys; test key works locally', () => {
    expect(() => assertPaymentsAllowed({ VERCEL_ENV: 'production' }, true)).not.toThrow()
    expect(() => assertPaymentsAllowed({ VERCEL_ENV: 'production' }, false)).not.toThrow()
    expect(() => assertPaymentsAllowed({}, false)).not.toThrow()
  })
  it('live key detection ignores case and surrounding spaces', () => {
    for (const k of ['rzp_live_abc', ' rzp_live_abc', 'RZP_LIVE_ABC', '\trzp_live_x\n']) expect(isRazorpayLiveKey(k)).toBe(true)
    for (const k of ['rzp_test_abc', '', undefined, 'live_rzp_abc']) expect(isRazorpayLiveKey(k)).toBe(false)
  })
  it('getPaymentProvider enforces it and rejects unknown providers', () => {
    expect(() => getPaymentProvider({ VERCEL_ENV: 'preview', RAZORPAY_KEY_ID: 'rzp_test_abc' })).toThrow(PaymentsDisabledError)
    expect(() => getPaymentProvider({ RAZORPAY_KEY_ID: 'rzp_live_abc' })).toThrow(PaymentsDisabledError)
    expect(() => getPaymentProvider({ RAZORPAY_KEY_ID: ' RZP_LIVE_abc' })).toThrow(PaymentsDisabledError)
    expect(getPaymentProvider({ VERCEL_ENV: 'production', RAZORPAY_KEY_ID: 'rzp_live_abc' }).id).toBe('razorpay')
    expect(() => getPaymentProvider({ PAYMENT_PROVIDER: 'dodo' })).toThrow(/not available/)
  })
  it('EVERY registered provider is blocked on preview and refuses live keys outside production (a new provider cannot skip the guard)', () => {
    const ids = Object.keys(PROVIDERS)
    expect(ids.length).toBeGreaterThan(0)
    for (const id of ids) {
      expect(() => getPaymentProvider({ PAYMENT_PROVIDER: id, VERCEL_ENV: 'preview' })).toThrow(PaymentsDisabledError)
      const live = { PAYMENT_PROVIDER: id, RAZORPAY_KEY_ID: 'rzp_live_x' }
      if (PROVIDERS[id as keyof typeof PROVIDERS]!.usesLiveKey(live)) expect(() => getPaymentProvider(live)).toThrow(PaymentsDisabledError)
    }
  })
})

describe('safeNext (open redirect after sign-in)', () => {
  it.each([
    ['/', '/'], ['/privacy', '/privacy'], ['/?uuid=abc&p=voronoi', '/?uuid=abc&p=voronoi'], [null, '/'], [undefined, '/'], ['', '/'],
  ])('keeps same-site path %j', (input, out) => expect(safeNext(input as string)).toBe(out))
  it.each([
    '@evil.com', '//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)', 'evil.com', '/\u0000x', '/a\nb', '\\\\evil.com', '/%0d%0aSet-Cookie:x',
  ])('rejects %j', input => {
    const out = safeNext(input)
    // The only acceptable results are "/" or a path that stays on the same site.
    expect(new URL(out, 'https://site.test').origin).toBe('https://site.test')
    if (!input.startsWith('/%')) expect(out).toBe('/')
  })
})

describe('rate limiter', () => {
  it('allows 3 per window per key, then blocks, then resets', () => {
    let t = 0
    const limited = createRateLimiter(3, 1000, () => t)
    expect([limited('a'), limited('a'), limited('a'), limited('a')]).toEqual([false, false, false, true])
    expect(limited('b')).toBe(false)
    t = 1001
    expect(limited('a')).toBe(false)
  })
})
