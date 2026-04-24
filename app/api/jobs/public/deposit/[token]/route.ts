import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase-server'

// GET /api/jobs/public/deposit/[token]
// Returns minimal info a customer needs to pay a standalone job deposit.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params
  if (!token || token.length < 10) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })

  const supabase = adminClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('id, user_id, title, description, deposit_amount, deposit_paid_at, customers(name, email)')
    .eq('deposit_token', token)
    .maybeSingle()

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: org } = await supabase
    .from('organizations')
    .select('name, email, phone, logo_url, stripe_connect_charges_enabled')
    .eq('owner_user_id', job.user_id)
    .maybeSingle()

  return NextResponse.json({ job, org })
}
