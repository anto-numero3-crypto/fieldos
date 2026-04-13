import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// POST /api/promo/redeem — authenticated user redeems a promo code.
// Body: { code, userId }
export async function POST(req: NextRequest) {
  const body = await req.json() as { code?: string; userId?: string }
  const rawCode = (body.code || '').trim().toUpperCase()
  const userId = body.userId

  if (!rawCode) return NextResponse.json({ error: 'Code manquant' }, { status: 400 })
  if (!userId)  return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })

  const supabase = adminClient()

  const { data: code } = await supabase
    .from('promo_codes')
    .select('*')
    .ilike('code', rawCode)
    .maybeSingle()

  if (!code) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 404 })
  }
  if (!code.is_active) {
    return NextResponse.json({ error: 'Code inactif' }, { status: 400 })
  }
  if (code.expires_at && new Date(code.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Code expiré' }, { status: 400 })
  }
  if (code.uses_count >= code.max_uses) {
    return NextResponse.json({ error: 'Code déjà utilisé' }, { status: 400 })
  }

  const { data: existingRedemption } = await supabase
    .from('promo_code_redemptions')
    .select('id')
    .eq('promo_code_id', code.id)
    .eq('user_id', userId)
    .maybeSingle()
  if (existingRedemption) {
    return NextResponse.json({ error: 'Vous avez déjà utilisé ce code' }, { status: 400 })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle()
  if (!org) {
    return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })
  }

  const now = new Date()
  const planExpiresAt = new Date(now.getTime() + code.duration_days * 24 * 60 * 60 * 1000)

  // Atomic-ish: increment usage, create redemption, upgrade org.
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

  return NextResponse.json({
    success: true,
    plan: code.plan,
    durationDays: code.duration_days,
    expiresAt: planExpiresAt.toISOString(),
    description: code.description,
  })
}
