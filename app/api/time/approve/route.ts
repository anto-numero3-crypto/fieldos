import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const body = await req.json()
  const entryIds: string[] = body.entryIds

  if (!entryIds || entryIds.length === 0) {
    return NextResponse.json({ error: 'missing entryIds' }, { status: 400 })
  }

  const sb = adminClient()

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
    .select('id')
    .eq('org_id', org.id)
  const empIds = (orgEmployees || []).map(e => e.id)

  if (empIds.length === 0) {
    return NextResponse.json({ error: 'no_employees' }, { status: 400 })
  }

  // Verify all entries belong to org employees and mark as completed
  const { data: updated, error } = await sb
    .from('time_entries')
    .update({ status: 'completed' })
    .in('id', entryIds)
    .in('team_member_id', empIds)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, approved: (updated || []).length })
}
