import { createHmac } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { createRazorpayProvider } from '@/lib/payments/providers/razorpay'

const USER = '11111111-2222-3333-4444-555555555555'
const LINK = 'plink_abc123', PAY = 'pay_xyz789', REF = 'ref_1'
const LIVE_ENV = { RAZORPAY_KEY_ID: 'rzp_live_k', RAZORPAY_KEY_SECRET: 'topsecret' }
const TEST_ENV = { RAZORPAY_KEY_ID: 'rzp_test_k', RAZORPAY_KEY_SECRET: 'topsecret' }

const sign = (secret: string, status = 'paid') => createHmac('sha256', secret).update(`${LINK}|${REF}|${status}|${PAY}`).digest('hex')
const ret = (q: Record<string, string>) => new Request('https://x.test/api/checkout/return?' + new URLSearchParams(q))
const linkFetch = (notesUser: string | undefined, ok = true) => vi.fn(async () => new Response(JSON.stringify({ notes: { user_id: notesUser } }), { status: ok ? 200 : 500 })) as unknown as typeof fetch
const paidQuery = (over: Record<string, string> = {}) => ({ razorpay_payment_id: PAY, razorpay_payment_link_id: LINK, razorpay_payment_link_reference_id: REF, razorpay_payment_link_status: 'paid', razorpay_signature: sign('topsecret'), user_id: USER, ...over })

describe('razorpay provider: createCheckout', () => {
  it('creates an INR 99 payment link carrying the user id and a neutral return URL', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ short_url: 'https://rzp.io/i/abc', id: LINK }), { status: 200 })) as unknown as typeof fetch
    const p = createRazorpayProvider({ env: TEST_ENV, fetch: f })
    const s = await p.createCheckout({ userId: USER, email: 'a@b.co', appUrl: 'https://app.test' })
    expect(s).toEqual({ url: 'https://rzp.io/i/abc', providerRef: LINK })
    const [url, init] = (f as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0]
    expect(url).toBe('https://api.razorpay.com/v1/payment_links')
    const body = JSON.parse(init.body as string)
    expect(body).toMatchObject({ amount: 9900, currency: 'INR', accept_partial: false, notes: { user_id: USER }, callback_url: `https://app.test/api/checkout/return?user_id=${USER}`, customer: { email: 'a@b.co' } })
    expect((init.headers as Record<string, string>).Authorization).toBe('Basic ' + Buffer.from('rzp_test_k:topsecret').toString('base64'))
  })
  it('throws when Razorpay refuses', async () => {
    const f = vi.fn(async () => new Response('{}', { status: 400 })) as unknown as typeof fetch
    await expect(createRazorpayProvider({ env: TEST_ENV, fetch: f }).createCheckout({ userId: USER, email: null, appUrl: 'https://app.test' })).rejects.toThrow(/failed/)
  })
})

describe('razorpay provider: handleReturn (live mode)', () => {
  const live = (f: typeof fetch) => createRazorpayProvider({ env: LIVE_ENV, fetch: f })
  it('valid signature + matching Razorpay record = paid', async () => {
    expect(await live(linkFetch(USER)).handleReturn(ret(paidQuery()))).toEqual({ status: 'paid', userId: USER, providerRef: LINK, paymentId: PAY })
  })
  it('status other than paid = cancelled, without calling Razorpay', async () => {
    const f = linkFetch(USER)
    expect(await live(f).handleReturn(ret(paidQuery({ razorpay_payment_link_status: 'cancelled' })))).toEqual({ status: 'cancelled' })
    expect(f).not.toHaveBeenCalled()
  })
  it.each(['razorpay_payment_id', 'razorpay_payment_link_id', 'user_id'])('missing %s = error', async key => {
    const q = paidQuery(); delete (q as Record<string, string>)[key]
    expect((await live(linkFetch(USER)).handleReturn(ret(q))).status).toBe('error')
  })
  it('missing signature or reference id = error', async () => {
    expect(await live(linkFetch(USER)).handleReturn(ret(paidQuery({ razorpay_signature: '' })))).toMatchObject({ status: 'error' })
    expect(await live(linkFetch(USER)).handleReturn(ret(paidQuery({ razorpay_payment_link_reference_id: '' })))).toMatchObject({ status: 'error' })
  })
  it('wrong or differently sized signature = error (no exception)', async () => {
    expect(await live(linkFetch(USER)).handleReturn(ret(paidQuery({ razorpay_signature: sign('othersecret') })))).toMatchObject({ status: 'error', reason: 'signature mismatch' })
    expect(await live(linkFetch(USER)).handleReturn(ret(paidQuery({ razorpay_signature: 'abc' })))).toMatchObject({ status: 'error', reason: 'signature mismatch' })
  })
  it('a crafted ?user_id for someone else is refused (Razorpay record says another user)', async () => {
    expect(await live(linkFetch('99999999-0000-0000-0000-000000000000')).handleReturn(ret(paidQuery()))).toMatchObject({ status: 'error', reason: 'user mismatch' })
    expect(await live(linkFetch(undefined)).handleReturn(ret(paidQuery()))).toMatchObject({ status: 'error', reason: 'user mismatch' })
  })
  it('Razorpay lookup failing = error', async () => {
    expect(await live(linkFetch(USER, false)).handleReturn(ret(paidQuery()))).toMatchObject({ status: 'error' })
  })
})

describe('razorpay provider: test mode', () => {
  it('skips the signature (today\'s behaviour) but still cross-checks the user', async () => {
    const p = createRazorpayProvider({ env: TEST_ENV, fetch: linkFetch(USER) })
    expect(await p.handleReturn(ret(paidQuery({ razorpay_signature: 'garbage' })))).toMatchObject({ status: 'paid' })
    const bad = createRazorpayProvider({ env: TEST_ENV, fetch: linkFetch('someone-else') })
    expect(await bad.handleReturn(ret(paidQuery({ razorpay_signature: 'garbage' })))).toMatchObject({ status: 'error' })
  })
})
