import { createHmac, timingSafeEqual } from 'node:crypto'
import { PRICE } from '../catalog'
import type { CheckoutInput, CheckoutSession, PaymentProvider, ReturnResult } from '../types'

type Env = Record<string, string | undefined>
type Fetch = typeof fetch

export const RAZORPAY_PRODUCT = 'uuidwalls_2k4k_lifetime'
export const RETURN_PATH = '/api/checkout/return'

export interface RazorpayDeps { env: Env; fetch: Fetch }

const basicAuth = (env: Env) =>
  'Basic ' + Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/**
 * Razorpay Payment Links (hosted page + redirect), the flow the site has used since launch.
 * Behaviour is unchanged by the provider refactor; only the structure moved.
 */
export function createRazorpayProvider({ env, fetch: f }: RazorpayDeps): PaymentProvider {
  return {
    id: 'razorpay',

    async createCheckout({ userId, email, appUrl }: CheckoutInput): Promise<CheckoutSession> {
      const res = await f('https://api.razorpay.com/v1/payment_links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: basicAuth(env) },
        body: JSON.stringify({
          amount: PRICE.amountMinor,
          currency: PRICE.currency,
          accept_partial: false,
          description: 'UUIDWalls — Lifetime 2K/4K Downloads',
          customer: { email },
          notify: { email: true },
          reminder_enable: false,
          notes: { user_id: userId, product: RAZORPAY_PRODUCT }, // cross-checked on return
          callback_url: `${appUrl}${RETURN_PATH}?user_id=${userId}`,
          callback_method: 'get',
        }),
      })
      if (!res.ok) throw new Error(`Razorpay payment link failed (${res.status})`)
      const data = await res.json() as { short_url: string; id: string }
      return { url: data.short_url, providerRef: data.id }
    },

    async handleReturn(req: Request): Promise<ReturnResult> {
      const q = new URL(req.url).searchParams
      const paymentId = q.get('razorpay_payment_id')
      const linkId = q.get('razorpay_payment_link_id')
      const refId = q.get('razorpay_payment_link_reference_id')
      const status = q.get('razorpay_payment_link_status')
      const signature = q.get('razorpay_signature')
      const userIdParam = q.get('user_id')
      const isTestMode = !!env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')

      if (status !== 'paid') return { status: 'cancelled' }
      if (!paymentId || !linkId || !userIdParam) return { status: 'error', reason: 'missing params' }

      // Live mode: the HMAC is mandatory. Test mode skips it (Razorpay test mode does not always sign).
      if (!isTestMode) {
        if (!signature || !refId) return { status: 'error', reason: 'missing signature or reference id' }
        const expected = createHmac('sha256', env.RAZORPAY_KEY_SECRET ?? '')
          .update(`${linkId}|${refId}|${status}|${paymentId}`).digest('hex')
        if (!safeEqual(expected, signature)) return { status: 'error', reason: 'signature mismatch' }
      }

      // The user id in the URL is attacker-controlled: confirm it against Razorpay's own record.
      const res = await f(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(linkId)}`, { headers: { Authorization: basicAuth(env) } })
      if (!res.ok) return { status: 'error', reason: 'could not fetch payment link' }
      const link = await res.json() as { notes?: { user_id?: string } }
      const verified = link?.notes?.user_id
      if (!verified || verified !== userIdParam) return { status: 'error', reason: 'user mismatch' }

      return { status: 'paid', userId: verified, providerRef: linkId, paymentId }
    },
    // No handleWebhook: Razorpay is being replaced by Dodo Payments, whose provider will implement it.
  }
}
