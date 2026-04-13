import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase-server'

// Public endpoint: customers pay invoices via a token link. We verify the
// token against the invoice row so only the intended recipient can pay.
// When the business has Stripe Connect configured, charges are routed to
// the connected account.
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Paiement non configuré.' }, { status: 503 })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
    const supabase = adminClient()

    const { invoiceId, token, returnPath } = await req.json()
    if (!invoiceId) return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
    if (!token)     return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, user_id, amount, invoice_number, token, customers(name, email)')
      .eq('id', invoiceId)
      .single()

    if (!invoice || invoice.token !== token) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    const customer = invoice.customers as unknown as { name: string; email?: string } | null
    const origin = req.headers.get('origin') || 'https://gestivio.ca'
    const amountCents = Math.round(parseFloat(String(invoice.amount)) * 100)
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return NextResponse.json({ error: 'Montant de facture invalide.' }, { status: 400 })
    }

    // Resolve the business's Stripe Connect account (optional)
    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_connect_account_id, stripe_connect_charges_enabled, name')
      .eq('owner_user_id', invoice.user_id)
      .maybeSingle()

    const connectAccount = org?.stripe_connect_account_id || null
    const chargesEnabled = !!org?.stripe_connect_charges_enabled
    const useConnect = connectAccount && chargesEnabled
    const businessName = org?.name || undefined

    const safeReturn = typeof returnPath === 'string' && returnPath.startsWith('/') ? returnPath : `/invoice/${token}`

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      locale: 'fr-CA',
      line_items: [{
        price_data: {
          currency: 'cad',
          unit_amount: amountCents,
          product_data: {
            name: invoice.invoice_number ? `Facture ${invoice.invoice_number}` : 'Paiement de facture',
            description: businessName || (customer?.name ? `Paiement de ${customer.name}` : undefined),
          },
        },
        quantity: 1,
      }],
      customer_email: customer?.email || undefined,
      success_url: `${origin}${safeReturn}?paid=true`,
      cancel_url:  `${origin}${safeReturn}`,
      metadata: {
        invoiceId,
        invoice_token: token,
        payment_mode: useConnect ? 'connect' : 'platform',
      },
    }

    const session = useConnect
      ? await stripe.checkout.sessions.create(params, { stripeAccount: connectAccount! })
      : await stripe.checkout.sessions.create(params)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Invoice payment error:', err)
    const msg = err instanceof Error ? err.message : 'Erreur de paiement'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
