import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  // Get existing org data
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_connect_account_id, email, name')
    .eq('owner_user_id', userId)
    .single()

  // If already has a connect account, return it
  if (org?.stripe_connect_account_id) {
    return NextResponse.json({ accountId: org.stripe_connect_account_id })
  }

  // Get user email if not in org
  const { data: authUser } = await supabase.auth.admin?.getUserById(userId) || {}
  const email = org?.email || authUser?.user?.email

  // Create a Standard Stripe Connect account
  const account = await stripe.accounts.create({
    type: 'standard',
    country: 'CA',
    email: email || undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      name: org?.name || undefined,
    },
  })

  // Save to organizations
  await supabase
    .from('organizations')
    .update({ stripe_connect_account_id: account.id })
    .eq('owner_user_id', userId)

  return NextResponse.json({ accountId: account.id })
}
