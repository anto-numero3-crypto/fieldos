import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase-server'

// Public endpoint: customers pay invoices via a token link. We verify the
// token against the invoice row so only the intended recipient can pay.
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured.' }, { status: 503 })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
    const supabase = adminClient()

    const { invoiceId, token, returnPath } = await req.json()
    if (!invoiceId) return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
    if (!token)     return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, amount, invoice_number, token, customers(name, email)')
      .eq('id', invoiceId)
      .single()

    if (!invoice || invoice.token !== token) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const customer = invoice.customers as unknown as { name: string; email?: string } | null
    const origin = req.headers.get('origin') || 'https://gestivio.ca'
    const amountCents = Math.round(parseFloat(String(invoice.amount)) * 100)
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return NextResponse.json({ error: 'Invalid invoice amount' }, { status: 400 })
    }

    const safeReturn = typeof returnPath === 'string' && returnPath.startsWith('/') ? returnPath : `/invoice/${token}`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'cad',
          unit_amount: amountCents,
          product_data: {
            name: invoice.invoice_number ? `Invoice ${invoice.invoice_number}` : 'Invoice Payment',
            description: customer?.name ? `Payment for ${customer.name}` : undefined,
          },
        },
        quantity: 1,
      }],
      customer_email: customer?.email || undefined,
      success_url: `${origin}${safeReturn}?paid=true`,
      cancel_url:  `${origin}${safeReturn}`,
      metadata: { invoiceId },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Invoice payment error:', err)
    return NextResponse.json({ error: 'Payment error' }, { status: 500 })
  }
}
