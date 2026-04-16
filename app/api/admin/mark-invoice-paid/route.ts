import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  const provided = req.headers.get('x-admin-secret') || ''
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null) as { invoice_id?: string; amount?: number } | null
  if (!body?.invoice_id) return NextResponse.json({ error: 'Missing invoice_id' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: inv, error: invErr } = await supabase
    .from('invoices')
    .select('id, user_id, amount, invoice_number')
    .eq('id', body.invoice_id)
    .single()
  if (invErr || !inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const amount = typeof body.amount === 'number' ? body.amount : parseFloat(String(inv.amount))
  const paidAt = new Date().toISOString()

  const { error: upErr } = await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: paidAt, payment_method: 'stripe' })
    .eq('id', inv.id)
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { error: payErr } = await supabase.from('payments').insert({
    invoice_id: inv.id,
    user_id: inv.user_id,
    amount,
    payment_method: 'stripe',
    payment_date: paidAt,
    reference: 'admin-manual',
  })
  if (payErr) console.error('[admin mark-paid] payment insert failed:', payErr)

  return NextResponse.json({ ok: true, invoice: inv.invoice_number, amount })
}
