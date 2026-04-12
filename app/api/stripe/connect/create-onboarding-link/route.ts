import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[Stripe Onboarding] STRIPE_SECRET_KEY is not set')
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

  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('stripe_connect_account_id')
    .eq('owner_user_id', userId)
    .single()

  if (orgErr) {
    console.error('[Stripe Onboarding] Org lookup error:', orgErr)
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

    console.log('[Stripe Onboarding] Link created for account:', org.stripe_connect_account_id)
    return NextResponse.json({ url: link.url })
  } catch (err) {
    console.error('[Stripe Onboarding] accountLinks.create failed:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Stripe error: ${msg}` }, { status: 500 })
  }
}
