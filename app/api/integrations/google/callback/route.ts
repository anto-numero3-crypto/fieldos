import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser } from '@/lib/supabase-server'
import { exchangeCodeForTokens, savedEmailFromIdToken } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const stateRaw = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const origin = url.origin

  if (error) {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&google=error&reason=${encodeURIComponent(error)}`)
  }
  if (!code || !stateRaw) {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&google=error&reason=missing_code`)
  }

  let state: { orgId: string; userId: string } | null = null
  try {
    state = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'))
  } catch {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&google=error&reason=bad_state`)
  }
  if (!state?.orgId || !state?.userId) {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&google=error&reason=bad_state`)
  }

  const user = await getAuthedUser(req)
  if (!user || user.id !== state.userId) {
    return NextResponse.redirect(`${origin}/settings?tab=integrations&google=error&reason=unauthorized`)
  }

  try {
    const tok = await exchangeCodeForTokens(code)
    const email = savedEmailFromIdToken(tok.id_token)
    const expiry = new Date(Date.now() + tok.expires_in * 1000).toISOString()
    const supabase = adminClient()
    const update: Record<string, unknown> = {
      google_calendar_access_token: tok.access_token,
      google_calendar_token_expiry: expiry,
      google_calendar_connected: true,
    }
    if (tok.refresh_token) update.google_calendar_refresh_token = tok.refresh_token
    if (email) update.google_calendar_email = email
    const { error: upErr } = await supabase
      .from('organizations')
      .update(update)
      .eq('id', state.orgId)
      .eq('owner_user_id', user.id)
    if (upErr) {
      console.error('[google callback] db update failed:', upErr)
      return NextResponse.redirect(`${origin}/settings?tab=integrations&google=error&reason=db`)
    }
    return NextResponse.redirect(`${origin}/settings?tab=integrations&google=success`)
  } catch (err) {
    console.error('[google callback] failed:', err)
    return NextResponse.redirect(`${origin}/settings?tab=integrations&google=error&reason=exchange`)
  }
}
