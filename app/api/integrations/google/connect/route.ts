import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { buildAuthUrl } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 503 })
  }

  const supabase = adminClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .single()
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const state = Buffer.from(JSON.stringify({ orgId: org.id, userId: user.id, ts: Date.now() })).toString('base64url')
  const url = buildAuthUrl(state)
  return NextResponse.redirect(url)
}
