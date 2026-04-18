import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { normalizePlan } from '@/lib/plan-limits'

export async function POST(req: NextRequest) {
  console.log('[employees-create] POST handler called')

  try {
    const user = await getAuthedUser(req)
    if (!user) return UNAUTHORIZED()

    const body = await req.json()
    console.log('[employees-create] body:', JSON.stringify(body))
    const { firstName, lastName, email, phone, color, hourlyRate } = body as {
      firstName?: string; lastName?: string; email?: string; phone?: string; color?: string; hourlyRate?: number
    }

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'firstName, lastName, and email are required' }, { status: 400 })
    }

    const sb = adminClient()
    const { data: org, error: orgErr } = await sb
      .from('organizations')
      .select('id, name, plan, enabled_modules')
      .eq('owner_user_id', user.id)
      .single()

    if (orgErr || !org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const plan = normalizePlan(org.plan)
    if (plan === 'demarrage') {
      return NextResponse.json({ error: 'Team management requires Pro or Croissance plan' }, { status: 403 })
    }
    if (plan === 'pro') {
      const { count } = await sb
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', org.id)
        .neq('status', 'inactive')
      if ((count || 0) >= 5) {
        return NextResponse.json({ error: 'Employee limit reached (5 for Pro plan)' }, { status: 403 })
      }
    }

    const { data: existing } = await sb
      .from('employees')
      .select('id')
      .eq('org_id', org.id)
      .eq('email', email.toLowerCase().trim())
      .neq('status', 'inactive')
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'An employee with this email already exists' }, { status: 409 })
    }

    const insertData: Record<string, unknown> = {
      org_id: org.id,
      email: email.toLowerCase().trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone?.trim() || null,
      color: color || '#6366f1',
      status: 'invited',
      role: 'employee',
    }
    if (hourlyRate !== undefined && hourlyRate !== null) {
      insertData.hourly_rate = hourlyRate
    }

    const { data: employee, error: insertErr } = await sb
      .from('employees')
      .insert(insertData)
      .select('*')
      .single()

    if (insertErr || !employee) {
      console.error('[employees-create] insert error:', insertErr)
      return NextResponse.json({ error: insertErr?.message || 'Insert failed' }, { status: 500 })
    }

    console.log('[employees-create] created employee:', employee.id)
    return NextResponse.json({ ok: true, employee })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[employees-create] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const sb = adminClient()

  // Find org owned by this user
  const { data: org } = await sb
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .single()

  if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

  const { data, error } = await sb
    .from('employees')
    .select('*')
    .eq('org_id', org.id)
    .neq('status', 'inactive')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[employees list]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ employees: data || [] })
}
