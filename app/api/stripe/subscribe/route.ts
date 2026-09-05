import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

// New keys (2026 pricing) take precedence; legacy keys fall back to the same
// env vars so existing Vercel configuration keeps working during the transition.
const PRICE_MAP: Record<string, string | undefined> = {
  demarrage_monthly:  process.env.STRIPE_PRICE_DEMARRAGE_MONTHLY  || process.env.STRIPE_PRICE_STARTER_MONTHLY,
  demarrage_annual:   process.env.STRIPE_PRICE_DEMARRAGE_ANNUAL   || process.env.STRIPE_PRICE_STARTER_ANNUAL,
  pro_monthly:        process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_annual:         process.env.STRIPE_PRICE_PRO_ANNUAL,
  croissance_monthly: process.env.STRIPE_PRICE_CROISSANCE_MONTHLY || process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
  croissance_annual:  process.env.STRIPE_PRICE_CROISSANCE_ANNUAL  || process.env.STRIPE_PRICE_BUSINESS_ANNUAL,
  // Legacy aliases — keep so older clients still resolve.
  starter_monthly:    process.env.STRIPE_PRICE_DEMARRAGE_MONTHLY  || process.env.STRIPE_PRICE_STARTER_MONTHLY,
  starter_annual:     process.env.STRIPE_PRICE_DEMARRAGE_ANNUAL   || process.env.STRIPE_PRICE_STARTER_ANNUAL,
  business_monthly:   process.env.STRIPE_PRICE_CROISSANCE_MONTHLY || process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
  business_annual:    process.env.STRIPE_PRICE_CROISSANCE_ANNUAL  || process.env.STRIPE_PRICE_BUSINESS_ANNUAL,
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }
    const user = await getAuthedUser(req)
    if (!user) return UNAUTHORIZED()

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
    const supabase = adminClient()

    const body = await req.json().catch(() => null) as { planId?: string; cycle?: 'monthly' | 'annual'; promoCode?: string } | null
    const planId = body?.planId
    const cycle = body?.cycle === 'annual' ? 'annual' : 'monthly'
    const promoCode = body?.promoCode?.trim() || null
    if (!planId || !['demarrage', 'pro', 'croissance', 'starter', 'business'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid planId' }, { status: 400 })
    }
    const priceId = PRICE_MAP[`${planId}_${cycle}`]
    if (!priceId) return NextResponse.json({ error: `No Stripe price configured for ${planId} ${cycle}` }, { status: 400 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .maybeSingle()

    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('owner_user_id', user.id)
        .maybeSingle()

      const customer = await stripe.customers.create({
        email: user.email || profile?.email || undefined,
        name: org?.name || undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await supabase.from('profiles').upsert({ id: user.id, stripe_customer_id: customerId })
    }

    const origin = req.headers.get('origin') || 'https://gestivio.ca'

    // Try to resolve a matching Stripe promotion code when a db-validated code was passed
    let stripePromotionId: string | undefined
    if (promoCode) {
      try {
        const list = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 })
        if (list.data[0]) stripePromotionId = list.data[0].id
      } catch (err) {
        console.warn('[stripe subscribe] promotion code lookup failed:', err)
      }
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      payment_method_collection: 'always',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?subscribed=true&plan=${planId}&cycle=${cycle}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe`,
      metadata: { userId: user.id, planId, cycle, promo_code: promoCode || '' },
      subscription_data: { metadata: { userId: user.id, planId, cycle, promo_code: promoCode || '' } },
    }
    if (stripePromotionId) {
      params.discounts = [{ promotion_code: stripePromotionId }]
    } else {
      params.allow_promotion_codes = true
    }

    const session = await stripe.checkout.sessions.create(params)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe subscribe]', err)
    return NextResponse.json({ error: 'Checkout error' }, { status: 500 })
  }
}
