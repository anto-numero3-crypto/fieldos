import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Missing body' }, { status: 400 })

  const supabase = adminClient()

  // Look up or create org
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  const payload: Record<string, unknown> = {
    owner_user_id: user.id,
    name: body.name,
    phone: body.phone,
    email: body.email,
    address: body.address,
    city: body.city,
    state: body.state,
    zip: body.zip,
    website: body.website,
    tax_number: body.tax_number,
    currency: body.currency,
    timezone: body.timezone,
    ai_agent_name: body.ai_agent_name,
    ai_agent_greeting: body.ai_agent_greeting,
    service_types: body.service_types,
    // Caller is responsible for passing these as either numbers or null.
    location_lat: body.location_lat ?? null,
    location_lng: body.location_lng ?? null,
  }
  if (typeof body.slug === 'string' && body.slug) payload.slug = body.slug

  const query = existing
    ? supabase.from('organizations').update(payload).eq('id', existing.id)
    : supabase.from('organizations').insert(payload)

  const { data, error } = await query.select('id, slug, address, city, location_lat, location_lng').single()
  if (error) {
    console.error('[settings save-business] db error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, org: data })
}
