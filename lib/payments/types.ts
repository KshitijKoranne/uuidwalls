// Provider-neutral payment types. A provider (Razorpay today, Dodo Payments later) implements
// PaymentProvider; routes, entitlements and UI only ever see these shapes.

export type ProviderId = 'razorpay' | 'dodo'

export interface CheckoutInput {
  userId: string
  email: string | null
  /** Public origin of this deployment, no trailing slash. */
  appUrl: string
}

export interface CheckoutSession {
  /** Hosted payment page to send the browser to. */
  url: string
  /** Provider's id for this checkout (payment link id, session id, ...). */
  providerRef: string
}

export interface PaidFact {
  userId: string
  providerRef: string
  paymentId: string
}

/** What the browser's return trip from the hosted page amounts to. */
export type ReturnResult =
  | ({ status: 'paid' } & PaidFact)
  | { status: 'cancelled' }
  | { status: 'error'; reason: string }

/** What a provider webhook delivery amounts to, after the provider verified its signature. */
export type WebhookResult =
  | ({ status: 'paid' } & PaidFact)
  | { status: 'ignored'; reason: string }

export interface PaymentProvider {
  readonly id: ProviderId
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>
  /** Verify the redirect back from the hosted page. Must not trust query params on their own. */
  handleReturn(req: Request): Promise<ReturnResult>
  /** Verify and parse a server-to-server notification. Providers without webhooks omit it. */
  handleWebhook?(req: Request): Promise<WebhookResult>
}

export class PaymentsDisabledError extends Error {
  constructor(message: string) { super(message); this.name = 'PaymentsDisabledError' }
}

/** A webhook whose signature or body did not verify. Answered with 400, never retried by us. */
export class InvalidWebhookError extends Error {
  constructor(message = 'Invalid webhook') { super(message); this.name = 'InvalidWebhookError' }
}
