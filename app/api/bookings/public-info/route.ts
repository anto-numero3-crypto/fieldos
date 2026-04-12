import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET /api/bookings/public-info?slug=foo
// Returns org info, active services, and booking page settings — bypasses RLS
// so public booking pages render reliably even if RLS policies aren't applied.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const supabase = adminClient()

  // Allow UUID or slug lookup
  const isUUID = /^[0-9a-f-]{36}$/i.test(slug)
  const orgQuery = supabase
    .from('organizations')
    .select('id, slug, name, phone, email, owner_user_id, ai_agent_name')
  const { data: org } = isUUID
    ? await orgQuery.eq('id', slug).maybeSingle()
    : await orgQuery.eq('slug', slug).maybeSingle()

  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const [{ data: services }, { data: settings }] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, description, category, base_price, duration_minutes')
      .eq('user_id', org.owner_user_id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('availability_settings')
      .select('*')
      .eq('user_id', org.owner_user_id)
      .maybeSingle(),
  ])

  return NextResponse.json({
    org: {
      id: org.id,
      slug: org.slug,
      name: org.name,
      phone: org.phone,
      email: org.email,
      owner_user_id: org.owner_user_id,
      ai_agent_name: org.ai_agent_name,
    },
    services: services || [],
    settings: settings || null,
  })
}
