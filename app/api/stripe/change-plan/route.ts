import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

const PLAN_TIER: Record<string, number> = { demarrage: 0, pro: 1, croissance: 2 }

const PRICE_MAP: Record<string, string | undefined> = {
  demarrage_monthly:  process.env.STRIPE_PRICE_DEMARRAGE_MONTHLY  || process.env.STRIPE_PRICE_STARTER_MONTHLY,
  demarrage_annual:   process.env.STRIPE_PRICE_DEMARRAGE_ANNUAL   || process.env.STRIPE_PRICE_STARTER_ANNUAL,
  pro_monthly:        process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_annual:         process.env.STRIPE_PRICE_PRO_ANNUAL,
  croissance_monthly: process.env.STRIPE_PRICE_CROISSANCE_MONTHLY || process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
  croissance_annual:  process.env.STRIPE_PRICE_CROISSANCE_ANNUAL  || process.env.STRIPE_PRICE_BUSINESS_ANNUAL,
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

    const body = await req.json().catch(() => null) as { newPlanId?: string; cycle?: 'monthly' | 'annual' } | null
    const newPlanId = body?.newPlanId
    const cycle = body?.cycle === 'annual' ? 'annual' : 'monthly'

    if (!newPlanId || !['demarrage', 'pro', 'croissance'].includes(newPlanId)) {
      return NextResponse.json({ error: 'Invalid newPlanId' }, { status: 400 })
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('plan, stripe_subscription_id, stripe_customer_id, name')
      .eq('owner_user_id', user.id)
      .single()

    const newPriceId = PRICE_MAP[`${newPlanId}_${cycle}`]
    if (!newPriceId) {
      return NextResponse.json({ error: `No Stripe price configured for ${newPlanId} ${cycle}` }, { status: 400 })
    }

    // Promo-granted plans (and anyone active without a real Stripe subscription) get
    // a fresh checkout session so they can start a real paid subscription.
    if (!org?.stripe_subscription_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email')
        .eq('id', user.id)
        .maybeSingle()

      let customerId = org?.stripe_customer_id || profile?.stripe_customer_id
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || profile?.email || undefined,
          name: org?.name || undefined,
          metadata: { userId: user.id },
        })
        customerId = customer.id
        await supabase.from('profiles').upsert({ id: user.id, stripe_customer_id: customerId })
      }

      const origin = req.headers.get('origin') || 'https://gestivio.ca'
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: newPriceId, quantity: 1 }],
        success_url: `${origin}/settings?tab=billing&success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${origin}/settings?tab=billing&canceled=true`,
        metadata: { userId: user.id, planId: newPlanId, cycle },
        subscription_data: { metadata: { userId: user.id, planId: newPlanId, cycle } },
        allow_promotion_codes: true,
      })
      return NextResponse.json({ ok: true, checkoutUrl: session.url, effective: 'checkout' })
    }

    const currentPlan = org.plan || 'demarrage'
    const currentTier = PLAN_TIER[currentPlan] ?? 0
    const newTier = PLAN_TIER[newPlanId] ?? 0

    if (currentTier === newTier) {
      return NextResponse.json({ error: 'Already on this plan' }, { status: 400 })
    }

    const isUpgrade = newTier > currentTier

    const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id)
    const currentItemId = subscription.items.data[0]?.id
    if (!currentItemId) {
      return NextResponse.json({ error: 'Subscription has no items' }, { status: 500 })
    }

    await stripe.subscriptions.update(org.stripe_subscription_id, {
      items: [{ id: currentItemId, price: newPriceId }],
      proration_behavior: isUpgrade ? 'create_prorations' : 'none',
      ...(!isUpgrade ? { cancel_at_period_end: false } : {}),
    })

    if (isUpgrade) {
      // Upgrade takes effect immediately
      await supabase
        .from('organizations')
        .update({ plan: newPlanId })
        .eq('owner_user_id', user.id)
    }
    // Downgrade: plan change happens at period end via webhook (subscription.updated event)

    return NextResponse.json({ ok: true, effective: isUpgrade ? 'immediate' : 'end_of_period' })
  } catch (err) {
    console.error('[stripe change-plan]', err)
    return NextResponse.json({ error: 'Plan change failed' }, { status: 500 })
  }
}
