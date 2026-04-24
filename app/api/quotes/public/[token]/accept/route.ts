import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// POST /api/quotes/public/[token]/accept
// Customer-facing accept — only works when the quote does NOT require a
// deposit. When a deposit is required, the client must go through
// /api/stripe/deposit-payment instead and acceptance is marked by the webhook
// on successful payment.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const limited = rateLimit(req, { key: 'quote-accept', limit: 20, windowMs: 60 * 60 * 1000 })
  if (limited) return limited

  const { token } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const { name, email } = body as { name?: string; email?: string }

  if (!token || token.length < 10) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })

  const supabase = adminClient()
  const { data: q } = await supabase
    .from('quotes')
    .select('id, user_id, status, deposit_required, deposit_paid_at')
    .eq('token', token)
    .maybeSingle()

  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (q.deposit_required) {
    return NextResponse.json({ error: 'This quote requires a deposit — use the Pay Deposit flow.' }, { status: 400 })
  }
  if (q.status === 'accepted' || q.status === 'converted') {
    return NextResponse.json({ ok: true, alreadyAccepted: true })
  }

  const { error: upErr } = await supabase
    .from('quotes')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by_name: name?.trim() || null,
      accepted_by_email: email?.trim() || null,
    })
    .eq('id', q.id)

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  await supabase.from('notifications').insert({
    user_id: q.user_id,
    type: 'success',
    title: 'Devis accepté',
    body: `Un client vient d'accepter votre devis.`,
    link: `/quotes`,
  })

  return NextResponse.json({ ok: true })
}
