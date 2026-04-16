import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { getValidAccessToken } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const supabase = adminClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('id, timezone, google_calendar_connected, google_calendar_email, google_calendar_token_expiry, google_calendar_access_token, google_calendar_refresh_token')
    .eq('owner_user_id', user.id)
    .single()

  if (!org) return NextResponse.json({ error: 'No organization' }, { status: 404 })

  const envOk = {
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || null,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  const db = {
    orgId: org.id,
    connected: !!org.google_calendar_connected,
    email: org.google_calendar_email,
    hasAccessToken: !!org.google_calendar_access_token,
    hasRefreshToken: !!org.google_calendar_refresh_token,
    tokenExpiry: org.google_calendar_token_expiry,
    timezone: org.timezone,
  }

  let tokenTest: { ok: boolean; error?: string } = { ok: false }
  if (org.google_calendar_connected) {
    const tok = await getValidAccessToken(org.id)
    tokenTest = tok ? { ok: true } : { ok: false, error: 'getValidAccessToken returned null — check server logs' }
  }

  let columnTest: { jobsHasGoogleEventId: boolean; error?: string } = { jobsHasGoogleEventId: false }
  const { error: colErr } = await supabase.from('jobs').select('google_event_id').limit(1)
  if (colErr) columnTest = { jobsHasGoogleEventId: false, error: colErr.message }
  else columnTest = { jobsHasGoogleEventId: true }

  return NextResponse.json({ envOk, db, tokenTest, columnTest })
}
