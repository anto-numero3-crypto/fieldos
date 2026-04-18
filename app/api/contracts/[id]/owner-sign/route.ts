import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { Resend } from 'resend'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()
  const { id } = await params

  const body = await req.json()
  const { signature, name } = body
  if (!signature || !name) {
    return NextResponse.json({ error: 'Signature and name are required' }, { status: 400 })
  }

  const supabase = adminClient()

  // Verify org ownership
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, owner_user_id')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (!org) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  // Fetch contract
  const { data: contract, error: cErr } = await supabase
    .from('contracts')
    .select('*, customers(id, name, email)')
    .eq('id', id)
    .eq('org_id', org.id)
    .maybeSingle()

  if (cErr || !contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  }

  // Build update
  const updates: Record<string, unknown> = {
    owner_signature: signature,
    owner_signed_at: new Date().toISOString(),
    owner_signed_name: name,
  }

  // Check if client already signed — if so, fully execute
  const isFullyExecuted = !!contract.client_signed_at
  if (isFullyExecuted) {
    updates.fully_executed_at = new Date().toISOString()
    updates.status = 'fully_executed'
  }

  const { error: updateErr } = await supabase
    .from('contracts')
    .update(updates)
    .eq('id', id)

  if (updateErr) {
    console.error('[owner-sign] update failed:', updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Save owner signature to organization for reuse
  await supabase
    .from('organizations')
    .update({ owner_signature: signature })
    .eq('id', org.id)

  // Send emails
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const resend = new Resend(resendKey)
      const businessName = org.name || 'Gestivio'
      const customer = contract.customers as { name: string; email: string | null } | null

      // Notify owner of their own signature
      await resend.emails.send({
        from: `Gestivio <noreply@gestivio.ca>`,
        to: user.email!,
        subject: `Signature confirmée - ${contract.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#4f46e5;">Signature confirmée</h2>
            <p>Vous avez signé le contrat <strong>${contract.title}</strong> avec succès.</p>
            ${isFullyExecuted
              ? '<p style="color:#059669;font-weight:600;">Le contrat est maintenant entièrement signé par les deux parties.</p>'
              : '<p>En attente de la signature du client.</p>'}
            <a href="https://gestivio.ca/contrats/${id}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
              Voir le contrat
            </a>
          </div>
        `,
      })

      // If fully executed, notify both parties
      if (isFullyExecuted && customer?.email) {
        await resend.emails.send({
          from: `${businessName} <noreply@gestivio.ca>`,
          to: customer.email,
          subject: `Contrat entièrement signé - ${contract.title}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <h2 style="color:#059669;">Contrat entièrement signé</h2>
              <p>Bonjour ${customer.name},</p>
              <p>Le contrat <strong>${contract.title}</strong> a été signé par les deux parties et est maintenant entièrement exécuté.</p>
              <a href="https://gestivio.ca/contrat/${contract.approval_token}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
                Voir le contrat signé
              </a>
            </div>
          `,
        })
      }
    } catch (e) {
      console.error('[owner-sign] email failed:', e)
    }
  }

  return NextResponse.json({ ok: true })
}
