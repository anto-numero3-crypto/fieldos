import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { normalizePlan } from '@/lib/plan-limits'
import { isModuleEnabled } from '@/lib/modules'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const body = await req.json()
  const { firstName, lastName, email, phone, color } = body as {
    firstName?: string; lastName?: string; email?: string; phone?: string; color?: string
  }

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'firstName, lastName, and email are required' }, { status: 400 })
  }

  const sb = adminClient()

  // Get org
  const { data: org } = await sb
    .from('organizations')
    .select('id, name, plan, enabled_modules')
    .eq('owner_user_id', user.id)
    .single()

  if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

  // Check module enabled + plan
  const plan = normalizePlan(org.plan)
  if (plan === 'demarrage') {
    return NextResponse.json({ error: 'Team management requires Pro or Croissance plan' }, { status: 403 })
  }
  if (!isModuleEnabled(org.enabled_modules, org.plan, 'team_management')) {
    return NextResponse.json({ error: 'Team management module is not enabled' }, { status: 403 })
  }

  // Check employee limit (Pro = 5, Croissance = unlimited)
  if (plan === 'pro') {
    const { count } = await sb
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .neq('status', 'inactive')
    if ((count || 0) >= 5) {
      return NextResponse.json({ error: 'Employee limit reached (5 for Pro plan)' }, { status: 403 })
    }
  }

  // Check duplicate email in org
  const { data: existing } = await sb
    .from('employees')
    .select('id, status')
    .eq('org_id', org.id)
    .eq('email', email.toLowerCase().trim())
    .neq('status', 'inactive')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An employee with this email already exists in your organization' }, { status: 409 })
  }

  // Generate invite token
  const inviteToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: employee, error } = await sb
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

  if (error) {
    console.error('[employee invite] insert failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send invite email
  const inviteLink = `https://gestivio.ca/invite/${inviteToken}`
  try {
    await resend.emails.send({
      from: 'Gestivio <noreply@gestivio.ca>',
      to: email.toLowerCase().trim(),
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
  } catch (emailErr) {
    console.error('[employee invite] email failed:', emailErr)
    // Don't fail the request — the employee was created, owner can resend
  }

  return NextResponse.json({ ok: true, employee })
}
