import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { sendPlanEmail } from '@/lib/plan-emails'
import { PLAN_PRICING, normalizePlan } from '@/lib/plan-limits'

const LOG = '[stripe webhook]'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(`${LOG} SUPABASE_SERVICE_ROLE_KEY missing — webhook writes will be blocked by RLS`)
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  // Stripe sets `account` on the event when it originates from a connected
  // account. Try platform secret first, fall back to Connect secret so a
  // single endpoint can receive both kinds.
  const platformSecret = process.env.STRIPE_WEBHOOK_SECRET
  const connectSecret  = process.env.STRIPE_CONNECT_WEBHOOK_SECRET
  let event: Stripe.Event | null = null
  const errors: string[] = []
  for (const secret of [platformSecret, connectSecret]) {
    if (!secret) continue
    try {
      event = stripe.webhooks.constructEvent(body, sig, secret)
      break
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err))
    }
  }
  if (!event) {
    console.error(`${LOG} signature verification failed:`, errors)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  const connectAccountId = (event as unknown as { account?: string }).account || null
  if (connectAccountId) console.log(`${LOG} Connect event from account=${connectAccountId} type=${event.type}`)

  try {
    switch (event.type) {

      // ── Subscription / plan checkout ──────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const meta = session.metadata || {}
        const { userId, planId } = meta
        const invoiceToken = meta.invoice_token
        let invoiceId = meta.invoiceId

        // ── Deposit payment (quote / contract / job) ──────────────────
        if (meta.kind === 'deposit') {
          const depSource = meta.deposit_source as 'quote' | 'contract' | 'job' | undefined
          const depSourceId = meta.deposit_source_id
          const depUserId = meta.user_id
          const amountPaid = (session.amount_total || 0) / 100
          const paidAt = new Date().toISOString()
          const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null

          console.log(`${LOG} deposit paid: source=${depSource} id=${depSourceId} amount=${amountPaid} pi=${paymentIntentId}`)

          if (!depSource || !depSourceId || !depUserId) {
            console.error(`${LOG} deposit missing metadata`, meta)
            break
          }

          // 1. Mark the source record as having a paid deposit
          const sourceTable = depSource === 'quote' ? 'quotes' : depSource === 'contract' ? 'contracts' : 'jobs'
          const sourcePatch: Record<string, unknown> = {
            deposit_paid_at: paidAt,
            deposit_payment_intent_id: paymentIntentId,
          }
          if (depSource === 'quote') {
            // Paying a deposit on a quote implies acceptance
            sourcePatch.status = 'accepted'
            sourcePatch.accepted_at = paidAt
          }
          const { data: sourceRow, error: srcErr } = await supabase
            .from(sourceTable)
            .update(sourcePatch)
            .eq('id', depSourceId)
            .select('id, customer_id, title, quote_number')
            .maybeSingle()
          if (srcErr) console.error(`${LOG} deposit source update failed:`, srcErr)

          // 2. Resolve org_id for the deposits row
          const { data: depOrg } = await supabase
            .from('organizations')
            .select('id, name, email')
            .eq('owner_user_id', depUserId)
            .maybeSingle()

          // Retrieve charge id (best-effort; needed for refunds on Connect)
          let chargeId: string | null = null
          try {
            if (paymentIntentId) {
              const pi = await stripe.paymentIntents.retrieve(
                paymentIntentId,
                {},
                connectAccountId ? { stripeAccount: connectAccountId } : undefined,
              )
              chargeId = (pi as unknown as { latest_charge?: string | null }).latest_charge || null
            }
          } catch (e) {
            console.error(`${LOG} PI lookup for charge id failed`, e)
          }

          // 3. Insert deposits row
          const { error: depInsErr } = await supabase.from('deposits').insert({
            user_id: depUserId,
            org_id: depOrg?.id || null,
            customer_id: sourceRow?.customer_id || null,
            quote_id: depSource === 'quote' ? depSourceId : null,
            contract_id: depSource === 'contract' ? depSourceId : null,
            job_id: depSource === 'job' ? depSourceId : null,
            amount: amountPaid,
            source: depSource,
            status: 'paid',
            stripe_payment_intent_id: paymentIntentId,
            stripe_charge_id: chargeId,
            paid_at: paidAt,
          })
          if (depInsErr) console.error(`${LOG} deposits insert failed:`, depInsErr)

          // 4. Notify merchant
          const amtLabel = amountPaid.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 })
          const srcLabel = depSource === 'quote' ? (sourceRow?.quote_number || sourceRow?.title || '')
            : depSource === 'contract' ? (sourceRow?.title || '')
            : (sourceRow?.title || '')
          await supabase.from('notifications').insert({
            user_id: depUserId,
            type: 'success',
            title: `Acompte reçu — ${amtLabel}`,
            body: srcLabel ? `Acompte versé pour « ${srcLabel} ».` : 'Un acompte a été versé.',
            link: depSource === 'quote' ? '/quotes' : depSource === 'contract' ? '/contrats' : '/jobs',
          })

          // 5. Merchant email (best effort)
          if (process.env.RESEND_API_KEY && depOrg?.email) {
            try {
              const resend = new Resend(process.env.RESEND_API_KEY)
              await resend.emails.send({
                from: `Gestivio <noreply@gestivio.ca>`,
                to: depOrg.email,
                subject: `Acompte reçu — ${amtLabel}`,
                html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827">
                  <div style="background:#7c3aed;padding:24px 32px;border-radius:12px 12px 0 0">
                    <h1 style="color:white;margin:0;font-size:20px">Acompte reçu</h1>
                  </div>
                  <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
                    <p>Un acompte de <strong style="color:#7c3aed">${amtLabel}</strong> a été versé${srcLabel ? ` pour <strong>${srcLabel}</strong>` : ''}.</p>
                    <p style="color:#6b7280;font-size:13px">Le montant sera automatiquement crédité sur la facture finale lorsque vous la créerez.</p>
                  </div>
                </div>`,
              })
            } catch (emailErr) {
              console.error(`${LOG} deposit merchant email failed:`, emailErr)
            }
          }
          break
        }

        // If we only have the token, resolve to id (also confirms token authenticity)
        if (!invoiceId && invoiceToken) {
          const { data: inv } = await supabase
            .from('invoices')
            .select('id')
            .eq('token', invoiceToken)
            .single()
          if (inv) invoiceId = inv.id
          else console.error(`${LOG} invoice_token lookup failed for token=${invoiceToken}`)
        }

        if (userId && planId) {
          // Business subscribing to a Gestivio plan — always persist the canonical plan name
          const canonicalPlan = normalizePlan(planId)
          await supabase.from('organizations').update({
            plan: canonicalPlan,
            plan_status: 'active',
            plan_started_at: new Date().toISOString(),
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
          }).eq('owner_user_id', userId)
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'success',
            title: 'Abonnement activé',
            body: `Votre forfait ${PLAN_PRICING[canonicalPlan].label} est maintenant actif.`,
          })
          // Plan-upgrade confirmation email
          const { data: orgRow } = await supabase
            .from('organizations').select('email, name').eq('owner_user_id', userId).single()
          const info = PLAN_PRICING[canonicalPlan]
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
          const paidAt = new Date().toISOString()
          const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null
          console.log(`${LOG} invoice payment completed: invoice=${invoiceId} amount=${amountPaid} pi=${paymentIntentId}`)

          // Fetch invoice + customer + owner context first (we need user_id for payments insert)
          const { data: inv, error: invFetchErr } = await supabase
            .from('invoices')
            .select('id, user_id, invoice_number, amount, job_id, customers(name, email)')
            .eq('id', invoiceId)
            .single()
          if (invFetchErr || !inv) {
            console.error(`${LOG} invoice lookup failed:`, invFetchErr)
            break
          }

          const { error: invUpErr } = await supabase
            .from('invoices')
            .update({
              status: 'paid',
              paid_at: paidAt,
              payment_method: 'stripe',
              stripe_payment_intent_id: paymentIntentId,
            })
            .eq('id', invoiceId)
          if (invUpErr) console.error(`${LOG} invoice update failed:`, invUpErr)

          // Mark linked job as invoiced so the lifecycle ends cleanly
          if (inv.job_id) {
            const { error: jobErr } = await supabase
              .from('jobs')
              .update({ status: 'invoiced' })
              .eq('id', inv.job_id)
              .eq('user_id', inv.user_id)
            if (jobErr) console.error(`${LOG} linked job status update failed:`, jobErr)
          }

          const { error: payErr } = await supabase.from('payments').insert({
            invoice_id:               invoiceId,
            user_id:                  inv.user_id,
            amount:                   amountPaid,
            payment_method:           'stripe',
            payment_date:             paidAt,
            stripe_payment_intent_id: paymentIntentId,
            reference:                session.id,
          })
          if (payErr) console.error(`${LOG} payments insert failed:`, payErr)

          const customer = inv.customers as unknown as { name?: string; email?: string } | null
          const custName = customer?.name || 'Client'
          const amountLabel = amountPaid.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 })

          // In-app notification
          await supabase.from('notifications').insert({
            user_id: inv.user_id,
            type:    'success',
            title:   `Paiement reçu — ${inv.invoice_number || invoiceId.slice(0, 8)}`,
            body:    `${custName} a payé ${amountLabel}.`,
            link:    `/invoices/${invoiceId}`,
          })

          // Emails (non-fatal)
          if (process.env.RESEND_API_KEY) {
            try {
              const resend = new Resend(process.env.RESEND_API_KEY)
              const { data: org } = await supabase
                .from('organizations')
                .select('name, email')
                .eq('owner_user_id', inv.user_id)
                .maybeSingle()
              const bizName = org?.name || 'Gestivio'
              const invoiceLabel = inv.invoice_number || invoiceId.slice(0, 8)

              // Customer receipt
              if (customer?.email) {
                await resend.emails.send({
                  from: `${bizName} <noreply@gestivio.ca>`,
                  to: customer.email,
                  subject: `Reçu de paiement — Facture ${invoiceLabel}`,
                  html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827">
                    <div style="background:#059669;padding:24px 32px;border-radius:12px 12px 0 0">
                      <h1 style="color:white;margin:0;font-size:20px">Paiement confirmé — ${bizName}</h1>
                    </div>
                    <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
                      <p>Bonjour ${custName},</p>
                      <p>Nous avons bien reçu votre paiement.</p>
                      <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0">
                        <table style="width:100%;border-collapse:collapse">
                          <tr><td style="padding:6px 0;color:#6b7280">Facture</td><td style="padding:6px 0;font-weight:600;text-align:right">${invoiceLabel}</td></tr>
                          <tr><td style="padding:6px 0;color:#6b7280">Montant payé</td><td style="padding:6px 0;font-weight:700;text-align:right;color:#059669">${amountLabel}</td></tr>
                          <tr><td style="padding:6px 0;color:#6b7280">Date</td><td style="padding:6px 0;font-weight:600;text-align:right">${new Date(paidAt).toLocaleDateString('fr-CA')}</td></tr>
                          <tr><td style="padding:6px 0;color:#6b7280">Méthode</td><td style="padding:6px 0;font-weight:600;text-align:right">Carte (Stripe)</td></tr>
                        </table>
                      </div>
                      <p style="color:#6b7280;font-size:13px">Merci de votre paiement. ${bizName}</p>
                    </div>
                  </div>`,
                })
              }

              // Owner notification
              if (org?.email) {
                await resend.emails.send({
                  from: `Gestivio <noreply@gestivio.ca>`,
                  to: org.email,
                  subject: `Paiement reçu — ${amountLabel} de ${custName}`,
                  html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827">
                    <div style="background:#4f46e5;padding:24px 32px;border-radius:12px 12px 0 0">
                      <h1 style="color:white;margin:0;font-size:20px">Paiement reçu</h1>
                    </div>
                    <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
                      <p>Bonjour,</p>
                      <p><strong>${custName}</strong> a payé la facture <strong>${invoiceLabel}</strong>.</p>
                      <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0">
                        <table style="width:100%;border-collapse:collapse">
                          <tr><td style="padding:6px 0;color:#6b7280">Montant</td><td style="padding:6px 0;font-weight:700;text-align:right;color:#059669">${amountLabel}</td></tr>
                          <tr><td style="padding:6px 0;color:#6b7280">Date</td><td style="padding:6px 0;font-weight:600;text-align:right">${new Date(paidAt).toLocaleDateString('fr-CA')}</td></tr>
                        </table>
                      </div>
                    </div>
                  </div>`,
                })
              }
            } catch (emailErr) {
              console.error(`${LOG} email send failed:`, emailErr)
            }
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
              if (typeof planId === 'string') {
                planUpdate.plan = normalizePlan(planId)
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
            .update({ plan: 'demarrage', plan_status: 'cancelled', stripe_subscription_id: null })
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
