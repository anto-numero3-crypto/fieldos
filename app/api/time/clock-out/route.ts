import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const body = await req.json()
  const entryId: string = body.entryId
  const notes: string | undefined = body.notes

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

  // Find team_member
  const { data: tm } = await sb
    .from('team_members')
    .select('id')
    .eq('email', emp.email)
    .maybeSingle()

  // Find the entry and verify ownership
  const { data: entry } = await sb
    .from('time_entries')
    .select('*')
    .eq('id', entryId)
    .maybeSingle()

  if (!entry) return NextResponse.json({ error: 'entry_not_found' }, { status: 404 })
  if (tm && entry.team_member_id !== tm.id) {
    return NextResponse.json({ error: 'not_your_entry' }, { status: 403 })
  }

  // Calculate duration
  const clockedIn = new Date(entry.clocked_in_at).getTime()
  const now = Date.now()
  const durationMinutes = Math.round((now - clockedIn) / 60000)

  const updateData: Record<string, unknown> = {
    clocked_out_at: new Date().toISOString(),
    duration_minutes: durationMinutes,
  }
  if (notes !== undefined) updateData.notes = notes

  const { data: updated, error } = await sb
    .from('time_entries')
    .update(updateData)
    .eq('id', entryId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, entry: updated })
}
