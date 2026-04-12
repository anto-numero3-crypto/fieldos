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
    return NextResponse.json({ error: 'No connected Stripe account.' }, { status: 400 })
  }

  const link = await stripe.accounts.createLoginLink(org.stripe_connect_account_id)
  return NextResponse.json({ url: link.url })
}
