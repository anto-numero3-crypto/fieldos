import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') || ''
  const query  = req.nextUrl.searchParams.get('secret') || ''
  return header === `Bearer ${secret}` || query === secret
}

// GET  /api/admin/promo           — list all codes + recent redemptions
// POST /api/admin/promo           — create a new code
// PATCH /api/admin/promo?id=...   — toggle is_active or update fields
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = adminClient()
  const [codesRes, redsRes] = await Promise.all([
    supabase.from('promo_codes').select('*').order('created_at', { ascending: false }),
    supabase
      .from('promo_code_redemptions')
      .select('id, user_id, org_id, redeemed_at, plan_expires_at, promo_code_id, promo_codes(code, plan)')
      .order('redeemed_at', { ascending: false })
      .limit(50),
  ])
  return NextResponse.json({ codes: codesRes.data || [], redemptions: redsRes.data || [] })
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json() as {
    code?: string
    plan?: 'demarrage' | 'pro' | 'croissance' | 'starter' | 'business'
    duration_days?: number
    max_uses?: number
    description?: string
    expires_at?: string | null
  }
  if (!body.code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      code: body.code.trim().toUpperCase(),
      plan: body.plan || 'croissance',
      duration_days: body.duration_days ?? 30,
      max_uses: body.max_uses ?? 1,
      description: body.description || null,
      expires_at: body.expires_at || null,
      is_active: true,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ code: data })
}

export async function PATCH(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const body = await req.json() as {
    is_active?: boolean
    description?: string
    duration_days?: number
    max_uses?: number
    expires_at?: string | null
  }
  const supabase = adminClient()
  const { error } = await supabase.from('promo_codes').update(body).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
