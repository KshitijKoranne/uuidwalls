import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Already paid? Just return success
    const { data: existing } = await supabase
      .from('paid_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ alreadyPaid: true })
    }

    // Create Razorpay Payment Link via API — simplest server-side approach
    // No SDK needed, just a fetch to Razorpay REST API
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/razorpay/callback?user_id=${user.id}`
    
    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString('base64'),
      },
      body: JSON.stringify({
        amount: 9900, // ₹99 in paise
        currency: 'INR',
        accept_partial: false,
        description: 'UUIDWalls — Lifetime 2K/4K Downloads',
        customer: {
          email: user.email,
        },
        notify: { email: true },
        reminder_enable: false,
        notes: {
          user_id: user.id,
          product: 'uuidwalls_2k4k_lifetime',
        },
        callback_url: callbackUrl,
        callback_method: 'get',
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('[create-payment-link]', err)
      return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({ paymentUrl: data.short_url })

  } catch (err) {
    console.error('[create-order]', err)
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 })
  }
}
