import { NextResponse } from 'next/server'
import { appUrlFrom } from './env'
import { InvalidWebhookError, PaymentsDisabledError, type PaidFact, type PaymentProvider } from './types'

// Route logic with its dependencies passed in, so it is unit-testable without Supabase or a provider.
// The route files wire the real ones. Nothing in here knows which provider is live.

type Env = Record<string, string | undefined>
const factOf = ({ userId, providerRef, paymentId }: PaidFact): PaidFact => ({ userId, providerRef, paymentId })
const redirectTo = (appUrl: string, payment: 'success' | 'cancelled' | 'error') => NextResponse.redirect(`${appUrl}/?payment=${payment}`)

export interface CheckoutDeps {
  env: Env
  getUser(): Promise<{ id: string; email: string | null } | null>
  alreadyPaid(userId: string): Promise<boolean>
  provider(): PaymentProvider
  isRateLimited(userId: string): boolean
}

/** POST /api/checkout: signed-in user, same-origin only, rate limited. Returns { url } or { alreadyPaid }. */
export async function handleCheckout(req: Request, d: CheckoutDeps): Promise<Response> {
  const appUrl = appUrlFrom(d.env)
  const origin = req.headers.get('origin')
  if (origin && origin !== appUrl) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const user = await d.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (d.isRateLimited(user.id)) return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 })

  let provider: PaymentProvider
  try { provider = d.provider() } catch (e) {
    if (e instanceof PaymentsDisabledError) return NextResponse.json({ error: e.message }, { status: 503 })
    throw e
  }
  if (await d.alreadyPaid(user.id)) return NextResponse.json({ alreadyPaid: true })
  try {
    const { url } = await provider.createCheckout({ userId: user.id, email: user.email, appUrl })
    return NextResponse.json({ url })
  } catch (e) {
    console.error('[checkout] provider error', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
  }
}

export interface ReturnDeps {
  env: Env
  provider(): PaymentProvider
  grant(fact: PaidFact): Promise<{ ok: boolean }>
}

/** GET /api/checkout/return: where the hosted payment page sends the browser back to. */
export async function handleReturn(req: Request, d: ReturnDeps): Promise<Response> {
  const appUrl = appUrlFrom(d.env)
  try {
    const r = await d.provider().handleReturn(req)
    if (r.status === 'cancelled') return redirectTo(appUrl, 'cancelled')
    if (r.status === 'error') { console.error('[checkout/return]', r.reason); return redirectTo(appUrl, 'error') }
    const granted = await d.grant(factOf(r))
    return redirectTo(appUrl, granted.ok ? 'success' : 'error')
  } catch (e) {
    console.error('[checkout/return] unexpected', e instanceof Error ? e.message : e)
    return redirectTo(appUrl, 'error')
  }
}

export interface WebhookDeps {
  provider(): PaymentProvider
  grant(fact: PaidFact): Promise<{ ok: boolean }>
}

/** POST /api/payments/webhook: server-to-server "payment succeeded". Only providers that implement it. */
export async function handleWebhook(req: Request, d: WebhookDeps): Promise<Response> {
  let provider: PaymentProvider
  try { provider = d.provider() } catch (e) {
    if (e instanceof PaymentsDisabledError) return NextResponse.json({ error: e.message }, { status: 503 })
    throw e
  }
  if (!provider.handleWebhook) return NextResponse.json({ error: 'Webhooks are not supported by this provider' }, { status: 501 })
  try {
    const r = await provider.handleWebhook(req)
    if (r.status === 'ignored') return NextResponse.json({ received: true, ignored: r.reason })
    const granted = await d.grant(factOf(r))
    // Non-2xx makes the provider retry, which is what we want if the database write failed.
    return granted.ok ? NextResponse.json({ received: true }) : NextResponse.json({ error: 'Could not record payment' }, { status: 500 })
  } catch (e) {
    if (e instanceof InvalidWebhookError) return NextResponse.json({ error: e.message }, { status: 400 })
    console.error('[webhook] unexpected', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
