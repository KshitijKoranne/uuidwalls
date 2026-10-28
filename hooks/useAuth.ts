'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { ACCOUNTS_ENABLED } from '@/lib/env'

/** Session + paid state from Supabase. Inert when accounts are disabled (preview deployments). */
export function useAuth() {
  const supabase = useMemo(() => (ACCOUNTS_ENABLED ? createClient() : null), [])
  const [user, setUser] = useState<User | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [checked, setChecked] = useState(false)

  const fetchPaid = useCallback(async (userId: string) => {
    if (!supabase) return false
    const { data } = await supabase.from('paid_users').select('id').eq('user_id', userId).maybeSingle()
    return !!data
  }, [supabase])

  useEffect(() => {
    if (!supabase) return
    let alive = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!alive) return
      setUser(user ?? null)
      if (user) { const paid = await fetchPaid(user.id); if (alive) setIsPaid(paid) }
      if (alive) setChecked(true)
    })()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setChecked(true)
      if (u) setIsPaid(await fetchPaid(u.id)); else setIsPaid(false)
    })
    return () => { alive = false; subscription.unsubscribe() }
  }, [supabase, fetchPaid])

  /** After a payment redirect: the DB row can lag the redirect, so look twice. Resolves true if paid. */
  const confirmPaid = useCallback(async (): Promise<boolean> => {
    if (!supabase) return false
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    for (let attempt = 0; attempt < 5; attempt++) { // SPEC 8.4: every 2 s, up to 5 times
      if (await fetchPaid(user.id)) { setIsPaid(true); return true }
      await new Promise(r => setTimeout(r, 2000))
    }
    return false
  }, [supabase, fetchPaid])

  const markPaid = useCallback(() => setIsPaid(true), [])
  return { user, isPaid, authChecked: !supabase || checked, confirmPaid, markPaid }
}
