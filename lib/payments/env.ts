import { PaymentsDisabledError } from './types'

type Env = Record<string, string | undefined>

/**
 * Checkout only runs on the real production deployment, and live keys only ever work there.
 *  - Vercel Preview: payments are off (previews share production's Supabase project).
 *  - Any non-production environment (preview, local, unset): a live key is refused outright, so a
 *    mis-set environment variable can never take a real payment from a preview or a laptop.
 * `VERCEL_ENV` is set by Vercel on the server: 'production' | 'preview' | 'development'.
 */
export function assertPaymentsAllowed(env: Env, keyId: string | undefined): void {
  const where = env.VERCEL_ENV
  if (where === 'preview') throw new PaymentsDisabledError('Payments are disabled on preview deployments')
  if (where !== 'production' && keyId?.startsWith('rzp_live_')) {
    throw new PaymentsDisabledError('Live payment keys are refused outside production')
  }
}

export function appUrlFrom(env: Env): string {
  return (env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/+$/, '')
}
