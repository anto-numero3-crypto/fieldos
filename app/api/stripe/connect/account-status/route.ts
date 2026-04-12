import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_onboarding_complete')
    .eq('owner_user_id', userId)
    .single()

  if (!org?.stripe_connect_account_id) {
    return NextResponse.json({ connected: false })
  }

  try {
    const account = await stripe.accounts.retrieve(org.stripe_connect_account_id)

    // Update DB with fresh status
    await supabase
      .from('organizations')
      .update({
        stripe_connect_charges_enabled:       account.charges_enabled,
        stripe_connect_payouts_enabled:       account.payouts_enabled,
        stripe_connect_onboarding_complete:   account.details_submitted,
        stripe_connect_connected_at:          account.created ? new Date(account.created * 1000).toISOString() : undefined,
      })
      .eq('owner_user_id', userId)

    return NextResponse.json({
      connected:           true,
      accountId:           account.id,
      chargesEnabled:      account.charges_enabled,
      payoutsEnabled:      account.payouts_enabled,
      detailsSubmitted:    account.details_submitted,
      email:               account.email,
      displayName:         account.settings?.dashboard?.display_name || account.business_profile?.name,
      onboardingComplete:  account.details_submitted && account.charges_enabled,
    })
  } catch (err) {
    console.error('Stripe account retrieval error:', err)
    return NextResponse.json({ connected: false, error: String(err) })
  }
}
