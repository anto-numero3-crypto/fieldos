import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const body = await req.json()
  const entryId: string = body.entryId

  if (!entryId) return NextResponse.json({ error: 'missing entryId' }, { status: 400 })

  const sb = adminClient()

  // Find employee
  const { data: emp } = await sb
    .from('employees')
    .select('id, email')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (!emp) return NextResponse.json({ error: 'not_employee' }, { status: 403 })

  // Find the entry and verify ownership
  const { data: entry } = await sb
    .from('time_entries')
    .select('*')
    .eq('id', entryId)
    .maybeSingle()

  if (!entry) return NextResponse.json({ error: 'entry_not_found' }, { status: 404 })
  if (entry.team_member_id !== emp.id) {
    return NextResponse.json({ error: 'not_your_entry' }, { status: 403 })
  }

  const { data: updated, error } = await sb
    .from('time_entries')
    .update({
      status: 'paused',
      pause_started_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, entry: updated })
}
