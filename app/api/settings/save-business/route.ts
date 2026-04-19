import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Missing body' }, { status: 400 })

  console.log('[save-business] user:', user.id)
  console.log('[save-business] incoming body:', JSON.stringify(body))
  console.log('[save-business] location_lat =', body.location_lat, 'location_lng =', body.location_lng)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[save-business] SUPABASE_SERVICE_ROLE_KEY missing — will fall back to anon and RLS will likely block writes')
  }

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
    notification_app_prefs: body.notification_app_prefs ?? null,
    notification_email_prefs: body.notification_email_prefs ?? null,
    // Caller is responsible for passing these as either numbers or null.
    location_lat: body.location_lat ?? null,
    location_lng: body.location_lng ?? null,
  }
  // Invoice settings (only include if present in body)
  if (body.invoice_prefix !== undefined) payload.invoice_prefix = body.invoice_prefix
  if (body.invoice_next_number !== undefined) payload.invoice_next_number = body.invoice_next_number
  if (body.invoice_payment_terms !== undefined) payload.invoice_payment_terms = body.invoice_payment_terms
  if (body.invoice_default_tps !== undefined) payload.invoice_default_tps = body.invoice_default_tps
  if (body.invoice_default_tvq !== undefined) payload.invoice_default_tvq = body.invoice_default_tvq
  if (body.invoice_footer_note !== undefined) payload.invoice_footer_note = body.invoice_footer_note

  // Quebec legal / licence fields
  if (body.tps_number !== undefined) payload.tps_number = body.tps_number
  if (body.tvq_number !== undefined) payload.tvq_number = body.tvq_number
  if (body.neq_number !== undefined) payload.neq_number = body.neq_number
  if (body.rbq_number !== undefined) payload.rbq_number = body.rbq_number
  if (body.cmeq_number !== undefined) payload.cmeq_number = body.cmeq_number
  if (body.cmmtq_number !== undefined) payload.cmmtq_number = body.cmmtq_number
  if (body.other_licence_name !== undefined) payload.other_licence_name = body.other_licence_name
  if (body.other_licence_number !== undefined) payload.other_licence_number = body.other_licence_number

  if (typeof body.slug === 'string' && body.slug) payload.slug = body.slug

  const query = existing
    ? supabase.from('organizations').update(payload).eq('id', existing.id)
    : supabase.from('organizations').insert(payload)

  const { data, error } = await query.select('id, slug, address, city, location_lat, location_lng').single()
  if (error) {
    console.error('[save-business] db error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  console.log('[save-business] update result:', JSON.stringify(data))
  return NextResponse.json({ ok: true, org: data })
}
