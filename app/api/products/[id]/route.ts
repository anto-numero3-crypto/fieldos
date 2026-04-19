import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

async function getOrgId(supabase: ReturnType<typeof adminClient>, userId: string) {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle()
  return data?.id ?? null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()
  const { id } = await params

  const supabase = adminClient()
  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .maybeSingle()

  if (error) {
    console.error('[product get] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ product: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()
  const { id } = await params

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Missing body' }, { status: 400 })

  const supabase = adminClient()
  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) updates.name = body.name
  if (body.description !== undefined) updates.description = body.description
  if (body.unit_price !== undefined) updates.unit_price = typeof body.unit_price === 'number' ? body.unit_price : parseFloat(String(body.unit_price)) || 0
  if (body.unit !== undefined) updates.unit = body.unit
  if (body.category !== undefined) updates.category = body.category
  if (body.is_service !== undefined) updates.is_service = body.is_service
  if (body.is_active !== undefined) updates.is_active = body.is_active

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) {
    console.error('[product update] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ product: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()
  const { id } = await params

  const supabase = adminClient()
  const orgId = await getOrgId(supabase, user.id)
  if (!orgId) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  // Soft delete: set is_active = false
  const { error } = await supabase
    .from('products')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', orgId)

  if (error) {
    console.error('[product delete] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
