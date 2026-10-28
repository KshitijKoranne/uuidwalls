// What is for sale and what it costs, in one place so UI copy and gating cannot drift apart.
// Provider-neutral on purpose: the checkout provider (Razorpay now, Dodo later) lives elsewhere.

export type DlSizeKey = 'screen' | 'mobile' | '2k' | '4k'

/** Sizes behind the paywall. Today: 2K and 4K (owner may change to 4K only; edit here). */
export const PAID_SIZES: readonly DlSizeKey[] = ['2k', '4k']

export const isPaidSize = (k: DlSizeKey) => PAID_SIZES.includes(k)

export const PRICE = { amountMinor: 9900, currency: 'INR', display: '₹99' } as const
