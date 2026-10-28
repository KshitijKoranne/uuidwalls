import { describe, expect, it, vi } from 'vitest'
import { handleCheckout, handleReturn, handleWebhook, type CheckoutDeps } from '@/lib/payments/handlers'
import { grantEntitlement } from '@/lib/payments/entitlements'
import { InvalidWebhookError, PaymentsDisabledError, type PaymentProvider } from '@/lib/payments/types'

const APP = 'https://app.test'
const USER = { id: 'u1', email: 'a@b.co' }
const fact = { userId: 'u1', providerRef: 'ref1', paymentId: 'pay1' }

const fakeProvider = (over: Partial<PaymentProvider> = {}): PaymentProvider => ({
  id: 'razorpay',
  createCheckout: vi.fn(async () => ({ url: 'https://pay.test/x', providerRef: 'ref1' })),
  handleReturn: vi.fn(async () => ({ status: 'paid' as const, ...fact })),
  ...over,
})
const post = (headers: Record<string, string> = {}) => new Request(`${APP}/api/checkout`, { method: 'POST', headers })
const deps = (over: Partial<CheckoutDeps> = {}): CheckoutDeps => ({
  env: { NEXT_PUBLIC_APP_URL: APP }, getUser: async () => USER, alreadyPaid: async () => false,
  provider: () => fakeProvider(), isRateLimited: () => false, ...over,
})

describe('POST /api/checkout', () => {
  it('returns the hosted payment URL for a signed-in user', async () => {
    const r = await handleCheckout(post({ origin: APP }), deps())
    expect(r.status).toBe(200); expect(await r.json()).toEqual({ url: 'https://pay.test/x' })
  })
  it('403 on a foreign Origin (CSRF), 401 when signed out, 429 when rate limited', async () => {
    expect((await handleCheckout(post({ origin: 'https://evil.test' }), deps())).status).toBe(403)
    expect((await handleCheckout(post(), deps({ getUser: async () => null }))).status).toBe(401)
    expect((await handleCheckout(post(), deps({ isRateLimited: () => true }))).status).toBe(429)
  })
  it('503 when payments are disabled (preview, live key outside production)', async () => {
    const r = await handleCheckout(post(), deps({ provider: () => { throw new PaymentsDisabledError('off') } }))
    expect(r.status).toBe(503); expect(await r.json()).toEqual({ error: 'off' })
  })
  it('does not create a second checkout for someone who already paid', async () => {
    const p = fakeProvider()
    const r = await handleCheckout(post(), deps({ alreadyPaid: async () => true, provider: () => p }))
    expect(await r.json()).toEqual({ alreadyPaid: true }); expect(p.createCheckout).not.toHaveBeenCalled()
  })
  it('500 with a generic message when the provider fails', async () => {
    const p = fakeProvider({ createCheckout: async () => { throw new Error('secret detail') } })
    const r = await handleCheckout(post(), deps({ provider: () => p }))
    expect(r.status).toBe(500); expect(JSON.stringify(await r.json())).not.toContain('secret detail')
  })
})

describe('missing NEXT_PUBLIC_APP_URL', () => {
  it('checkout and return answer 503 instead of throwing', async () => {
    expect((await handleCheckout(post(), deps({ env: {} }))).status).toBe(503)
    const r = await handleReturn(new Request(`${APP}/api/checkout/return`), { env: {}, provider: () => fakeProvider(), grant: async () => ({ ok: true }) })
    expect(r.status).toBe(503)
  })
})

