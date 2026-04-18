import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const sb = adminClient()
  const url = new URL(req.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const employeeId = url.searchParams.get('employee_id')

  // Verify this user is an org owner
  const { data: org } = await sb
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()
  if (!org) return NextResponse.json({ error: 'not_owner' }, { status: 403 })

  // Get all employees for this org
  const { data: orgEmployees } = await sb
    .from('employees')
    .select('id, email, first_name, last_name, hourly_rate, color')
    .eq('org_id', org.id)

  if (!orgEmployees || orgEmployees.length === 0) {
    return NextResponse.json({ entries: [] })
  }

  // Build employee lookup by id
  const empById: Record<string, { email: string; first_name: string; last_name: string; hourly_rate: number | null; color: string | null }> = {}
  for (const e of orgEmployees) {
    empById[e.id] = { email: e.email, first_name: e.first_name, last_name: e.last_name, hourly_rate: e.hourly_rate, color: e.color }
  }

  // Filter by specific employee if requested
  const targetEmployeeIds = employeeId ? [employeeId] : orgEmployees.map(e => e.id)

  // Query time_entries joined via team_member_id = employees.id
  let query = sb
    .from('time_entries')
    .select('*, jobs(id, title, customers(name))')
    .in('team_member_id', targetEmployeeIds)
    .order('clocked_in_at', { ascending: false })

  if (from) query = query.gte('clocked_in_at', `${from}T00:00:00`)
  if (to) query = query.lte('clocked_in_at', `${to}T23:59:59`)

  const { data: entries, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enriched = (entries || []).map(e => {
    const empInfo = empById[e.team_member_id]
    return {
      ...e,
      employee_name: empInfo ? `${empInfo.first_name} ${empInfo.last_name}` : 'Unknown',
      employee_color: empInfo?.color || null,
      hourly_rate: empInfo?.hourly_rate || null,
    }
  })

  return NextResponse.json({ entries: enriched })
}
