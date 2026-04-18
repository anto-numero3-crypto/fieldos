import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const sb = adminClient()

  // Query by user_id directly — works for both employees and team_members
  const { data: entry } = await sb
    .from('time_entries')
    .select('*, jobs(id, title, customers(name))')
    .eq('user_id', user.id)
    .is('clocked_out_at', null)
    .maybeSingle()

  return NextResponse.json({ entry: entry || null })
}
