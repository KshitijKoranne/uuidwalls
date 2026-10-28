import type { SupabaseClient } from '@supabase/supabase-js'
import type { PaidFact } from './types'

// Who has paid. The only code that reads or writes `paid_users`, so a provider swap never touches it.
// Column names are the existing production schema (the Razorpay-era names are kept on purpose; the
// schema is not changed by this refactor).

export async function hasEntitlement(db: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await db.from('paid_users').select('user_id').eq('user_id', userId).maybeSingle()
  return !!data
}

/** Idempotent: calling it twice for the same user leaves one row. `admin` must be the service-role client. */
export async function grantEntitlement(admin: SupabaseClient, fact: PaidFact, now: Date = new Date()): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: u } = await admin.auth.admin.getUserById(fact.userId)
  const { error } = await admin.from('paid_users').upsert(
    {
      user_id: fact.userId,
      email: u?.user?.email ?? null,
      razorpay_order_id: fact.providerRef,
      razorpay_payment_id: fact.paymentId,
      paid_at: now.toISOString(),
    },
    { onConflict: 'user_id' },
  )
  return error ? { ok: false, error: error.message } : { ok: true }
}
