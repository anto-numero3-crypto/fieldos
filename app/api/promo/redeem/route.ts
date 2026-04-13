import { NextRequest, NextResponse } from 'next/server'
import { normalizeCode, isValidCodeShape } from '@/lib/promo'
import { adminClient, getAuthedUser } from '@/lib/supabase-server'

const MAX_FAILS_PER_HOUR = 5
const LOCK_WINDOW_MIN = 60

type AttemptArgs = {
  code: string
  userId: string | null
  orgId: string | null
  ip: string | null
  ua: string | null
  success: boolean
  reason?: string
}
async function logAttempt(
  supabase: ReturnType<typeof adminClient>,
  a: AttemptArgs,
) {
  try {
    await supabase.from('promo_code_attempts').insert({
      code_attempted: a.code,
      user_id: a.userId,
      org_id: a.orgId,
      ip_address: a.ip,
      user_agent: a.ua,
      success: a.success,
      failure_reason: a.reason || null,
    })
  } catch { /* non-fatal */ }
}

export async function POST(req: NextRequest) {
  const supabase = adminClient()

  const body = await req.json() as { code?: string; userId?: string }
  const rawCode = normalizeCode(body.code || '')
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null
  const ua = req.headers.get('user-agent') || null

  // Allow unauthenticated calls ONLY from the auth/callback internal flow.
  // For safety: prefer authenticated session. Fallback to body userId only for
  // the signup callback (detected via same-origin request) — otherwise reject.
  const authed = await getAuthedUser(req)
  let userId: string | null = authed?.id || null

  // Callback bootstrap: accept body.userId only if request is same-origin from our app
  if (!userId && body.userId) {
    const origin = req.headers.get('origin') || ''
    const host = req.headers.get('host') || ''
    const sameOrigin = origin.includes(host) || origin.endsWith('gestivio.ca')
    if (sameOrigin) userId = body.userId
  }

  const attempt = (success: boolean, reason?: string, orgId: string | null = null) =>
    logAttempt(supabase, { code: rawCode, userId, orgId, ip, ua, success, reason })

  if (!rawCode) {
    await attempt(false, 'empty_code')
    return NextResponse.json({ error: 'Code manquant' }, { status: 400 })
  }
  if (!userId) {
    await attempt(false, 'unauthenticated')
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const windowStart = new Date(Date.now() - LOCK_WINDOW_MIN * 60 * 1000).toISOString()
  const { count: recentFails } = await supabase
    .from('promo_code_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('success', false)
    .gte('attempted_at', windowStart)
  if ((recentFails || 0) >= MAX_FAILS_PER_HOUR) {
    await attempt(false, 'rate_limited')
    return NextResponse.json({
      error: 'Trop de tentatives incorrectes. Réessayez dans 60 minutes.',
      rateLimited: true,
    }, { status: 429 })
  }

  if (!isValidCodeShape(rawCode) && !/^[A-Z0-9-]{4,40}$/.test(rawCode)) {
    await attempt(false, 'invalid_shape')
    return NextResponse.json({ error: 'Code invalide' }, { status: 400 })
  }

  const { data: code } = await supabase
    .from('promo_codes')
    .select('*')
    .ilike('code', rawCode)
    .maybeSingle()

  if (!code) {
    await attempt(false, 'not_found')
    return NextResponse.json({ error: 'Code invalide' }, { status: 404 })
  }
  if (!code.is_active) {
    await attempt(false, 'inactive', null)
    return NextResponse.json({ error: 'Code inactif' }, { status: 400 })
  }
  if (code.valid_from && new Date(code.valid_from) > new Date()) {
    await attempt(false, 'not_yet_valid')
    return NextResponse.json({ error: 'Ce code n\'est pas encore valide' }, { status: 400 })
  }
  if (code.expires_at && new Date(code.expires_at) < new Date()) {
    await attempt(false, 'expired')
    return NextResponse.json({ error: 'Code expiré' }, { status: 400 })
  }
  if (code.uses_count >= code.max_uses) {
    await attempt(false, 'max_uses')
    return NextResponse.json({ error: 'Code déjà utilisé' }, { status: 400 })
  }

  const { data: existingRedemption } = await supabase
    .from('promo_code_redemptions')
    .select('id')
    .eq('promo_code_id', code.id)
    .eq('user_id', userId)
    .maybeSingle()
  if (existingRedemption) {
    await attempt(false, 'already_redeemed')
    return NextResponse.json({ error: 'Vous avez déjà utilisé ce code' }, { status: 400 })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, email')
    .eq('owner_user_id', userId)
    .maybeSingle()
  if (!org) {
    await attempt(false, 'no_org')
    return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })
  }

  if (code.allowed_email_domains && Array.isArray(code.allowed_email_domains) && code.allowed_email_domains.length > 0) {
    const email = (org.email || '').toLowerCase()
    const domain = email.includes('@') ? email.split('@')[1] : ''
    if (!code.allowed_email_domains.map((d: string) => d.toLowerCase()).includes(domain)) {
      await attempt(false, 'domain_not_allowed', org.id)
      return NextResponse.json({ error: 'Ce code est réservé à certains domaines' }, { status: 400 })
    }
  }

  const now = new Date()
  const planExpiresAt = code.duration_days == null
    ? new Date('2099-12-31T00:00:00Z')
    : new Date(now.getTime() + code.duration_days * 24 * 60 * 60 * 1000)

  await supabase
    .from('promo_codes')
    .update({ uses_count: code.uses_count + 1 })
    .eq('id', code.id)

  await supabase.from('promo_code_redemptions').insert({
    promo_code_id: code.id,
    user_id: userId,
    org_id: org.id,
    plan_expires_at: planExpiresAt.toISOString(),
  })

  await supabase
    .from('organizations')
    .update({
      plan: code.plan,
      plan_status: 'active',
      trial_ends_at: null,
      promo_code_id: code.id,
      promo_expires_at: planExpiresAt.toISOString(),
      plan_started_at: now.toISOString(),
    })
    .eq('id', org.id)

  await attempt(true, undefined, org.id)

  return NextResponse.json({
    success: true,
    plan: code.plan,
    codeType: code.code_type || 'full_access',
    durationDays: code.duration_days,
    lifetime: code.duration_days == null,
    expiresAt: code.duration_days == null ? null : planExpiresAt.toISOString(),
    description: code.description,
  })
}
