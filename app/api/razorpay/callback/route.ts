import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const paymentId       = searchParams.get('razorpay_payment_id')
  const paymentLinkId   = searchParams.get('razorpay_payment_link_id')
  const paymentLinkRefId = searchParams.get('razorpay_payment_link_reference_id')
  const status          = searchParams.get('razorpay_payment_link_status')
  const signature       = searchParams.get('razorpay_signature')
  const userIdFromParam = searchParams.get('user_id')

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL!
  const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')

  console.log('[callback] received:', { paymentId, paymentLinkId, status, userIdFromParam, isTestMode })

  // ── 1. Status check ──────────────────────────────────────────────────────
  if (status !== 'paid') {
    return NextResponse.redirect(`${appUrl}/?payment=cancelled`)
  }

  // ── 2. Required param check ──────────────────────────────────────────────
  if (!paymentId || !paymentLinkId || !userIdFromParam) {
    console.error('[callback] missing required params')
    return NextResponse.redirect(`${appUrl}/?payment=error`)
  }

  // ── 3. Signature verification ────────────────────────────────────────────
  // In test mode: skip (Razorpay test mode does not always send valid signatures)
  // In live mode: MANDATORY — reject if signature is absent or invalid
  if (!isTestMode) {
    if (!signature || !paymentLinkRefId) {
      console.error('[callback] missing signature or reference ID in live mode')
      return NextResponse.redirect(`${appUrl}/?payment=error`)
    }

    const body = `${paymentLinkId}|${paymentLinkRefId}|${status}|${paymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.error('[callback] signature mismatch — possible tampered request')
      return NextResponse.redirect(`${appUrl}/?payment=error`)
    }
  }

  // ── 4. Cross-verify user_id against Razorpay payment record ─────────────
  // Prevents an attacker from crafting ?user_id=victim to gift an unlock.
  // We fetch the payment link from Razorpay and confirm notes.user_id matches.
  try {
    const rzpRes = await fetch(`https://api.razorpay.com/v1/payment_links/${paymentLinkId}`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString('base64'),
      },
    })

    if (!rzpRes.ok) {
      console.error('[callback] failed to fetch payment link from Razorpay')
      return NextResponse.redirect(`${appUrl}/?payment=error`)
    }

    const rzpData = await rzpRes.json()
    const verifiedUserId: string | undefined = rzpData?.notes?.user_id

    if (!verifiedUserId || verifiedUserId !== userIdFromParam) {
      console.error('[callback] user_id mismatch — param:', userIdFromParam, 'notes:', verifiedUserId)
      return NextResponse.redirect(`${appUrl}/?payment=error`)
    }

    // ── 5. Resolve email via admin client ────────────────────────────────
    const admin = createAdminClient()
    const { data: userData } = await admin.auth.admin.getUserById(verifiedUserId)
    const email = userData?.user?.email ?? null

    // ── 6. Upsert paid_users row ─────────────────────────────────────────
    const { error } = await admin
      .from('paid_users')
      .upsert(
        {
          user_id:              verifiedUserId,
          email,
          razorpay_order_id:   paymentLinkId,
          razorpay_payment_id: paymentId,
          paid_at:             new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('[callback] DB upsert error:', JSON.stringify(error))
      return NextResponse.redirect(`${appUrl}/?payment=error`)
    }

    console.log('[callback] success for user:', verifiedUserId)
    return NextResponse.redirect(`${appUrl}/?payment=success`)

  } catch (err) {
    console.error('[callback] unexpected error:', err)
    return NextResponse.redirect(`${appUrl}/?payment=error`)
  }
}
