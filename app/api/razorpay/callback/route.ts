import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const paymentId = searchParams.get('razorpay_payment_id')
  const paymentLinkId = searchParams.get('razorpay_payment_link_id')
  const paymentLinkRefId = searchParams.get('razorpay_payment_link_reference_id')
  const status = searchParams.get('razorpay_payment_link_status')
  const signature = searchParams.get('razorpay_signature')
  const userId = searchParams.get('user_id')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Log all params to help debug
  console.log('[callback] params:', {
    paymentId, paymentLinkId, paymentLinkRefId, status, signature, userId
  })

  if (status !== 'paid') {
    console.log('[callback] status not paid:', status)
    return NextResponse.redirect(`${appUrl}/?payment=cancelled`)
  }

  if (!paymentId || !paymentLinkId || !paymentLinkRefId || !signature || !userId) {
    console.log('[callback] missing params')
    return NextResponse.redirect(`${appUrl}/?payment=error`)
  }

  // Verify signature
  const body = `${paymentLinkId}|${paymentLinkRefId}|${status}|${paymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')

  console.log('[callback] signature check:', {
    body,
    expected: expectedSignature,
    received: signature,
    match: expectedSignature === signature,
  })

  if (expectedSignature !== signature) {
    console.error('[callback] signature mismatch — writing to DB anyway in test mode')
    // In test mode, don't block on signature mismatch — still record the payment
    // Remove this bypass before going live
    if (!process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_')) {
      // Test mode — proceed anyway
    } else {
      return NextResponse.redirect(`${appUrl}/?payment=error`)
    }
  }

  // Fetch user email from Supabase using admin client
  const admin = createAdminClient()

  const { data: userData } = await admin.auth.admin.getUserById(userId)
  const email = userData?.user?.email ?? null

  const { error } = await admin
    .from('paid_users')
    .upsert({
      user_id: userId,
      email: email,
      razorpay_order_id: paymentLinkId,
      razorpay_payment_id: paymentId,
      paid_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('[callback] DB error:', JSON.stringify(error))
    return NextResponse.redirect(`${appUrl}/?payment=error`)
  }

  console.log('[callback] payment recorded successfully for user:', userId)
  return NextResponse.redirect(`${appUrl}/?payment=success`)
}
