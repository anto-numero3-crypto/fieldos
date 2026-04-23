import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// GET /api/invoices/public/[token] — returns invoice + org for the public
// invoice view. Uses the service role server-side; RLS on invoices is
// authenticated-only so there is no client-side leak.
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params
  if (!token || token.length < 10) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const supabase = adminClient()

  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select(`
      id, user_id, token, invoice_number, amount, subtotal,
      tax_rate, tax_amount, tax_name,
      tax2_rate, tax2_amount, tax2_name,
      discount, status, due_date, created_at, paid_at,
      client_notes, terms, line_items,
      customers(name, email, phone, address)
    `)
    .eq('token', token)
    .maybeSingle()

  if (invErr || !invoice) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let org = null
  if (invoice.user_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name, email, phone, address, city, state, zip, tax_number, logo_url, stripe_connect_charges_enabled, plan, tps_number, tvq_number, neq_number, rbq_number, cmeq_number, cmmtq_number, other_licence_name, other_licence_number')
      .eq('owner_user_id', invoice.user_id)
      .maybeSingle()
    org = orgData
  }

  return NextResponse.json({ invoice, org })
}
