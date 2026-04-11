import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// stripe initialized lazily in handler

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })

  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, planId } = session.metadata || {}
        if (userId && planId) {
          await supabase.from('organizations').upsert({
            owner_user_id: userId,
            plan: planId,
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            trial_ends_at: null,
            billing_status: 'active',
          })
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'success',
            title: 'Subscription activated',
            body: `Your ${planId} plan is now active.`,
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (userId) {
          const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'inactive'
          await supabase
            .from('organizations')
            .update({ billing_status: status, stripe_subscription_id: sub.id })
            .eq('owner_user_id', userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (userId) {
          await supabase
            .from('organizations')
            .update({ plan: 'starter', billing_status: 'inactive' })
            .eq('owner_user_id', userId)
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'warning',
            title: 'Subscription cancelled',
            body: 'Your subscription has ended. Upgrade to restore access.',
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice
        const customerId = inv.customer as string
        const { data: org } = await supabase
          .from('organizations')
          .select('owner_user_id')
          .eq('stripe_customer_id', customerId)
          .single()
        if (org) {
          await supabase.from('notifications').insert({
            user_id: org.owner_user_id,
            type: 'error',
            title: 'Payment failed',
            body: 'Your subscription payment failed. Please update your payment method.',
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
