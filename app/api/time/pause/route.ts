import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const { entryId } = await req.json() as { entryId?: string }
  if (!entryId) return NextResponse.json({ error: 'missing entryId' }, { status: 400 })

  const sb = adminClient()

  const { data: entry } = await sb
    .from('time_entries')
    .select('*')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!entry) return NextResponse.json({ error: 'entry_not_found' }, { status: 404 })

  const { data: updated, error } = await sb
    .from('time_entries')
    .update({ status: 'paused', pause_started_at: new Date().toISOString() })
    .eq('id', entryId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, entry: updated })
}
