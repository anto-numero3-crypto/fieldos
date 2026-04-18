import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const sb = adminClient()

  // Find employee
  const { data: emp } = await sb
    .from('employees')
    .select('id, email')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (!emp) return NextResponse.json({ entry: null })

  // Find team_member
  const { data: tm } = await sb
    .from('team_members')
    .select('id')
    .eq('email', emp.email)
    .maybeSingle()

  if (!tm) return NextResponse.json({ entry: null })

  const { data: entry } = await sb
    .from('time_entries')
    .select('*, jobs(id, title, customers(name))')
    .eq('team_member_id', tm.id)
    .is('clocked_out_at', null)
    .maybeSingle()

  return NextResponse.json({ entry: entry || null })
}
