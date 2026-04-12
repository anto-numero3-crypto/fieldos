import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_connect_account_id')
    .eq('owner_user_id', userId)
    .single()

  if (!org?.stripe_connect_account_id) {
    return NextResponse.json({ error: 'No Stripe Connect account found. Create one first.' }, { status: 400 })
  }

  const origin = req.headers.get('origin') || 'https://gestivio.ca'

  const link = await stripe.accountLinks.create({
    account: org.stripe_connect_account_id,
    refresh_url: `${origin}/settings?tab=billing&refresh=true`,
    return_url:  `${origin}/settings?tab=billing&connected=true`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: link.url })
}
