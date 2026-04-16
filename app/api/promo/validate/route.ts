import { NextRequest, NextResponse } from 'next/server'
import { normalizeCode } from '@/lib/promo'
import { adminClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { code?: string } | null
  const raw = normalizeCode(body?.code || '')
  if (!raw) {
    return NextResponse.json({ valid: false, error: 'Code manquant' }, { status: 400 })
  }

  const supabase = adminClient()
  const { data: code } = await supabase
    .from('promo_codes')
    .select('id, code, is_active, expires_at, max_uses, uses_count, discount_percent, code_type, description, plan, duration_days')
    .ilike('code', raw)
    .maybeSingle()

  if (!code) return NextResponse.json({ valid: false, error: 'Code invalide' })
  if (!code.is_active) return NextResponse.json({ valid: false, error: 'Code inactif' })
  if (code.expires_at && new Date(code.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Code expiré' })
  }
  if (code.max_uses != null && code.uses_count >= code.max_uses) {
    return NextResponse.json({ valid: false, error: 'Code épuisé' })
  }

  const discount = typeof code.discount_percent === 'number' ? code.discount_percent : null
  const codeType = code.code_type || (discount === 100 || !discount ? 'free_access' : 'discount')
  const isFreeAccess = codeType === 'free_access' || discount === 100 || discount == null

  return NextResponse.json({
    valid: true,
    code: code.code,
    code_type: codeType,
    discount_percent: discount,
    description: code.description || null,
    plan: code.plan || null,
    duration_days: code.duration_days ?? null,
    is_free_access: isFreeAccess,
  })
}
