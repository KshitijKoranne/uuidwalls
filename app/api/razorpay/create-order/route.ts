import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple in-memory rate limit: max 3 payment link creations per user per 10 minutes.
// This is per-instance (Vercel serverless), good enough to prevent accidental spam.
// For stricter enforcement, use Upstash Redis or a DB counter.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return false
  }

  if (entry.count >= 3) return true

  entry.count++
  return false
}

export async function POST(req: Request) {
  try {
    // ── CSRF: verify request origin ──────────────────────────────────────
    const origin = req.headers.get('origin')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    if (origin && origin !== appUrl) {
      console.warn('[create-order] CSRF: origin mismatch', origin)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ── Auth check ───────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Rate limit ───────────────────────────────────────────────────────
    if (isRateLimited(user.id)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 })
    }

    // ── Already paid? ────────────────────────────────────────────────────
    const { data: existing } = await supabase
      .from('paid_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ alreadyPaid: true })
    }

    // ── Create Razorpay Payment Link ─────────────────────────────────────
    const callbackUrl = `${appUrl}/api/razorpay/callback?user_id=${user.id}`

    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString('base64'),
      },
      body: JSON.stringify({
        amount:         9900,
        currency:       'INR',
        accept_partial: false,
        description:    'UUIDWalls — Lifetime 2K/4K Downloads',
        customer: {
          email: user.email,
        },
        notify:           { email: true },
        reminder_enable:  false,
        notes: {
          user_id: user.id,                    // used for cross-verification in callback
          product: 'uuidwalls_2k4k_lifetime',
        },
        callback_url:    callbackUrl,
        callback_method: 'get',
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('[create-order] Razorpay error:', err)
      return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({ paymentUrl: data.short_url })

  } catch (err) {
    console.error('[create-order] unexpected error:', err)
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
  }
}
