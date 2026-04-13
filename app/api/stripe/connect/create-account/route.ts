import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured — add STRIPE_SECRET_KEY to environment variables.' }, { status: 503 })
  }
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
  const supabase = adminClient()

  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, stripe_connect_account_id, email, name')
    .eq('owner_user_id', user.id)
    .single()

  if (orgErr) {
    return NextResponse.json({ error: 'Organization not found. Please save your business settings first.' }, { status: 404 })
  }

  if (org?.stripe_connect_account_id) {
    return NextResponse.json({ accountId: org.stripe_connect_account_id })
  }

  try {
    const account = await stripe.accounts.create({
      type: 'standard',
      country: 'CA',
      email: org?.email || user.email || undefined,
    })

    await supabase
      .from('organizations')
      .update({ stripe_connect_account_id: account.id })
      .eq('owner_user_id', user.id)

    return NextResponse.json({ accountId: account.id })
  } catch (err) {
    console.error('[Stripe Connect] Stripe account creation error:', err)
    return NextResponse.json({ error: 'Stripe error creating account' }, { status: 500 })
  }
}
