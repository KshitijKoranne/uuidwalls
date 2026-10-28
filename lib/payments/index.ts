import { assertPaymentsAllowed, isRazorpayLiveKey } from './env'
import { createRazorpayProvider } from './providers/razorpay'
import { PaymentsDisabledError, type PaymentProvider, type ProviderId } from './types'

type Env = Record<string, string | undefined>

interface Registration {
  /** Is the configured credential a live (real money) key? Checked against the environment guard. */
  usesLiveKey(env: Env): boolean
  create(env: Env, fetchImpl: typeof fetch): PaymentProvider
}

/**
 * Every provider is registered here. Swapping Razorpay for Dodo Payments means: add
 * `providers/dodo.ts` implementing PaymentProvider, add one entry below, set PAYMENT_PROVIDER=dodo.
 * The preview / live-key guard runs for every entry automatically; routes, entitlements and UI do not change.
 */
export const PROVIDERS: Partial<Record<ProviderId, Registration>> = {
  razorpay: {
    usesLiveKey: env => isRazorpayLiveKey(env.RAZORPAY_KEY_ID),
    create: (env, fetchImpl) => createRazorpayProvider({ env, fetch: fetchImpl }),
  },
}

export function getPaymentProvider(env: Env = process.env, fetchImpl: typeof fetch = fetch): PaymentProvider {
  const id = (env.PAYMENT_PROVIDER?.trim() || 'razorpay') as ProviderId
  const reg = PROVIDERS[id]
  if (!reg) throw new PaymentsDisabledError(`Payment provider "${id}" is not available`)
  assertPaymentsAllowed(env, reg.usesLiveKey(env))
  return reg.create(env, fetchImpl)
}

export { PaymentsDisabledError } from './types'
export type { PaymentProvider, ProviderId } from './types'
