import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendPlanEmail } from '@/lib/plan-emails'
import { PLAN_PRICING } from '@/lib/plan-limits'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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

      // ── Subscription / plan checkout ──────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, planId, invoiceId } = session.metadata || {}

        if (userId && planId) {
          // Business subscribing to a Gestivio plan
          await supabase.from('organizations').update({
            plan: planId,
            plan_status: 'active',
            plan_started_at: new Date().toISOString(),
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
          }).eq('owner_user_id', userId)
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'success',
            title: 'Abonnement activé',
            body: `Votre forfait ${planId} est maintenant actif.`,
          })
          // Plan-upgrade confirmation email
          const { data: orgRow } = await supabase
            .from('organizations').select('email, name').eq('owner_user_id', userId).single()
          const info = PLAN_PRICING[planId as keyof typeof PLAN_PRICING]
          if (orgRow?.email && info) {
            await sendPlanEmail('payment_success', {
              to: orgRow.email,
              name: orgRow.name || undefined,
              planLabel: info.label,
              planPrice: `${info.monthly} $ CAD/mois`,
            })
          }
        } else if (invoiceId) {
          // Client paying a business invoice
          const amountPaid = (session.amount_total || 0) / 100
          await supabase
            .from('invoices')
            .update({ status: 'paid', paid_at: new Date().toISOString(), payment_method: 'stripe' })
            .eq('id', invoiceId)

          await supabase.from('payments').insert({
            invoice_id:               invoiceId,
            amount:                   amountPaid,
            payment_method:           'stripe',
            stripe_payment_intent_id: session.payment_intent as string,
            paid_at:                  new Date().toISOString(),
          })

          // Notify business owner
          const { data: inv } = await supabase
            .from('invoices')
            .select('user_id, invoice_number, customers(name)')
            .eq('id', invoiceId)
            .single()
          if (inv?.user_id) {
            const custName = (inv.customers as unknown as { name: string } | null)?.name || 'Client'
            await supabase.from('notifications').insert({
              user_id: inv.user_id,
              type:    'success',
              title:   `Paiement reçu — ${inv.invoice_number || invoiceId.slice(0, 8)}`,
              body:    `${custName} a payé $${amountPaid.toFixed(2)}.`,
              link:    `/invoices/${invoiceId}`,
            })
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (userId) {
          const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : sub.status === 'canceled' ? 'cancelled' : 'active'
          // Map Stripe price back to Gestivio plan via the price's product metadata
          const priceId = sub.items.data[0]?.price.id
          let planUpdate: Record<string, unknown> = { plan_status: status, stripe_subscription_id: sub.id }
          if (priceId) {
            try {
              const price = await stripe.prices.retrieve(priceId, { expand: ['product'] })
              const product = price.product as Stripe.Product
              const planId = product.metadata?.gestivio_plan
              if (planId === 'starter' || planId === 'pro' || planId === 'business') {
                planUpdate.plan = planId
              }
            } catch { /* keep existing plan */ }
          }
          const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
          if (periodEnd) {
            planUpdate.next_billing_at = new Date(periodEnd * 1000).toISOString()
          }
          await supabase.from('organizations').update(planUpdate).eq('owner_user_id', userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (userId) {
          await supabase
            .from('organizations')
            .update({ plan: 'starter', plan_status: 'cancelled', stripe_subscription_id: null })
            .eq('owner_user_id', userId)
          await supabase.from('notifications').insert({
            user_id: userId,
            type:    'warning',
            title:   'Abonnement annulé',
            body:    "Votre abonnement a pris fin. Passez à Pro pour restaurer l'accès complet.",
          })
          const { data: orgRow } = await supabase
            .from('organizations').select('email, name').eq('owner_user_id', userId).single()
          if (orgRow?.email) {
            await sendPlanEmail('subscription_cancelled', { to: orgRow.email, name: orgRow.name || undefined })
          }
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
          await supabase.from('organizations').update({ plan_status: 'past_due' }).eq('owner_user_id', org.owner_user_id)
          await supabase.from('notifications').insert({
            user_id: org.owner_user_id,
            type:    'error',
            title:   'Paiement échoué',
            body:    'Le paiement de votre abonnement a échoué. Veuillez mettre à jour votre mode de paiement.',
          })
          const { data: orgRow } = await supabase
            .from('organizations').select('email, name').eq('owner_user_id', org.owner_user_id).single()
          if (orgRow?.email) {
            await sendPlanEmail('payment_failed', { to: orgRow.email, name: orgRow.name || undefined })
          }
        }
        break
      }

      // ── Stripe Connect account lifecycle ──────────────────────────
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await supabase
          .from('organizations')
          .update({
            stripe_connect_charges_enabled:     account.charges_enabled,
            stripe_connect_payouts_enabled:     account.payouts_enabled,
            stripe_connect_onboarding_complete: account.details_submitted,
          })
          .eq('stripe_connect_account_id', account.id)
        break
      }

      case 'account.application.deauthorized': {
        const application = event.data.object as Stripe.Application
        await supabase
          .from('organizations')
          .update({
            stripe_connect_account_id:          null,
            stripe_connect_charges_enabled:     false,
            stripe_connect_payouts_enabled:     false,
            stripe_connect_onboarding_complete: false,
          })
          .eq('stripe_connect_account_id', application.id)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
