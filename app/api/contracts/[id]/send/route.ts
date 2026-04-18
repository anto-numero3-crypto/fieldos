import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { Resend } from 'resend'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()
  const { id } = await params

  const supabase = adminClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, owner_user_id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!org) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const { data: contract, error: cErr } = await supabase
    .from('contracts')
    .select('*, customers(id, name, email)')
    .eq('id', id)
    .eq('org_id', org.id)
    .maybeSingle()

  if (cErr || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  const customer = contract.customers as { name: string; email: string | null } | null
  if (!customer?.email) {
    return NextResponse.json({ error: 'Customer has no email address' }, { status: 400 })
  }

  // Update status to sent
  await supabase
    .from('contracts')
    .update({ status: 'sent' })
    .eq('id', id)

  // Send approval email via Resend
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const resend = new Resend(resendKey)
      const approvalLink = `https://gestivio.ca/contrat/${contract.approval_token}`
      const businessName = org.name || 'Gestivio'

      await resend.emails.send({
        from: `${businessName} <noreply@gestivio.ca>`,
        to: customer.email,
        subject: `Contrat de service - ${contract.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#4f46e5;">Contrat de service</h2>
            <p>Bonjour ${customer.name},</p>
            <p>${businessName} vous a envoy\u00e9 un contrat de service pour approbation.</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
              <tr><td style="padding:8px 0;color:#6b7280;">Contrat</td><td style="padding:8px 0;font-weight:600;">${contract.title}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;">Service</td><td style="padding:8px 0;">${contract.service_name}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;">P\u00e9riode</td><td style="padding:8px 0;">${contract.start_date} au ${contract.end_date}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;">Montant total</td><td style="padding:8px 0;font-weight:600;">${Number(contract.total_price || 0).toFixed(2)} $</td></tr>
            </table>
            <a href="${approvalLink}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
              Voir et approuver le contrat
            </a>
            <p style="margin-top:24px;color:#9ca3af;font-size:12px;">
              Si vous avez des questions, veuillez contacter ${businessName} directement.
            </p>
          </div>
        `,
      })
    } catch (e) {
      console.error('[contract send] email failed:', e)
      // Don't fail the request — status is already updated
    }
  }

  return NextResponse.json({ success: true })
}
