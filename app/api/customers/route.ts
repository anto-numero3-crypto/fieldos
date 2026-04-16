import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { getPlanLimits, normalizePlan } from '@/lib/plan-limits'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[customers list] fetch failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ customers: data || [] })
}

// Gated create endpoint — enforces the per-plan maxCustomers cap server-side.
// The client also inserts directly via supabase-js but any caller using the API
// will be checked here.
export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const supabase = adminClient()

  // Resolve the user's org/plan and enforce the customer cap.
  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  const limits = getPlanLimits(normalizePlan(org?.plan))
  if (limits.maxCustomers !== Infinity) {
    const { count } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count || 0) >= limits.maxCustomers) {
      return NextResponse.json({
        error: 'limit_reached',
        message: {
          fr: `Limite de ${limits.maxCustomers} clients atteinte sur le forfait Démarrage. Passez à Pro pour un nombre illimité.`,
          en: `Démarrage plan limit of ${limits.maxCustomers} customers reached. Upgrade to Pro for unlimited.`,
        },
        upgrade_url: '/subscribe',
      }, { status: 403 })
    }
  }

  const body = await req.json().catch(() => null) as {
    name?: string; email?: string | null; phone?: string | null;
    address?: string | null; notes?: string | null; tags?: string[] | null
  } | null

  if (!body || !body.name || !body.name.trim()) {
    return NextResponse.json({ error: 'Missing name' }, { status: 400 })
  }

  const { data, error } = await supabase.from('customers').insert({
    user_id: user.id,
    name: body.name.trim(),
    email: body.email || null,
    phone: body.phone || null,
    address: body.address || null,
    notes: body.notes || null,
    tags: body.tags && body.tags.length ? body.tags : null,
  }).select('*').single()

  if (error) {
    console.error('[customers create] insert failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ customer: data })
}
