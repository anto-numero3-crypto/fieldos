import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { token, name, email, signature, confirmed } = body

  if (!token || !name || !email || !signature) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  if (confirmed !== true) {
    return NextResponse.json({ error: 'You must confirm you have read the contract' }, { status: 400 })
  }

  const supabase = adminClient()

  // Validate token matches contract
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*, customers(id, name, email), organizations:org_id(id, name, owner_user_id)')
    .eq('id', id)
    .eq('approval_token', token)
    .maybeSingle()

  if (error || !contract) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
  }

  if (!['sent', 'client_signed'].includes(contract.status)) {
    return NextResponse.json({ error: 'Contract cannot be signed in its current state' }, { status: 400 })
  }

  // Get client IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'

  // Build update
  const updates: Record<string, unknown> = {
    client_signature: signature,
    client_signed_at: new Date().toISOString(),
    client_signed_name: name,
    client_signed_ip: ip,
    status: 'client_signed',
  }

  // Check if owner already signed — if so, fully execute
  const isFullyExecuted = !!contract.owner_signed_at
  if (isFullyExecuted) {
    updates.fully_executed_at = new Date().toISOString()
    updates.status = 'fully_executed'
  }

  const { error: updateErr } = await supabase
    .from('contracts')
    .update(updates)
    .eq('id', id)

  if (updateErr) {
    console.error('[client-sign] update failed:', updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Send emails
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const resend = new Resend(resendKey)
      const org = contract.organizations as { name: string | null; owner_user_id: string } | null
      const businessName = org?.name || 'Gestivio'

      // Notify owner that client signed
      if (org?.owner_user_id) {
        const { data: ownerAuth } = await supabase.auth.admin.getUserById(org.owner_user_id)
        if (ownerAuth?.user?.email) {
          await resend.emails.send({
            from: `Gestivio <noreply@gestivio.ca>`,
            to: ownerAuth.user.email,
            subject: `${name} a signé le contrat - ${contract.title}`,
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <h2 style="color:#4f46e5;">${name} a signé le contrat</h2>
                <p>Le client <strong>${name}</strong> a signé le contrat <strong>${contract.title}</strong>.</p>
                ${isFullyExecuted
                  ? '<p style="color:#059669;font-weight:600;">Le contrat est maintenant entièrement signé par les deux parties.</p>'
                  : '<p>Vous pouvez maintenant signer le contrat de votre côté.</p>'}
                <a href="https://gestivio.ca/contrats/${id}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
                  Voir le contrat
                </a>
              </div>
            `,
          })
        }
      }

      // Confirm to client
      await resend.emails.send({
        from: `${businessName} <noreply@gestivio.ca>`,
        to: email,
        subject: `Votre contrat signé — ${businessName}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#059669;">Contrat signé</h2>
            <p>Bonjour ${name},</p>
            <p>Votre signature sur le contrat <strong>${contract.title}</strong> a bien été enregistrée.</p>
            ${isFullyExecuted
              ? '<p style="font-weight:600;">Le contrat est maintenant entièrement exécuté.</p>'
              : `<p>En attente de la signature de ${businessName}.</p>`}
            <a href="https://gestivio.ca/contrat/${contract.approval_token}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
              Voir le contrat signé
            </a>
          </div>
        `,
      })

      // If fully executed, send additional notification to both
      if (isFullyExecuted) {
        const fullyExecutedHtml = `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#059669;">Contrat entièrement exécuté</h2>
            <p>Le contrat <strong>${contract.title}</strong> a été signé par les deux parties et est maintenant entièrement exécuté.</p>
            <a href="https://gestivio.ca/contrat/${contract.approval_token}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
              Voir le contrat
            </a>
          </div>
        `

        // To owner
        if (org?.owner_user_id) {
          const { data: ownerAuth } = await supabase.auth.admin.getUserById(org.owner_user_id)
          if (ownerAuth?.user?.email) {
            await resend.emails.send({
              from: `Gestivio <noreply@gestivio.ca>`,
              to: ownerAuth.user.email,
              subject: `Contrat entièrement exécuté - ${contract.title}`,
              html: fullyExecutedHtml,
            })
          }
        }

        // To client
        await resend.emails.send({
          from: `${businessName} <noreply@gestivio.ca>`,
          to: email,
          subject: `Contrat entièrement exécuté - ${contract.title}`,
          html: fullyExecutedHtml,
        })
      }
    } catch (e) {
      console.error('[client-sign] email failed:', e)
    }
  }

  // In-app notification to owner
  try {
    const org = contract.organizations as { owner_user_id: string } | null
    if (org?.owner_user_id) {
      await supabase.from('notifications').insert({
        user_id: org.owner_user_id,
        type: 'success',
        title: `Contrat signé — ${contract.title}`,
        body: `${name} a signé votre contrat.`,
        link: `/contrats/${id}`,
      })
    }
  } catch (_) { /* non-blocking */ }

  return NextResponse.json({ ok: true })
}
