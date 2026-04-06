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
  const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')

  console.log('[callback] received:', { paymentId, paymentLinkId, paymentLinkRefId, status, userId, isTestMode })

  if (status !== 'paid') {
    return NextResponse.redirect(`${appUrl}/?payment=cancelled`)
  }

  if (!paymentId || !paymentLinkId || !userId) {
    console.error('[callback] missing required params')
    return NextResponse.redirect(`${appUrl}/?payment=error`)
  }

  // Signature verification — skip in test mode, enforce in live mode
  if (!isTestMode && signature && paymentLinkRefId) {
    const body = `${paymentLinkId}|${paymentLinkRefId}|${status}|${paymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.error('[callback] signature mismatch in live mode')
      return NextResponse.redirect(`${appUrl}/?payment=error`)
    }
  }

  // Record payment using admin client
  const admin = createAdminClient()

  const { data: userData } = await admin.auth.admin.getUserById(userId)
  const email = userData?.user?.email ?? null

  const { error } = await admin
    .from('paid_users')
    .upsert({
      user_id: userId,
      email,
      razorpay_order_id: paymentLinkId,
      razorpay_payment_id: paymentId,
      paid_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('[callback] DB upsert error:', JSON.stringify(error))
    return NextResponse.redirect(`${appUrl}/?payment=error`)
  }

  console.log('[callback] success for user:', userId)
  return NextResponse.redirect(`${appUrl}/?payment=success`)
}
