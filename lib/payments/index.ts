import { assertPaymentsAllowed } from './env'
import { createRazorpayProvider } from './providers/razorpay'
import { PaymentsDisabledError, type PaymentProvider, type ProviderId } from './types'

type Env = Record<string, string | undefined>

/**
 * The one place that decides which provider is live. Swapping Razorpay for Dodo Payments means:
 * add `providers/dodo.ts` implementing PaymentProvider, register it below, set PAYMENT_PROVIDER=dodo.
 * Routes, entitlements and UI do not change.
 */
export function getPaymentProvider(env: Env = process.env, fetchImpl: typeof fetch = fetch): PaymentProvider {
  const id = (env.PAYMENT_PROVIDER ?? 'razorpay') as ProviderId
  switch (id) {
    case 'razorpay':
      assertPaymentsAllowed(env, env.RAZORPAY_KEY_ID)
      return createRazorpayProvider({ env, fetch: fetchImpl })
    default:
      throw new PaymentsDisabledError(`Payment provider "${id}" is not available`)
  }
}

export { PaymentsDisabledError } from './types'
export type { PaymentProvider, ProviderId } from './types'
