import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  let body: { email?: string; locale?: string; source?: string } = {}
  try { body = await req.json() } catch { /* ignore */ }
  const email = (body.email || '').trim().toLowerCase()
  const locale = body.locale || 'fr'
  const source = body.source || 'website'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }

  const supabase = adminClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert({ email, locale, source, confirmed: true, confirmed_at: new Date().toISOString() }, { onConflict: 'email' })

  if (error) {
    console.error('[newsletter] subscribe failed:', error)
    return NextResponse.json({ error: "Impossible d'enregistrer l'inscription" }, { status: 500 })
  }

  // Fire-and-forget welcome email
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://gestivio.ca'}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'newsletter_welcome', to: email, locale }),
    })
  } catch { /* ignore */ }

  return NextResponse.json({ success: true })
}
