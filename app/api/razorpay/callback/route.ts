import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// Razorpay redirects here after payment with GET params:
// razorpay_payment_id, razorpay_payment_link_id, razorpay_payment_link_reference_id,
// razorpay_payment_link_status, razorpay_signature
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  
  const paymentId = searchParams.get('razorpay_payment_id')
  const paymentLinkId = searchParams.get('razorpay_payment_link_id')
  const paymentLinkRefId = searchParams.get('razorpay_payment_link_reference_id')
  const status = searchParams.get('razorpay_payment_link_status')
  const signature = searchParams.get('razorpay_signature')
  const userId = searchParams.get('user_id')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Payment not completed
  if (status !== 'paid') {
    return NextResponse.redirect(`${appUrl}/?payment=cancelled`)
  }

  if (!paymentId || !paymentLinkId || !paymentLinkRefId || !signature || !userId) {
    return NextResponse.redirect(`${appUrl}/?payment=error`)
  }

  // Verify signature — mandatory security step
  // Razorpay signs: payment_link_id|payment_link_reference_id|payment_link_status|payment_id
  const body = `${paymentLinkId}|${paymentLinkRefId}|${status}|${paymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')

  if (expectedSignature !== signature) {
    console.error('[callback] Signature mismatch')
    return NextResponse.redirect(`${appUrl}/?payment=error`)
  }

  // Record payment using admin client (bypasses RLS)
  const admin = createAdminClient()
  const { error } = await admin
    .from('paid_users')
    .upsert({
      user_id: userId,
      razorpay_order_id: paymentLinkId,
      razorpay_payment_id: paymentId,
      paid_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('[callback] DB error', error)
    return NextResponse.redirect(`${appUrl}/?payment=error`)
  }

  // Redirect back to app with success flag
  return NextResponse.redirect(`${appUrl}/?payment=success`)
}
