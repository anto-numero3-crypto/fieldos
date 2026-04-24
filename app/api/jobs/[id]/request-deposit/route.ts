import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { Resend } from 'resend'

// POST /api/jobs/[id]/request-deposit
// Body: { amount, sendEmail? }
// Creates or rotates a deposit token on the job, records the deposit amount,
// and optionally emails the customer a payment link.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const amount = Number(body.amount)
  const sendEmail = body.sendEmail !== false

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const supabase = adminClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('id, user_id, title, customer_id, deposit_paid_at, customers(name, email)')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (job.deposit_paid_at) {
    return NextResponse.json({ error: 'Un acompte a déjà été versé pour cette intervention.' }, { status: 400 })
  }

  // Generate token if not already set
  const token = crypto.randomUUID()
  const { error: upErr } = await supabase
    .from('jobs')
    .update({
      deposit_required: true,
      deposit_amount: amount,
      deposit_token: token,
    })
    .eq('id', id)

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const origin = req.headers.get('origin') || 'https://gestivio.ca'
  const link = `${origin}/acompte/${token}`

  // Customer email
  const customer = job.customers as unknown as { name?: string; email?: string } | null
  if (sendEmail && customer?.email && process.env.RESEND_API_KEY) {
    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('owner_user_id', user.id)
        .maybeSingle()
      const bizName = org?.name || 'Gestivio'
      const amountLabel = amount.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: `${bizName} <noreply@gestivio.ca>`,
        to: customer.email,
        subject: `Acompte demandé — ${amountLabel}`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827">
          <div style="background:#7c3aed;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:white;margin:0;font-size:20px">Demande d'acompte</h1>
          </div>
          <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
            <p>Bonjour ${customer.name || ''},</p>
            <p>${bizName} vous demande un acompte pour « <strong>${job.title}</strong> ».</p>
            <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
              <div style="color:#6b7280;font-size:13px;margin-bottom:4px">Montant de l'acompte</div>
              <div style="font-size:28px;font-weight:700;color:#7c3aed">${amountLabel}</div>
            </div>
            <div style="text-align:center;margin:24px 0">
              <a href="${link}" style="display:inline-block;background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none">Payer l'acompte</a>
            </div>
            <p style="color:#6b7280;font-size:12px;text-align:center">Paiement sécurisé par Stripe.</p>
          </div>
        </div>`,
      })
    } catch (e) {
      console.error('[request-deposit email]', e)
    }
  }

  return NextResponse.json({ ok: true, token, link })
}
