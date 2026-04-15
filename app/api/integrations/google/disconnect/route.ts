import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { revokeToken } from '@/lib/google-calendar'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const supabase = adminClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('id, google_calendar_refresh_token, google_calendar_access_token')
    .eq('owner_user_id', user.id)
    .single()
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const tok = org.google_calendar_refresh_token || org.google_calendar_access_token
  if (tok) await revokeToken(tok)

  const { error } = await supabase
    .from('organizations')
    .update({
      google_calendar_access_token: null,
      google_calendar_refresh_token: null,
      google_calendar_token_expiry: null,
      google_calendar_connected: false,
      google_calendar_email: null,
    })
    .eq('id', org.id)
  if (error) {
    console.error('[google disconnect] db update failed:', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
