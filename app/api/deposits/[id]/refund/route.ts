import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { Resend } from 'resend'

// POST /api/deposits/[id]/refund
// Body: { amount?, reason? } — amount omitted = full refund
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const reason = (body.reason as string | undefined)?.trim() || null

  const supabase = adminClient()

  const { data: deposit } = await supabase
    .from('deposits')
    .select('id, user_id, amount, refunded_amount, status, stripe_payment_intent_id, stripe_charge_id, customer_id, quote_id, contract_id, job_id, source')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!deposit) return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
  if (deposit.status === 'refunded') {
    return NextResponse.json({ error: 'Déjà entièrement remboursé' }, { status: 400 })
  }

  const totalAmount = Number(deposit.amount)
  const alreadyRefunded = Number(deposit.refunded_amount || 0)
  const maxRefundable = Math.max(0, totalAmount - alreadyRefunded)
  let refundAmount = Number(body.amount ?? maxRefundable)
  if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > maxRefundable) {
    return NextResponse.json({ error: `Montant invalide (max ${maxRefundable.toFixed(2)})` }, { status: 400 })
  }

  // Locate Connect account for the merchant (Stripe refunds on Connect must
  // be issued against the connected account context).
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_connect_account_id, name, email')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })

  const refundParams: Stripe.RefundCreateParams = {
    amount: Math.round(refundAmount * 100),
    reason: 'requested_by_customer',
  }
  if (deposit.stripe_charge_id) {
    refundParams.charge = deposit.stripe_charge_id
  } else if (deposit.stripe_payment_intent_id) {
    refundParams.payment_intent = deposit.stripe_payment_intent_id
  } else {
    return NextResponse.json({ error: 'Aucune référence Stripe — refund impossible.' }, { status: 400 })
  }

  try {
    await stripe.refunds.create(
      refundParams,
      org?.stripe_connect_account_id ? { stripeAccount: org.stripe_connect_account_id } : undefined,
    )
  } catch (err) {
    console.error('[deposit refund]', err)
    const msg = err instanceof Error ? err.message : 'Stripe refund error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const newRefundedAmount = alreadyRefunded + refundAmount
  const fullRefund = newRefundedAmount >= totalAmount - 0.005
  const newStatus = fullRefund ? 'refunded' : 'partial_refunded'

  await supabase.from('deposits').update({
    refunded_amount: newRefundedAmount,
    status: newStatus,
    refunded_at: new Date().toISOString(),
    refund_reason: reason,
  }).eq('id', id)

  // Clear deposit markers on the source if fully refunded
  if (fullRefund) {
    if (deposit.source === 'quote' && deposit.quote_id) {
      await supabase.from('quotes').update({
        deposit_refunded_at: new Date().toISOString(),
        deposit_refunded_amount: newRefundedAmount,
      }).eq('id', deposit.quote_id)
    }
    if (deposit.source === 'contract' && deposit.contract_id) {
      await supabase.from('contracts').update({
        deposit_refunded_at: new Date().toISOString(),
        deposit_refunded_amount: newRefundedAmount,
      }).eq('id', deposit.contract_id)
    }
    if (deposit.source === 'job' && deposit.job_id) {
      await supabase.from('jobs').update({
        deposit_refunded_at: new Date().toISOString(),
        deposit_refunded_amount: newRefundedAmount,
      }).eq('id', deposit.job_id)
    }
  }

  // Notify
  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'info',
    title: fullRefund ? 'Acompte remboursé' : 'Remboursement partiel',
    body: `${refundAmount.toFixed(2)} $ remboursé au client.`,
  })

  // Email customer
  try {
    if (process.env.RESEND_API_KEY && deposit.customer_id) {
      const { data: cust } = await supabase.from('customers').select('name, email').eq('id', deposit.customer_id).maybeSingle()
      if (cust?.email) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const amtLabel = refundAmount.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })
        await resend.emails.send({
          from: `${org?.name || 'Gestivio'} <noreply@gestivio.ca>`,
          to: cust.email,
          subject: `Remboursement — ${amtLabel}`,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827">
            <p>Bonjour ${cust.name || ''},</p>
            <p>Un remboursement de <strong>${amtLabel}</strong> a été émis vers la carte utilisée lors du paiement initial.</p>
            ${reason ? `<p style="color:#6b7280;font-size:13px"><strong>Motif :</strong> ${reason}</p>` : ''}
            <p style="color:#6b7280;font-size:13px">Les fonds apparaîtront sur votre relevé sous 3 à 10 jours ouvrables.</p>
          </div>`,
        })
      }
    }
  } catch (e) { console.error('[refund email]', e) }

  return NextResponse.json({ ok: true, refunded: refundAmount, totalRefunded: newRefundedAmount, status: newStatus })
}
