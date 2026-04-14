import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

// Ensures the authenticated user's organization exists and has a slug.
// Creates a row if missing; generates + saves a unique slug if null/empty.
// Returns { slug } so the client can display the booking URL immediately.
export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const supabase = adminClient()

  // Find or create org
  let { data: org } = await supabase
    .from('organizations')
    .select('id, slug, name, email')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!org) {
    const fallbackName = (user.email || 'business').split('@')[0]
    const { data: created, error: createErr } = await supabase
      .from('organizations')
      .insert({
        owner_user_id: user.id,
        name: fallbackName,
        email: user.email,
        plan: 'pro',
        plan_status: 'trial',
        plan_started_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id, slug, name, email')
      .single()
    if (createErr) {
      console.error('[ensure-slug] org create failed:', createErr)
      return NextResponse.json({ error: createErr.message }, { status: 500 })
    }
    org = created
  }

  if (org.slug) return NextResponse.json({ slug: org.slug })

  // Generate slug
  const base = String(org.name || org.email || 'entreprise')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'entreprise'

  // Check uniqueness and suffix if needed
  let candidate = base
  let n = 2
  while (n < 50) {
    const { data: clash } = await supabase
      .from('organizations').select('id').eq('slug', candidate).maybeSingle()
    if (!clash || clash.id === org.id) break
    candidate = `${base}-${n++}`
  }

  const { error: updErr } = await supabase
    .from('organizations')
    .update({ slug: candidate })
    .eq('id', org.id)

  if (updErr) {
    console.error('[ensure-slug] slug update failed:', updErr)
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({ slug: candidate })
}
