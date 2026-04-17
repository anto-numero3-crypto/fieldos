import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const sb = adminClient()

  const { data: org, error: orgErr } = await sb
    .from('organizations')
    .select('id, logo_url')
    .eq('owner_user_id', user.id)
    .single()

  if (orgErr || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  if (org.logo_url) {
    // Parse storage path from the public URL
    // Public URLs look like: https://<project>.supabase.co/storage/v1/object/public/business-logos/<orgId>/logo.png
    try {
      const url = new URL(org.logo_url)
      const marker = '/storage/v1/object/public/business-logos/'
      const idx = url.pathname.indexOf(marker)
      if (idx !== -1) {
        const storagePath = url.pathname.slice(idx + marker.length)
        await sb.storage.from('business-logos').remove([storagePath])
      }
    } catch {
      // If URL parsing fails, still clear the DB value
    }
  }

  const { error: updateErr } = await sb
    .from('organizations')
    .update({ logo_url: null })
    .eq('id', org.id)

  if (updateErr) {
    console.error('[delete-logo] db error:', updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
