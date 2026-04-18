import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

// Public endpoint — no auth required. Validated via approval_token.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { token, name } = body

  if (!token || !name) {
    return NextResponse.json({ error: 'Token and name are required' }, { status: 400 })
  }

  const supabase = adminClient()

  // Validate token matches the contract
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*, customers(id, name, email), organizations:org_id(id, name, owner_user_id)')
    .eq('id', id)
    .eq('approval_token', token)
    .maybeSingle()

  if (error || !contract) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
  }

  if (contract.status === 'approved' || contract.status === 'active') {
    return NextResponse.json({ error: 'Contract already approved' }, { status: 400 })
  }

  if (contract.status === 'cancelled' || contract.status === 'expired') {
    return NextResponse.json({ error: 'Contract is no longer valid' }, { status: 400 })
  }

  // Update contract
  const { error: updateErr } = await supabase
    .from('contracts')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by_name: name,
    })
    .eq('id', id)

  if (updateErr) {
    console.error('[contract approve] update failed:', updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Send confirmation emails
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const resend = new Resend(resendKey)
      const org = contract.organizations as { name: string | null; owner_user_id: string } | null
      const customer = contract.customers as { name: string; email: string | null } | null
      const businessName = org?.name || 'Gestivio'

      // Notify owner
      if (org?.owner_user_id) {
        const { data: ownerAuth } = await supabase.auth.admin.getUserById(org.owner_user_id)
        if (ownerAuth?.user?.email) {
          await resend.emails.send({
            from: `Gestivio <noreply@gestivio.ca>`,
            to: ownerAuth.user.email,
            subject: `Contrat approuv\u00e9 - ${contract.title}`,
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <h2 style="color:#059669;">Contrat approuv\u00e9!</h2>
                <p>Le contrat <strong>${contract.title}</strong> a \u00e9t\u00e9 approuv\u00e9 par <strong>${name}</strong>.</p>
                <p>Vous pouvez maintenant g\u00e9n\u00e9rer les interventions r\u00e9currentes depuis votre tableau de bord.</p>
                <a href="https://gestivio.ca/contrats/${id}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
                  Voir le contrat
                </a>
              </div>
            `,
          })
        }
      }

      // Confirm to customer
      if (customer?.email) {
        await resend.emails.send({
          from: `${businessName} <noreply@gestivio.ca>`,
          to: customer.email,
          subject: `Confirmation - ${contract.title}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <h2 style="color:#059669;">Contrat confirm\u00e9</h2>
              <p>Bonjour ${customer.name},</p>
              <p>Votre contrat <strong>${contract.title}</strong> a bien \u00e9t\u00e9 approuv\u00e9. Merci!</p>
              <p>${businessName} vous contactera pour planifier les interventions.</p>
            </div>
          `,
        })
      }
    } catch (e) {
      console.error('[contract approve] email failed:', e)
    }
  }

  return NextResponse.json({ success: true })
}
