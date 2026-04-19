import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const supabase = adminClient()

  // Resolve org
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!org) return NextResponse.json({ products: [] })

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('org_id', org.id)
    .order('usage_count', { ascending: false })

  if (error) {
    console.error('[products list] fetch failed:', error)
    return NextResponse.json({ error: error.message, products: [] }, { status: 500 })
  }

  return NextResponse.json({ products: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || !body.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const supabase = adminClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('products')
    .insert({
      org_id: org.id,
      name: body.name as string,
      description: (body.description as string) || null,
      unit_price: typeof body.unit_price === 'number' ? body.unit_price : parseFloat(String(body.unit_price)) || 0,
      unit: (body.unit as string) || null,
      category: (body.category as string) || null,
      is_service: body.is_service === true,
      is_active: true,
      usage_count: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('[products create] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ product: data }, { status: 201 })
}
