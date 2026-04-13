import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
  const supabase = adminClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_connect_account_id')
    .eq('owner_user_id', user.id)
    .single()

  if (!org?.stripe_connect_account_id) {
    return NextResponse.json({ error: 'No connected Stripe account.' }, { status: 400 })
  }

  const link = await stripe.accounts.createLoginLink(org.stripe_connect_account_id)
  return NextResponse.json({ url: link.url })
}