describe('GET /api/checkout/return', () => {
  const run = (provider: PaymentProvider, grant = async () => ({ ok: true })) =>
    handleReturn(new Request(`${APP}/api/checkout/return`), { env: { NEXT_PUBLIC_APP_URL: APP }, provider: () => provider, grant })
  const where = (r: Response) => r.headers.get('location')
  it('paid and recorded -> ?payment=success', async () => { expect(where(await run(fakeProvider()))).toBe(`${APP}/?payment=success`) })
  it('grants exactly the verified fact', async () => {
    const grant = vi.fn(async () => ({ ok: true })); await run(fakeProvider(), grant); expect(grant).toHaveBeenCalledWith(fact)
  })
  it('cancelled -> ?payment=cancelled and nothing is granted', async () => {
    const grant = vi.fn(async () => ({ ok: true }))
    expect(where(await run(fakeProvider({ handleReturn: async () => ({ status: 'cancelled' }) }), grant))).toBe(`${APP}/?payment=cancelled`)
    expect(grant).not.toHaveBeenCalled()
  })
  it('verification error, database failure, provider crash or disabled payments -> ?payment=error, nothing granted', async () => {
    const grant = vi.fn(async () => ({ ok: true }))
    expect(where(await run(fakeProvider({ handleReturn: async () => ({ status: 'error', reason: 'x' }) }), grant))).toBe(`${APP}/?payment=error`)
    expect(where(await run(fakeProvider(), async () => ({ ok: false })))).toBe(`${APP}/?payment=error`)
    expect(where(await run(fakeProvider({ handleReturn: async () => { throw new Error('boom') } })))).toBe(`${APP}/?payment=error`)
    const off = await handleReturn(new Request(`${APP}/x`), { env: { NEXT_PUBLIC_APP_URL: APP }, provider: () => { throw new PaymentsDisabledError('off') }, grant })
    expect(where(off)).toBe(`${APP}/?payment=error`)
    expect(grant).not.toHaveBeenCalled()
  })
})

// This block is the "Dodo is a drop-in" proof: a provider that only implements handleWebhook gets a
// complete, tested route with no other code changes.
describe('POST /api/payments/webhook', () => {
  const hook = (provider: PaymentProvider, grant = async () => ({ ok: true })) =>
    handleWebhook(new Request(`${APP}/api/payments/webhook`, { method: 'POST', body: '{}' }), { provider: () => provider, grant })
  it('501 for providers without webhooks (Razorpay today)', async () => { expect((await hook(fakeProvider())).status).toBe(501) })
  it('a verified paid event marks the user paid', async () => {
    const grant = vi.fn(async () => ({ ok: true }))
    const r = await hook(fakeProvider({ handleWebhook: async () => ({ status: 'paid', ...fact }) }), grant)
    expect(r.status).toBe(200); expect(grant).toHaveBeenCalledWith(fact)
  })
  it('bad signature -> 400 and nothing granted', async () => {
    const grant = vi.fn(async () => ({ ok: true }))
    const r = await hook(fakeProvider({ handleWebhook: async () => { throw new InvalidWebhookError() } }), grant)
    expect(r.status).toBe(400); expect(grant).not.toHaveBeenCalled()
  })
  it('ignored events -> 200 without granting; database failure -> 500 so the provider retries', async () => {
    const grant = vi.fn(async () => ({ ok: true }))
    expect((await hook(fakeProvider({ handleWebhook: async () => ({ status: 'ignored', reason: 'refund' }) }), grant)).status).toBe(200)
    expect(grant).not.toHaveBeenCalled()
    expect((await hook(fakeProvider({ handleWebhook: async () => ({ status: 'paid', ...fact }) }), async () => ({ ok: false }))).status).toBe(500)
  })
  it('503 when payments are disabled', async () => {
    const r = await handleWebhook(new Request(`${APP}/w`, { method: 'POST' }), { provider: () => { throw new PaymentsDisabledError('off') }, grant: async () => ({ ok: true }) })
    expect(r.status).toBe(503)
  })
})

describe('grantEntitlement', () => {
  const adminWith = (upsertError: { message: string } | null = null) => {
    const upsert = vi.fn(async () => ({ error: upsertError }))
    const admin = { auth: { admin: { getUserById: vi.fn(async () => ({ data: { user: { email: 'a@b.co' } } })) } }, from: vi.fn(() => ({ upsert })) }
    return { admin: admin as never, upsert, from: admin.from }
  }
  it('upserts one row per user with the existing column names', async () => {
    const { admin, upsert, from } = adminWith()
    expect(await grantEntitlement(admin, fact, new Date('2026-10-27T00:00:00Z'))).toEqual({ ok: true })
    expect(from).toHaveBeenCalledWith('paid_users')
    expect(upsert).toHaveBeenCalledWith({ user_id: 'u1', email: 'a@b.co', razorpay_order_id: 'ref1', razorpay_payment_id: 'pay1', paid_at: '2026-10-27T00:00:00.000Z' }, { onConflict: 'user_id' })
  })
  it('reports database errors', async () => {
    expect(await grantEntitlement(adminWith({ message: 'nope' }).admin, fact)).toEqual({ ok: false, error: 'nope' })
  })
})
