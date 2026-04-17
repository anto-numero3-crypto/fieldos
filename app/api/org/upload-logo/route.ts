import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

const EXT_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const file = formData.get('logo') as File | null
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Accepted: JPG, PNG, WebP.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 2 MB.' }, { status: 400 })
  }

  const sb = adminClient()

  // Get org
  const { data: org, error: orgErr } = await sb
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .single()

  if (orgErr || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const extension = EXT_MAP[file.type] || '.png'
  const path = `${org.id}/logo${extension}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await sb.storage
    .from('business-logos')
    .upload(path, buffer, { upsert: true, contentType: file.type })

  if (uploadErr) {
    console.error('[upload-logo] storage error:', uploadErr)
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data: urlData } = sb.storage.from('business-logos').getPublicUrl(path)
  const logoUrl = urlData.publicUrl

  const { error: updateErr } = await sb
    .from('organizations')
    .update({ logo_url: logoUrl })
    .eq('id', org.id)

  if (updateErr) {
    console.error('[upload-logo] db error:', updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, logo_url: logoUrl })
}
