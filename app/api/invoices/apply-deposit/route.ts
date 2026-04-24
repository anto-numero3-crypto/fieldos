import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

// POST /api/invoices/apply-deposit
// Body: { invoiceId }
// Scans for paid deposits tied to this invoice's job or source quote and
// applies them as a credit. Idempotent — a deposit that already has
// invoice_id set is skipped. Returns the applied amount (0 if none).
export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const { invoiceId } = await req.json()
  if (!invoiceId) return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })

  const supabase = adminClient()

  const { data: inv } = await supabase
    .from('invoices')
    .select('id, user_id, job_id, source_quote_id, deposit_amount_applied')
    .eq('id', invoiceId)
    .maybeSingle()

  if (!inv || inv.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Skip if already applied (idempotent).
  if (inv.deposit_amount_applied && Number(inv.deposit_amount_applied) > 0) {
    return NextResponse.json({ ok: true, amount: Number(inv.deposit_amount_applied), alreadyApplied: true })
  }

  // Locate deposit candidate:
  // 1. If invoice was created from a quote (source_quote_id) → deposit tied to that quote
  // 2. Else, if invoice has job_id:
  //    a. Check if job was created from a quote with a paid deposit
  //    b. Else, check if job itself has a standalone deposit
  let deposit: {
    id: string
    amount: number
    paid_at: string | null
    quote_id?: string | null
    job_id?: string | null
  } | null = null

  if (inv.source_quote_id) {
    const { data } = await supabase
      .from('deposits')
      .select('id, amount, paid_at, quote_id, job_id')
      .eq('quote_id', inv.source_quote_id)
      .eq('status', 'paid')
      .is('invoice_id', null)
      .maybeSingle()
    deposit = data || null
  }

  if (!deposit && inv.job_id) {
    // Look up the job's quote link
    const { data: job } = await supabase
      .from('jobs')
      .select('quote_id')
      .eq('id', inv.job_id)
      .maybeSingle()

    if (job?.quote_id) {
      const { data: q } = await supabase
        .from('deposits')
        .select('id, amount, paid_at, quote_id, job_id')
        .eq('quote_id', job.quote_id)
        .eq('status', 'paid')
        .is('invoice_id', null)
        .maybeSingle()
      if (q) deposit = q
    }

    if (!deposit) {
      const { data: j } = await supabase
        .from('deposits')
        .select('id, amount, paid_at, quote_id, job_id')
        .eq('job_id', inv.job_id)
        .eq('status', 'paid')
        .is('invoice_id', null)
        .maybeSingle()
      if (j) deposit = j
    }
  }

  if (!deposit) {
    return NextResponse.json({ ok: true, amount: 0 })
  }

  const depositAmount = Number(deposit.amount)
  const paidDate = deposit.paid_at ? new Date(deposit.paid_at).toISOString().slice(0, 10) : null

  // Link deposit to invoice + set the applied columns
  await supabase.from('deposits').update({
    invoice_id: invoiceId,
    applied_at: new Date().toISOString(),
  }).eq('id', deposit.id)

  // Also stamp source_quote_id on the invoice if the deposit came via a quote
  const invPatch: Record<string, unknown> = {
    deposit_amount_applied: depositAmount,
    deposit_paid_date: paidDate,
  }
  if (deposit.quote_id && !inv.source_quote_id) invPatch.source_quote_id = deposit.quote_id
  await supabase.from('invoices').update(invPatch).eq('id', invoiceId)

  return NextResponse.json({ ok: true, amount: depositAmount, deposit_id: deposit.id })
}
