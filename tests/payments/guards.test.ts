import { describe, expect, it } from 'vitest'
import { assertPaymentsAllowed } from '@/lib/payments/env'
import { getPaymentProvider, PaymentsDisabledError } from '@/lib/payments'
import { safeNext } from '@/lib/auth/safeNext'
import { createRateLimiter } from '@/lib/rateLimit'

describe('environment guard: no real payments outside production', () => {
  const LIVE = 'rzp_live_abc', TEST = 'rzp_test_abc'
  it('Vercel preview: payments are off, whatever the key', () => {
    expect(() => assertPaymentsAllowed({ VERCEL_ENV: 'preview' }, TEST)).toThrow(PaymentsDisabledError)
    expect(() => assertPaymentsAllowed({ VERCEL_ENV: 'preview' }, LIVE)).toThrow(PaymentsDisabledError)
  })
  it('live key is refused anywhere except production (preview, development, local, unset)', () => {
    for (const where of ['development', undefined, 'staging'])
      expect(() => assertPaymentsAllowed({ VERCEL_ENV: where }, LIVE)).toThrow(/Live payment keys are refused/)
  })
  it('production accepts live and test keys; test key works locally', () => {
    expect(() => assertPaymentsAllowed({ VERCEL_ENV: 'production' }, LIVE)).not.toThrow()
    expect(() => assertPaymentsAllowed({ VERCEL_ENV: 'production' }, TEST)).not.toThrow()
    expect(() => assertPaymentsAllowed({}, TEST)).not.toThrow()
  })
  it('getPaymentProvider enforces it and rejects unknown providers', () => {
    expect(() => getPaymentProvider({ VERCEL_ENV: 'preview', RAZORPAY_KEY_ID: TEST })).toThrow(PaymentsDisabledError)
    expect(() => getPaymentProvider({ RAZORPAY_KEY_ID: LIVE })).toThrow(PaymentsDisabledError)
    expect(getPaymentProvider({ VERCEL_ENV: 'production', RAZORPAY_KEY_ID: LIVE }).id).toBe('razorpay')
    expect(() => getPaymentProvider({ PAYMENT_PROVIDER: 'dodo' })).toThrow(/not available/)
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
