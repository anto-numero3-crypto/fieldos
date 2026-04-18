import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  console.log('[invite] POST handler called')

  try {
    // Step 1: Auth
    const user = await getAuthedUser(req)
    if (!user) {
      console.log('[invite] no auth user')
      return UNAUTHORIZED()
    }
    console.log('[invite] user:', user.id)

    // Step 2: Parse body — now expects { employeeId }
    const body = await req.json()
    console.log('[invite] body:', JSON.stringify(body))
    const { employeeId } = body as { employeeId?: string }

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
    }

    // Step 3: Get org
    const sb = adminClient()
    const { data: org, error: orgErr } = await sb
      .from('organizations')
      .select('id, name')
      .eq('owner_user_id', user.id)
      .single()

    if (orgErr || !org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Step 4: Look up employee, verify they belong to this org
    const { data: employee, error: empErr } = await sb
      .from('employees')
      .select('id, email, first_name, last_name, status')
      .eq('id', employeeId)
      .eq('org_id', org.id)
      .single()

    if (empErr || !employee) {
      console.log('[invite] employee not found:', employeeId)
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }
    console.log('[invite] employee found:', employee.id, employee.email, employee.status)

    // Step 5: Generate invite token
    const inviteToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error: updateErr } = await sb
      .from('employees')
      .update({
        invite_token: inviteToken,
        invite_expires_at: expiresAt,
        status: 'invited',
        updated_at: new Date().toISOString(),
      })
      .eq('id', employeeId)

    if (updateErr) {
      console.error('[invite] update error:', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Step 6: Send email
    if (!process.env.RESEND_API_KEY) {
      console.error('[invite] RESEND_API_KEY not set')
      return NextResponse.json({ error: 'Email service not configured (RESEND_API_KEY missing)' }, { status: 503 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const inviteLink = `https://gestivio.ca/invite/${inviteToken}`
    const toAddress = employee.email

    console.log('[invite] sending email to:', toAddress)

    const emailResult = await resend.emails.send({
      from: 'Gestivio <noreply@gestivio.ca>',
      to: toAddress,
      subject: `Vous avez été invité à rejoindre ${org.name || 'une entreprise'} sur Gestivio`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827">
          <div style="background:#4f46e5;padding:28px 36px;border-radius:12px 12px 0 0">
            <h1 style="color:white;margin:0 0 4px;font-size:22px;font-weight:700">Gestivio</h1>
            <p style="color:#c7d2fe;margin:0;font-size:14px">Invitation d'équipe</p>
          </div>
          <div style="background:#f9fafb;padding:36px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
            <p style="margin:0 0 16px;font-size:16px">Bonjour ${employee.first_name},</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280">
              <strong>${org.name || 'Une entreprise'}</strong> vous a invité à rejoindre leur équipe sur Gestivio.
              Cliquez sur le bouton ci-dessous pour créer votre compte et commencer.
            </p>
            <div style="text-align:center;margin:24px 0">
              <a href="${inviteLink}" style="display:inline-block;background:#4f46e5;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
                Accepter l'invitation
              </a>
            </div>
            <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center">
              Ce lien expire dans 7 jours. Si vous n'avez pas demandé cette invitation, ignorez ce courriel.
            </p>
          </div>
        </div>
      `,
    })
    console.log('[invite] Resend response:', JSON.stringify(emailResult))

    if (emailResult.error) {
      console.error('[invite] Resend error:', JSON.stringify(emailResult.error))
      return NextResponse.json({ error: `Email failed: ${emailResult.error.message || JSON.stringify(emailResult.error)}` }, { status: 500 })
    }

    console.log('[invite] success')
    return NextResponse.json({ ok: true })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[invite] FATAL:', msg, err)
    return NextResponse.json({ error: `Invite failed: ${msg}` }, { status: 500 })
  }
}
