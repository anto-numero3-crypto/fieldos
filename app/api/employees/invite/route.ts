import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { normalizePlan } from '@/lib/plan-limits'
import { isModuleEnabled } from '@/lib/modules'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  console.log('[invite] POST handler called')

  try {
    // Step 1: Auth
    console.log('[invite] step 1: authenticating')
    const user = await getAuthedUser(req)
    if (!user) {
      console.log('[invite] step 1 FAILED: no auth user')
      return UNAUTHORIZED()
    }
    console.log('[invite] step 1 OK: user =', user.id)

    // Step 2: Parse body
    console.log('[invite] step 2: parsing body')
    const body = await req.json()
    console.log('[invite] step 2 OK: body =', JSON.stringify(body))
    const { firstName, lastName, email, phone, color } = body as {
      firstName?: string; lastName?: string; email?: string; phone?: string; color?: string
    }

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      console.log('[invite] step 2 FAILED: missing required fields')
      return NextResponse.json({ error: 'firstName, lastName, and email are required' }, { status: 400 })
    }

    // Step 3: Get org
    console.log('[invite] step 3: fetching org')
    const sb = adminClient()
    const { data: org, error: orgErr } = await sb
      .from('organizations')
      .select('id, name, plan, enabled_modules')
      .eq('owner_user_id', user.id)
      .single()

    if (orgErr || !org) {
      console.log('[invite] step 3 FAILED: no org found', orgErr)
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }
    console.log('[invite] step 3 OK: org =', org.id, 'plan =', org.plan, 'modules =', JSON.stringify(org.enabled_modules))

    // Step 4: Check plan + module
    console.log('[invite] step 4: checking plan and module')
    const plan = normalizePlan(org.plan)
    if (plan === 'demarrage') {
      console.log('[invite] step 4 FAILED: plan is demarrage')
      return NextResponse.json({ error: 'Team management requires Pro or Croissance plan' }, { status: 403 })
    }
    if (!isModuleEnabled(org.enabled_modules, org.plan, 'team_management')) {
      console.log('[invite] step 4 FAILED: team_management module not enabled')
      return NextResponse.json({ error: 'Team management module is not enabled. Go to Settings → Modules to enable it.' }, { status: 403 })
    }
    console.log('[invite] step 4 OK')

    // Step 5: Check employee limit
    console.log('[invite] step 5: checking employee limit')
    if (plan === 'pro') {
      const { count } = await sb
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', org.id)
        .neq('status', 'inactive')
      console.log('[invite] current employee count:', count)
      if ((count || 0) >= 5) {
        console.log('[invite] step 5 FAILED: limit reached')
        return NextResponse.json({ error: 'Employee limit reached (5 for Pro plan)' }, { status: 403 })
      }
    }
    console.log('[invite] step 5 OK')

    // Step 6: Check duplicate
    console.log('[invite] step 6: checking duplicate email')
    const { data: existing } = await sb
      .from('employees')
      .select('id, status')
      .eq('org_id', org.id)
      .eq('email', email.toLowerCase().trim())
      .neq('status', 'inactive')
      .maybeSingle()
    if (existing) {
      console.log('[invite] step 6 FAILED: duplicate email, existing id =', existing.id)
      return NextResponse.json({ error: 'An employee with this email already exists in your organization' }, { status: 409 })
    }
    console.log('[invite] step 6 OK')

    // Step 7: Insert employee
    console.log('[invite] step 7: inserting employee')
    const inviteToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: employee, error: insertErr } = await sb
      .from('employees')
      .insert({
        org_id: org.id,
        email: email.toLowerCase().trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone?.trim() || null,
        color: color || '#6366f1',
        invite_token: inviteToken,
        invite_expires_at: expiresAt,
        status: 'invited',
        role: 'employee',
      })
      .select('id, email, status')
      .single()
    if (insertErr || !employee) {
      console.error('[invite] step 7 FAILED:', insertErr)
      return NextResponse.json({ error: insertErr?.message || 'Insert failed' }, { status: 500 })
    }
    console.log('[invite] step 7 OK: employee =', employee.id)

    // Step 8: Send email
    console.log('[invite] step 8: sending email')
    if (!process.env.RESEND_API_KEY) {
      console.error('[invite] step 8 FAILED: RESEND_API_KEY not set')
      return NextResponse.json({ error: 'Email service not configured (RESEND_API_KEY missing)', employee }, { status: 503 })
    }
    const resend = new Resend(process.env.RESEND_API_KEY)
    const inviteLink = `https://gestivio.ca/invite/${inviteToken}`
    const toAddress = email.toLowerCase().trim()
    console.log('[invite] step 8: to =', toAddress, 'link =', inviteLink)

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
            <p style="margin:0 0 16px;font-size:16px">Bonjour ${firstName},</p>
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
    console.log('[invite] step 8 Resend response:', JSON.stringify(emailResult))

    if (emailResult.error) {
      console.error('[invite] step 8 FAILED: Resend error:', JSON.stringify(emailResult.error))
      return NextResponse.json({ error: `Email failed: ${emailResult.error.message || JSON.stringify(emailResult.error)}`, employee }, { status: 500 })
    }
    console.log('[invite] step 8 OK: email sent')

    // Step 9: Done
    console.log('[invite] step 9: all done, returning success')
    return NextResponse.json({ ok: true, employee })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[invite] FATAL ERROR:', msg, err)
    return NextResponse.json({ error: `Invite failed: ${msg}` }, { status: 500 })
  }
}
