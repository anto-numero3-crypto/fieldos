import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

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
      return NextResponse.json({ error: 'Stripe not configured.' }, { status: 503 })
    }
    const user = await getAuthedUser(req)
    if (!user) return UNAUTHORIZED()

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
    const supabase = adminClient()

    const { planId, billingCycle } = await req.json()
    if (!planId) return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
    if (!['starter', 'pro', 'business'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid planId' }, { status: 400 })
    }

    const period = billingCycle === 'annual' ? 'annual' : 'monthly'
    const priceId = PRICE_MAP[`${planId}_${period}`]
    if (!priceId) {
      return NextResponse.json({ error: `No Stripe price configured for ${planId} ${period}.` }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || profile?.email || undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await supabase.from('profiles').upsert({ id: user.id, stripe_customer_id: customerId })
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?tab=billing&success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/settings?tab=billing&canceled=true`,
      metadata: { userId: user.id, planId },
      subscription_data: { metadata: { userId: user.id, planId }, trial_period_days: 14 },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Checkout error' }, { status: 500 })
  }
}
