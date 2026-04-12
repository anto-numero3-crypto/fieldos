import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[Stripe Connect] STRIPE_SECRET_KEY is not set')
    return NextResponse.json({ error: 'Stripe not configured — add STRIPE_SECRET_KEY to environment variables.' }, { status: 503 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let body: { userId?: string } = {}
  try { body = await req.json() } catch { /* empty body ok */ }
  const { userId } = body

  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  // Check if org already has a connect account
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, stripe_connect_account_id, email, name')
    .eq('owner_user_id', userId)
    .single()

  if (orgErr) {
    console.error('[Stripe Connect] Org lookup error:', orgErr)
    return NextResponse.json({ error: 'Organization not found. Please save your business settings first.' }, { status: 404 })
  }

  // Already has account → return it
  if (org?.stripe_connect_account_id) {
    console.log('[Stripe Connect] Returning existing account:', org.stripe_connect_account_id)
    return NextResponse.json({ accountId: org.stripe_connect_account_id })
  }

  try {
    // Standard accounts: do NOT pass capabilities — those are set by the account holder in Stripe's dashboard
    const account = await stripe.accounts.create({
      type: 'standard',
      country: 'CA',
      email: org?.email || undefined,
    })

    console.log('[Stripe Connect] Created account:', account.id)

    // Save to org
    const { error: updateErr } = await supabase
      .from('organizations')
      .update({ stripe_connect_account_id: account.id })
      .eq('owner_user_id', userId)

    if (updateErr) {
      console.error('[Stripe Connect] Failed to save account ID:', updateErr)
      // Still return the account ID — it was created in Stripe
    }

    return NextResponse.json({ accountId: account.id })
  } catch (err) {
    console.error('[Stripe Connect] Stripe account creation error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Stripe error: ${msg}` }, { status: 500 })
  }
}
