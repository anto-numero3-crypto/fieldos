import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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
            title: 'Abonnement activé',
            body: `Votre plan ${planId} est maintenant actif.`,
          })
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
            type:    'warning',
            title:   'Abonnement annulé',
            body:    'Votre abonnement a pris fin. Mettez à niveau pour restaurer l\'accès.',
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
            type:    'error',
            title:   'Paiement échoué',
            body:    'Le paiement de votre abonnement a échoué. Veuillez mettre à jour votre mode de paiement.',
          })
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
