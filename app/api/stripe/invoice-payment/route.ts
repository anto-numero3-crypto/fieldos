import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured.' }, { status: 503 })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { invoiceId } = await req.json()
    if (!invoiceId) return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })

    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, amount, invoice_number, customers(name, email)')
      .eq('id', invoiceId)
      .single()

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    const customer = invoice.customers as unknown as { name: string; email?: string } | null
    const origin = req.headers.get('origin') || 'https://gestivio-theta.vercel.app'
    const amountCents = Math.round(parseFloat(String(invoice.amount)) * 100)

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
      success_url: `${origin}/invoices/${invoiceId}?paid=true`,
      cancel_url:  `${origin}/invoices/${invoiceId}`,
      metadata: { invoiceId },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Invoice payment error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
