import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Map plan IDs to Stripe price IDs (set these in your Stripe dashboard and .env)
const PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || '',
  growth:  process.env.STRIPE_PRICE_GROWTH  || '',
  pro:     process.env.STRIPE_PRICE_PRO     || '',
  scale:   process.env.STRIPE_PRICE_SCALE   || '',
}

export async function POST(req: NextRequest) {
  try {
    const { planId, userId, billingCycle } = await req.json()

    if (!planId || !userId) {
      return NextResponse.json({ error: 'Missing planId or userId' }, { status: 400 })
    }

    const priceKey = billingCycle === 'annual' ? `${planId}_annual` : planId
    const priceId = PRICE_MAP[priceKey] || PRICE_MAP[planId]

    if (!priceId) {
      return NextResponse.json({ error: `No Stripe price configured for plan: ${planId}` }, { status: 400 })
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
      success_url: `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/billing?canceled=true`,
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
