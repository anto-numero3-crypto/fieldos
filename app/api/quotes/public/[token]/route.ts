import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// GET /api/quotes/public/[token]
// Returns the quote + org for the public quote page. Service-role bypass so
// RLS on quotes stays authenticated-only.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params
  if (!token || token.length < 10) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }
  const supabase = adminClient()

  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      id, user_id, customer_id, title, quote_number, status,
      line_items, subtotal, tax_rate, tax_amount, total,
      valid_until, notes, created_at, sent_at, accepted_at,
      deposit_required, deposit_type, deposit_value, deposit_taxes_included,
      deposit_amount, deposit_paid_at, deposit_payment_intent_id,
      token,
      customers(name, email, phone, address)
    `)
    .eq('token', token)
    .maybeSingle()

  if (error || !quote) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let org = null
  if (quote.user_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name, email, phone, address, city, state, zip, logo_url, stripe_connect_charges_enabled, tps_number, tvq_number')
      .eq('owner_user_id', quote.user_id)
      .maybeSingle()
    org = orgData
  }

  return NextResponse.json({ quote, org })
}
