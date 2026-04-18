import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const body = await req.json()
  const jobId: string | undefined = body.jobId

  const sb = adminClient()

  // Find employee
  const { data: emp } = await sb
    .from('employees')
    .select('id, email')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (!emp) return NextResponse.json({ error: 'not_employee' }, { status: 403 })

  // Find team_member by email
  const { data: tm } = await sb
    .from('team_members')
    .select('id')
    .eq('email', emp.email)
    .maybeSingle()

  const teamMemberId = tm?.id || null

  // Check no active entry
  if (teamMemberId) {
    const { data: active } = await sb
      .from('time_entries')
      .select('*')
      .eq('team_member_id', teamMemberId)
      .is('clocked_out_at', null)
      .maybeSingle()

    if (active) {
      return NextResponse.json({ error: 'already_clocked_in', activeEntry: active }, { status: 400 })
    }
  }

  // Insert new time entry
  const insertData: Record<string, unknown> = {
    user_id: user.id,
    team_member_id: teamMemberId,
    clocked_in_at: new Date().toISOString(),
    billable: true,
  }
  if (jobId) insertData.job_id = jobId

  const { data: entry, error } = await sb
    .from('time_entries')
    .insert(insertData)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, entry })
}
