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
    notes, internal_notes, description,
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
      approval_token: crypto.randomUUID(),
      notes: notes || null,
      internal_notes: internal_notes || null,
      jobs_generated_count: 0,
      next_job_date: null,
      last_job_generated_at: null,
    })
    .select()
    .single()

  if (error) {
    console.error('[contracts create] insert failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ contract: data })
}
