import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendPlanEmail } from '@/lib/plan-emails'

// Daily cron — expires trials past their deadline + sends the 3-day-warning
// email to trials expiring in 3 days.
//
// Protected by CRON_SECRET. Vercel's internal cron sends
// Authorization: Bearer $CRON_SECRET automatically when configured in
// vercel.json.

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // disabled locally
  const header = req.headers.get('authorization') || ''
  return header === `Bearer ${secret}`
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = adminClient()
  const now = new Date()

  // ── 1. Expire trials whose deadline has passed ─────────────────────
  const { data: expired } = await supabase
    .from('organizations')
    .select('id, owner_user_id, email, name')
    .eq('plan_status', 'trial')
    .lt('trial_ends_at', now.toISOString())

  let expiredCount = 0
  for (const org of expired || []) {
    await supabase
      .from('organizations')
      .update({ plan: 'starter', plan_status: 'expired' })
      .eq('id', org.id)
    if (org.email) {
      await sendPlanEmail('trial_expired', { to: org.email, name: org.name || undefined })
    }
    expiredCount++
  }

  // ── 2. Send 3-day-warning to trials ending in 3 days ──────────────
  const threeDaysFrom = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const threeDaysFromStart = new Date(threeDaysFrom); threeDaysFromStart.setUTCHours(0, 0, 0, 0)
  const threeDaysFromEnd   = new Date(threeDaysFrom); threeDaysFromEnd.setUTCHours(23, 59, 59, 999)

  const { data: warnings } = await supabase
    .from('organizations')
    .select('id, email, name, trial_ends_at')
    .eq('plan_status', 'trial')
    .gte('trial_ends_at', threeDaysFromStart.toISOString())
    .lte('trial_ends_at', threeDaysFromEnd.toISOString())

  let warningCount = 0
  for (const org of warnings || []) {
    if (org.email) {
      await sendPlanEmail('trial_ending_3d', { to: org.email, name: org.name || undefined, daysLeft: 3 })
      warningCount++
    }
  }

  // ── 3. Expire promo-code plans whose promo_expires_at has passed ───
  const { data: promoExpired } = await supabase
    .from('organizations')
    .select('id, owner_user_id, email, name')
    .eq('plan_status', 'active')
    .not('promo_code_id', 'is', null)
    .lt('promo_expires_at', now.toISOString())

  let promoExpiredCount = 0
  for (const org of promoExpired || []) {
    await supabase
      .from('organizations')
      .update({ plan: 'starter', plan_status: 'expired', promo_code_id: null, promo_expires_at: null })
      .eq('id', org.id)
    if (org.email) {
      // Reuse trial_expired template — copy is equivalent for "your access ended".
      await sendPlanEmail('trial_expired', { to: org.email, name: org.name || undefined })
    }
    promoExpiredCount++
  }

  // ── 3.5 Mark overdue invoices ─────────────────────────────────
  const nowIso = now.toISOString()
  const { data: overdueRows } = await supabase
    .from('invoices')
    .update({ status: 'overdue' })
    .in('status', ['unpaid', 'sent'])
    .lt('due_date', nowIso)
    .is('paid_at', null)
    .select('id')
  const overdueCount = overdueRows?.length || 0

  // ── 4. Send 24h reminder for assigned jobs tomorrow ────────────
  let reminderCount = 0
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend')
    const { generateICS } = await import('@/lib/generate-ics')
    const { generateGoogleCalendarLink } = await import('@/lib/generate-gcal-link')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const tomorrowStr = tomorrow.toISOString().slice(0, 10)

    const { data: remJobs } = await supabase
      .from('jobs')
      .select('*, customers(name, phone, email)')
      .eq('scheduled_date', tomorrowStr)
      .not('assigned_to', 'is', null)
      .not('status', 'in', '("cancelled","completed")')
      .or('assignment_reminder_sent.is.null,assignment_reminder_sent.eq.false')

    for (const job of remJobs || []) {
      const { data: member } = await supabase.from('team_members').select('name, email').eq('id', job.assigned_to).single()
      if (!member?.email) continue
      const { data: org } = await supabase.from('organizations').select('name, phone, email').eq('owner_user_id', job.user_id).single()
      const bizName = org?.name || 'Gestivio'
      const customer = job.customers as Record<string, string> | null
      const address = job.service_address || undefined
      const startTime = job.start_time || '09:00'
      const fDate = new Date(job.scheduled_date + 'T00:00:00').toLocaleDateString('fr-CA', { weekday: 'long', month: 'long', day: 'numeric' })
      const fTime = (() => { const [h, m] = startTime.split(':').map(Number); return `${h % 12 || 12}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}` })()

      const gcalLink = generateGoogleCalendarLink({
        title: job.title || 'Intervention',
        scheduled_date: job.scheduled_date,
        start_time: startTime,
        end_time: job.end_time || undefined,
        address,
        customer_name: customer?.name || undefined,
        customer_phone: customer?.phone || undefined,
      })

      const icsString = generateICS({
        uid: `job-${job.id}@gestivio.ca`,
        title: job.title || 'Intervention',
        scheduled_date: job.scheduled_date,
        start_time: startTime,
        end_time: job.end_time || undefined,
        address,
        customer_name: customer?.name || undefined,
        customer_phone: customer?.phone || undefined,
        organizer_email: org?.email || undefined,
        organizer_name: bizName,
      })

      const mapsLink = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : ''
      const rows: string[] = []
      rows.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:14px">📅 Date</td><td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px">${fDate}</td></tr>`)
      if (job.start_time) rows.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:14px">⏰ Heure</td><td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px">${fTime}</td></tr>`)
      if (address) rows.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:14px">📍 Adresse</td><td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px">${address}</td></tr>`)
      if (customer?.name) rows.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:14px">👤 Client</td><td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px">${customer.name}</td></tr>`)

      const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#111827">
        <div style="background:#f59e0b;padding:28px 36px;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0 0 4px;font-size:20px;font-weight:700">Rappel: Intervention demain</h1>
          <p style="color:#fef3c7;margin:0;font-size:14px">${bizName}</p>
        </div>
        <div style="background:#f9fafb;padding:36px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
          <p style="margin:0 0 20px;font-size:16px">Bonjour ${member.name || member.email},</p>
          <p style="margin:0 0 20px;font-size:14px;color:#374151">Votre intervention est prévue pour demain.</p>
          <div style="background:white;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:24px">
            <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827">${job.title || 'Intervention'}</h2>
            <table style="width:100%;border-collapse:collapse">${rows.join('')}</table>
          </div>
          <div style="margin-bottom:16px">
            <a href="${gcalLink}" target="_blank" rel="noopener" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;margin-right:8px;margin-bottom:8px">Voir dans Google Calendar</a>
            ${mapsLink ? `<a href="${mapsLink}" target="_blank" rel="noopener" style="display:inline-block;background:white;color:#374151;border:1px solid #d1d5db;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">📍 Google Maps</a>` : ''}
          </div>
          <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0" />
          <p style="font-size:12px;color:#9ca3af;margin:0">${bizName}</p>
        </div>
      </div>`

      try {
        await resend.emails.send({
          from: `${bizName} <noreply@gestivio.ca>`,
          to: member.email,
          subject: `Rappel: Intervention demain — ${job.title || 'Intervention'} à ${fTime}`,
          html,
          attachments: [{
            filename: 'intervention.ics',
            content: Buffer.from(icsString).toString('base64'),
            contentType: 'text/calendar; method=REQUEST',
          }],
        })
        await supabase.from('jobs').update({ assignment_reminder_sent: true }).eq('id', job.id)
        reminderCount++
      } catch (err) {
        console.error(`[cron] reminder email failed for job ${job.id}:`, err)
      }
    }
  }

  return NextResponse.json({ expiredCount, warningCount, promoExpiredCount, reminderCount, overdueCount })
}
