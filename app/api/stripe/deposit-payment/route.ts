import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase-server'

// POST /api/stripe/deposit-payment
// Body: { source: 'quote' | 'contract' | 'job', token }
// Returns: { url } — a Stripe Checkout URL.
// The webhook completes the flow: marks the deposit paid, updates the source
// record, inserts a row into the deposits audit table, and notifies the
// merchant.
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Paiement non configuré.' }, { status: 503 })
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
    const supabase = adminClient()

    const { source, token } = await req.json()
    if (!source || !['quote', 'contract', 'job'].includes(source)) {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
    }
    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    type SourceRow = {
      id: string
      user_id: string
      deposit_required?: boolean | null
      deposit_amount: number | null
      deposit_paid_at: string | null
      title?: string | null
      quote_number?: string | null
      customer_id?: string | null
      org_id?: string | null
    }

    let sourceRow: SourceRow | null = null
    let tokenColumn = 'token'
    let returnPath = '/'
    let productName = ''

    if (source === 'quote') {
      const { data } = await supabase
        .from('quotes')
        .select('id, user_id, customer_id, title, quote_number, deposit_required, deposit_amount, deposit_paid_at')
        .eq('token', token)
        .maybeSingle()
      sourceRow = data as SourceRow | null
      returnPath = `/devis/${token}`
      productName = sourceRow?.quote_number
        ? `Acompte — Devis ${sourceRow.quote_number}`
        : `Acompte — ${sourceRow?.title || 'Devis'}`
    } else if (source === 'contract') {
      const { data } = await supabase
        .from('contracts')
        .select('id, org_id, title, customer_id, deposit_required, deposit_amount, deposit_paid_at, approval_token')
        .eq('approval_token', token)
        .maybeSingle()
      if (data) {
        // Resolve org owner → user_id
        const { data: org } = await supabase.from('organizations').select('owner_user_id').eq('id', data.org_id).maybeSingle()
        sourceRow = {
          id: data.id,
          user_id: (org?.owner_user_id as string) || '',
          customer_id: data.customer_id,
          title: data.title,
          deposit_required: data.deposit_required,
          deposit_amount: data.deposit_amount,
          deposit_paid_at: data.deposit_paid_at,
          org_id: data.org_id,
        }
      }
      tokenColumn = 'approval_token'
      returnPath = `/contrat/${token}`
      productName = `Acompte — Contrat ${sourceRow?.title || ''}`
    } else if (source === 'job') {
      const { data } = await supabase
        .from('jobs')
        .select('id, user_id, customer_id, title, deposit_required, deposit_amount, deposit_paid_at, deposit_token')
        .eq('deposit_token', token)
        .maybeSingle()
      sourceRow = data as SourceRow | null
      tokenColumn = 'deposit_token'
      returnPath = `/acompte/${token}`
      productName = `Acompte — ${sourceRow?.title || 'Intervention'}`
    }

    if (!sourceRow) {
      return NextResponse.json({ error: 'Source introuvable' }, { status: 404 })
    }
    if (!sourceRow.deposit_required || !sourceRow.deposit_amount) {
      return NextResponse.json({ error: 'Aucun acompte requis' }, { status: 400 })
    }
    if (sourceRow.deposit_paid_at) {
      return NextResponse.json({ error: 'Acompte déjà versé' }, { status: 400 })
    }

    const amountCents = Math.round(parseFloat(String(sourceRow.deposit_amount)) * 100)
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    // Fetch customer email for Stripe receipt
    let customerEmail: string | undefined
    if (sourceRow.customer_id) {
      const { data: cust } = await supabase
        .from('customers')
        .select('email')
        .eq('id', sourceRow.customer_id)
        .maybeSingle()
      customerEmail = cust?.email || undefined
    }

    // Stripe Connect routing
    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_connect_account_id, stripe_connect_charges_enabled, name')
      .eq('owner_user_id', sourceRow.user_id)
      .maybeSingle()

    const connectAccount = org?.stripe_connect_account_id || null
    const chargesEnabled = !!org?.stripe_connect_charges_enabled
    const useConnect = connectAccount && chargesEnabled
    if (!useConnect) {
      return NextResponse.json({
        error: 'Le prestataire n\'a pas activé les paiements en ligne.',
      }, { status: 400 })
    }

    const origin = req.headers.get('origin') || 'https://gestivio.ca'

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      locale: 'fr-CA',
      line_items: [{
        price_data: {
          currency: 'cad',
          unit_amount: amountCents,
          product_data: {
            name: productName || 'Acompte',
            description: org?.name || undefined,
          },
        },
        quantity: 1,
      }],
      customer_email: customerEmail,
      success_url: `${origin}${returnPath}?paid=true`,
      cancel_url: `${origin}${returnPath}`,
      metadata: {
        deposit_source: source,
        deposit_source_id: sourceRow.id,
        deposit_token: token,
        deposit_token_column: tokenColumn,
        user_id: sourceRow.user_id,
        payment_mode: 'connect',
        kind: 'deposit',
      },
    }

    const session = await stripe.checkout.sessions.create(params, { stripeAccount: connectAccount! })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[deposit-payment]', err)
    const msg = err instanceof Error ? err.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
