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
    .select('stripe_connect_account_id')
    .eq('owner_user_id', user.id)
    .single()

  if (orgErr) {
    return NextResponse.json({ error: 'Organization not found. Save your business settings first.' }, { status: 404 })
  }
  if (!org?.stripe_connect_account_id) {
    return NextResponse.json({ error: 'No Stripe Connect account found. Create one first.' }, { status: 400 })
  }

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://gestivio.ca'

  try {
    const link = await stripe.accountLinks.create({
      account: org.stripe_connect_account_id,
      refresh_url: `${origin}/settings?tab=billing&refresh=true`,
      return_url:  `${origin}/settings?tab=billing&connected=true`,
      type: 'account_onboarding',
    })
    return NextResponse.json({ url: link.url })
  } catch (err) {
    console.error('[Stripe Onboarding] accountLinks.create failed:', err)
    return NextResponse.json({ error: 'Stripe error creating onboarding link' }, { status: 500 })
  }
}
