import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// All clients initialized lazily inside handler

// Map plan + billing period to Stripe price IDs. Populate these env vars
// using `node scripts/create-stripe-products.js`.
const PRICE_MAP: Record<string, string | undefined> = {
  starter_monthly:  process.env.STRIPE_PRICE_STARTER_MONTHLY,
  starter_annual:   process.env.STRIPE_PRICE_STARTER_ANNUAL,
  pro_monthly:      process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_annual:       process.env.STRIPE_PRICE_PRO_ANNUAL,
  business_monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
  business_annual:  process.env.STRIPE_PRICE_BUSINESS_ANNUAL,
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to environment variables.' }, { status: 503 })
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { planId, userId, billingCycle } = await req.json()

    if (!planId || !userId) {
      return NextResponse.json({ error: 'Missing planId or userId' }, { status: 400 })
    }

    const period = billingCycle === 'annual' ? 'annual' : 'monthly'
    const priceId = PRICE_MAP[`${planId}_${period}`]

    if (!priceId) {
      return NextResponse.json({ error: `No Stripe price configured for ${planId} ${period}. Run scripts/create-stripe-products.js and set env vars.` }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const { data: authUser } = await supabase.auth.admin?.getUserById(userId) || { data: null }
      const customer = await stripe.customers.create({
        email: authUser?.user?.email || profile?.email || undefined,
        metadata: { userId },
      })
      customerId = customer.id

      // Save stripe customer id
      await supabase
        .from('profiles')
        .upsert({ id: userId, stripe_customer_id: customerId })
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?tab=billing&success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/settings?tab=billing&canceled=true`,
      metadata: { userId, planId },
      subscription_data: {
        metadata: { userId, planId },
        trial_period_days: 14,
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
