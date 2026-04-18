import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const { entryIds } = await req.json() as { entryIds?: string[] }
  if (!entryIds?.length) return NextResponse.json({ error: 'missing entryIds' }, { status: 400 })

  const sb = adminClient()

  // Verify owner
  const { data: org } = await sb
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()
  if (!org) return NextResponse.json({ error: 'not_owner' }, { status: 403 })

  // Get user_ids of all employees in this org
  const { data: orgEmployees } = await sb
    .from('employees')
    .select('user_id')
    .eq('org_id', org.id)
  const empUserIds = (orgEmployees || []).map(e => e.user_id).filter(Boolean) as string[]

  // Also get team_member IDs for legacy entries
  const { data: orgEmps } = await sb
    .from('employees')
    .select('email')
    .eq('org_id', org.id)
  const emails = (orgEmps || []).map(e => e.email)
  const { data: tms } = await sb
    .from('team_members')
    .select('id')
    .in('email', emails.length ? emails : ['__none__'])
  const tmIds = (tms || []).map(t => t.id)

  // Build OR filter to match entries belonging to this org
  const orParts: string[] = []
  if (empUserIds.length) orParts.push(`user_id.in.(${empUserIds.join(',')})`)
  if (tmIds.length) orParts.push(`team_member_id.in.(${tmIds.join(',')})`)
  if (!orParts.length) return NextResponse.json({ error: 'no_employees' }, { status: 400 })

  // Set status to 'approved' for matching entries
  const { data: updated, error } = await sb
    .from('time_entries')
    .update({ status: 'approved' })
    .in('id', entryIds)
    .or(orParts.join(','))
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, approved: (updated || []).length })
}
