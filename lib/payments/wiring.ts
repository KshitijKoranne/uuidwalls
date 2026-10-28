import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRateLimiter } from '@/lib/rateLimit'
import { grantEntitlement, hasEntitlement } from './entitlements'
import { getPaymentProvider } from './index'
import type { CheckoutDeps, ReturnDeps, WebhookDeps } from './handlers'
import type { PaidFact } from './types'

// Real dependencies for the payment routes (server only).
const limiter = createRateLimiter(3, 10 * 60 * 1000)

const grant = (fact: PaidFact) => grantEntitlement(createAdminClient(), fact)

export function checkoutDeps(): CheckoutDeps {
  return {
    env: process.env,
    getUser: async () => {
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      return error || !user ? null : { id: user.id, email: user.email ?? null }
    },
    alreadyPaid: async userId => hasEntitlement(await createClient(), userId),
    provider: () => getPaymentProvider(),
    isRateLimited: limiter,
  }
}

export const returnDeps = (): ReturnDeps => ({ env: process.env, provider: () => getPaymentProvider(), grant })
export const webhookDeps = (): WebhookDeps => ({ provider: () => getPaymentProvider(), grant })
