import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import crypto from 'crypto'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()
  const { id } = await params

  const supabase = adminClient()

  // Verify org ownership
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!org) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  // Fetch contract
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .eq('org_id', org.id)
    .maybeSingle()

  if (contractError || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  const body = await req.json()
  const { jobIds } = body as { jobIds: string[]; month?: string }

  if (!jobIds || jobIds.length === 0) {
    return NextResponse.json({ error: 'No jobs selected' }, { status: 400 })
  }

  // Fetch selected jobs to verify they belong to this contract and are completed
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title, scheduled_date, status, contract_id, invoice_id')
    .in('id', jobIds)
    .eq('contract_id', id)

  if (jobsError || !jobs || jobs.length === 0) {
    return NextResponse.json({ error: 'No valid jobs found' }, { status: 400 })
  }

  // Filter only completed jobs without existing invoice
  const validJobs = jobs.filter((j) => j.status === 'completed' && !j.invoice_id)
  if (validJobs.length === 0) {
    return NextResponse.json({ error: 'No unbilled completed jobs found' }, { status: 400 })
  }

  // Calculate amounts
  const pricePerVisit = contract.price_per_visit || 0
  const subtotal = pricePerVisit * validJobs.length
  const includeTps = contract.include_tps !== false
  const includeTvq = contract.include_tvq !== false
  const tpsAmount = includeTps ? subtotal * 0.05 : 0
  const tvqAmount = includeTvq ? subtotal * 0.09975 : 0
  const total = subtotal + tpsAmount + tvqAmount

  // Build line items
  const lineItems = validJobs.map((j) => ({
    description: j.title || contract.service_name,
    qty: 1,
    unit_price: pricePerVisit,
    taxable: true,
  }))

  // Create invoice
  const invoiceToken = crypto.randomUUID()

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      customer_id: contract.customer_id,
      contract_id: contract.id,
      token: invoiceToken,
      amount: total,
      subtotal,
      tax_rate: includeTps ? 5 : null,
      tax_amount: includeTps ? tpsAmount : null,
      tax_name: includeTps ? 'TPS' : null,
      tax2_rate: includeTvq ? 9.975 : null,
      tax2_amount: includeTvq ? tvqAmount : null,
      tax2_name: includeTvq ? 'TVQ' : null,
      status: 'draft',
      line_items: lineItems,
      client_notes: contract.notes || null,
    })
    .select('id')
    .single()

  if (invoiceError || !invoice) {
    console.error('[create-invoice] insert failed:', invoiceError)
    return NextResponse.json({ error: invoiceError?.message || 'Failed to create invoice' }, { status: 500 })
  }

  // Link jobs to the invoice
  const { error: updateError } = await supabase
    .from('jobs')
    .update({ invoice_id: invoice.id })
    .in('id', validJobs.map((j) => j.id))

  if (updateError) {
    console.error('[create-invoice] job link failed:', updateError)
  }

  return NextResponse.json({ invoiceId: invoice.id })
}
