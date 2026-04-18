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

  // Verify org owner
  const { data: org } = await sb
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()
  if (!org) return NextResponse.json({ error: 'not_owner' }, { status: 403 })

  // Get employees for this org (with their user_ids for matching time_entries)
  const { data: orgEmployees } = await sb
    .from('employees')
    .select('id, user_id, email, first_name, last_name, hourly_rate, color')
    .eq('org_id', org.id)
  if (!orgEmployees?.length) return NextResponse.json({ entries: [] })

  // Build lookup by user_id (time_entries stores user_id)
  const empByUserId: Record<string, typeof orgEmployees[0]> = {}
  const empById: Record<string, typeof orgEmployees[0]> = {}
  for (const e of orgEmployees) {
    if (e.user_id) empByUserId[e.user_id] = e
    empById[e.id] = e
  }

  // Determine which user_ids to query
  let targetUserIds: string[]
  if (employeeId) {
    const emp = empById[employeeId]
    targetUserIds = emp?.user_id ? [emp.user_id] : []
  } else {
    targetUserIds = orgEmployees.filter(e => e.user_id).map(e => e.user_id!)
  }

  // Also include entries by team_member_id for legacy compatibility
  const targetTmEmails = employeeId
    ? [empById[employeeId]?.email].filter(Boolean) as string[]
    : orgEmployees.map(e => e.email)
  const { data: tms } = await sb
    .from('team_members')
    .select('id, email')
    .in('email', targetTmEmails)
  const tmIds = (tms || []).map(t => t.id)

  // Query: entries where user_id matches OR team_member_id matches
  const orParts: string[] = []
  if (targetUserIds.length) orParts.push(`user_id.in.(${targetUserIds.join(',')})`)
  if (tmIds.length) orParts.push(`team_member_id.in.(${tmIds.join(',')})`)
  if (!orParts.length) return NextResponse.json({ entries: [] })

  let query = sb
    .from('time_entries')
    .select('*, jobs(id, title, customers(name))')
    .or(orParts.join(','))
    .order('clocked_in_at', { ascending: false })

  if (from) query = query.gte('clocked_in_at', `${from}T00:00:00`)
  if (to) query = query.lte('clocked_in_at', `${to}T23:59:59`)

  const { data: entries, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with employee info
  // Build team_member email lookup
  const tmEmailById: Record<string, string> = {}
  for (const t of tms || []) tmEmailById[t.id] = t.email

  const enriched = (entries || []).map(e => {
    // Try matching by user_id first, then by team_member_id email
    let emp = e.user_id ? empByUserId[e.user_id] : undefined
    if (!emp && e.team_member_id) {
      const tmEmail = tmEmailById[e.team_member_id]
      if (tmEmail) emp = orgEmployees.find(em => em.email === tmEmail)
    }
    return {
      ...e,
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
      employee_color: emp?.color || null,
      hourly_rate: emp?.hourly_rate || null,
    }
  })

  // Deduplicate by id (in case both conditions matched same entry)
  const seen = new Set<string>()
  const unique = enriched.filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true })

  return NextResponse.json({ entries: unique })
}
