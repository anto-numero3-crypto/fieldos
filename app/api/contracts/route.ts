import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { estimateVisitCount } from '@/lib/recurring-dates'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const supabase = adminClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!org) return NextResponse.json({ contracts: [] })

  const { data, error } = await supabase
    .from('contracts')
    .select('*, customers(id, name, email)')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[contracts list] fetch failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ contracts: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const supabase = adminClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!org) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const body = await req.json()
  const {
    title, customer_id, start_date, end_date, recurrence_type,
    recurrence_days, service_name, service_description,
    price_per_visit, billing_type, billing_frequency,
    include_tps, include_tvq,
    notes, internal_notes, description,
    deposit_required, deposit_type, deposit_value, deposit_taxes_included,
  } = body

  if (!title || !customer_id || !start_date || !end_date || !recurrence_type || !service_name) {
    return NextResponse.json(
      { error: 'Missing required fields: title, customer_id, start_date, end_date, recurrence_type, service_name' },
      { status: 400 },
    )
  }

  const visitCount = recurrence_type === 'none'
    ? 1
    : estimateVisitCount(start_date, end_date, recurrence_type, recurrence_days || [])

  const total_price = (price_per_visit || 0) * visitCount

  // Compute deposit amount if required
  let depositAmount: number | null = null
  if (deposit_required && deposit_type && deposit_value) {
    const tpsRate = include_tps !== false ? 0.05 : 0
    const tvqRate = include_tvq !== false ? 0.09975 : 0
    const withTax = total_price * (1 + tpsRate + tvqRate)
    if (deposit_type === 'fixed') {
      depositAmount = Math.min(Number(deposit_value), withTax)
    } else {
      const pct = Math.min(Math.max(Number(deposit_value), 0), 100) / 100
      const base = deposit_taxes_included ? withTax : total_price
      depositAmount = Math.round(base * pct * 100) / 100
    }
  }

  const { data, error } = await supabase
    .from('contracts')
    .insert({
      org_id: org.id,
      customer_id,
      title,
      description: description || null,
      status: 'draft',
      start_date,
      end_date,
      recurrence_type,
      recurrence_days: recurrence_days || null,
      service_name,
      service_description: service_description || null,
      price_per_visit: price_per_visit || 0,
      total_price,
      billing_type: billing_type || 'per_visit',
      billing_frequency: billing_frequency || 'monthly',
      include_tps: include_tps !== false,
      include_tvq: include_tvq !== false,
      approval_token: crypto.randomUUID(),
      notes: notes || null,
      internal_notes: internal_notes || null,
      jobs_generated_count: 0,
      next_job_date: null,
      last_job_generated_at: null,
      deposit_required: !!deposit_required,
      deposit_type: deposit_required ? deposit_type : null,
      deposit_value: deposit_required ? Number(deposit_value) || null : null,
      deposit_taxes_included: !!deposit_taxes_included,
      deposit_amount: depositAmount,
    })
    .select()
    .single()

  if (error) {
    console.error('[contracts create] insert failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ contract: data })
}
