import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const sb = adminClient()

  const { data: contract, error } = await sb
    .from('contracts')
    .select('*, customers(name, email, phone, address)')
    .eq('approval_token', token)
    .maybeSingle()

  if (error || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  // Fetch org info
  const { data: org } = await sb
    .from('organizations')
    .select('name, phone, email, logo_url, address, city, state, zip, tax_number')
    .eq('id', contract.org_id)
    .maybeSingle()

  // Don't expose internal fields to the public
  const publicContract = {
    id: contract.id,
    title: contract.title,
    description: contract.description,
    status: contract.status,
    start_date: contract.start_date,
    end_date: contract.end_date,
    recurrence_type: contract.recurrence_type,
    recurrence_days: contract.recurrence_days,
    service_name: contract.service_name,
    service_description: contract.service_description,
    price_per_visit: contract.price_per_visit,
    total_price: contract.total_price,
    billing_type: contract.billing_type,
    billing_frequency: contract.billing_frequency,
    include_tps: contract.include_tps,
    include_tvq: contract.include_tvq,
    notes: contract.notes,
    approval_token: contract.approval_token,
    customers: contract.customers,
  }

  return NextResponse.json({ contract: publicContract, org: org || null })
}
