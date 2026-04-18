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

  let query = sb
    .from('time_entries')
    .select('*, jobs(id, title, customers(name)), team_members(id, name, email)')
    .order('clocked_in_at', { ascending: false })

  if (from) query = query.gte('clocked_in_at', `${from}T00:00:00`)
  if (to) query = query.lte('clocked_in_at', `${to}T23:59:59`)

  if (employeeId) {
    // Find team_member for this employee
    const { data: emp } = await sb
      .from('employees')
      .select('email')
      .eq('id', employeeId)
      .maybeSingle()
    if (emp) {
      const { data: tm } = await sb
        .from('team_members')
        .select('id')
        .eq('email', emp.email)
        .maybeSingle()
      if (tm) {
        query = query.eq('team_member_id', tm.id)
      }
    }
  }

  // Scope entries to this org's team members
  const { data: orgTeamMembers } = await sb
    .from('team_members')
    .select('id')
    .eq('user_id', user.id)
  const tmIds = (orgTeamMembers || []).map(t => t.id)
  if (tmIds.length > 0) {
    query = query.in('team_member_id', tmIds)
  } else {
    return NextResponse.json({ entries: [] })
  }

  const { data: entries, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with employee info
  const emails = new Set<string>()
  for (const e of entries || []) {
    const tm = e.team_members as { email?: string } | null
    if (tm?.email) emails.add(tm.email)
  }

  let employeeMap: Record<string, { first_name: string; last_name: string; hourly_rate: number | null }> = {}
  if (emails.size > 0) {
    const { data: emps } = await sb
      .from('employees')
      .select('email, first_name, last_name, hourly_rate')
      .in('email', Array.from(emails))
    if (emps) {
      for (const e of emps) {
        employeeMap[e.email] = { first_name: e.first_name, last_name: e.last_name, hourly_rate: e.hourly_rate }
      }
    }
  }

  const enriched = (entries || []).map(e => {
    const tm = e.team_members as { email?: string; name?: string } | null
    const empInfo = tm?.email ? employeeMap[tm.email] : null
    return {
      ...e,
      employee_name: empInfo ? `${empInfo.first_name} ${empInfo.last_name}` : (tm?.name || 'Unknown'),
      hourly_rate: empInfo?.hourly_rate || null,
    }
  })

  return NextResponse.json({ entries: enriched })
}
