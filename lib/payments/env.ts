import { PaymentsDisabledError } from './types'

type Env = Record<string, string | undefined>

/**
 * Checkout only runs on the real production deployment, and live keys only ever work there.
 *  - Vercel Preview: payments are off for every provider (previews share production's Supabase project).
 *  - Any non-production environment (preview, local, unset): a live key is refused outright, so a
 *    mis-set environment variable can never take a real payment from a preview or a laptop.
 * `VERCEL_ENV` is set by Vercel on the server: 'production' | 'preview' | 'development'.
 * Called by getPaymentProvider() for EVERY registered provider, so a new provider cannot skip it.
 */
export function assertPaymentsAllowed(env: Env, usingLiveKey: boolean): void {
  const where = env.VERCEL_ENV
  if (where === 'preview') throw new PaymentsDisabledError('Payments are disabled on preview deployments')
  if (where !== 'production' && usingLiveKey) {
    throw new PaymentsDisabledError('Live payment keys are refused outside production')
  }
}

/** Razorpay live keys start with rzp_live_. Trimmed and case-insensitive so a sloppy value cannot slip past. */
export const isRazorpayLiveKey = (key: string | undefined) => !!key?.trim().toLowerCase().startsWith('rzp_live_')

export function appUrlFrom(env: Env): string {
  return (env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/\/+$/, '')
}
