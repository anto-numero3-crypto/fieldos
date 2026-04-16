import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { generateICS } from '@/lib/generate-ics'
import { generateGoogleCalendarLink } from '@/lib/generate-gcal-link'

function fmtDate(d: string): string {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m || 0).padStart(2, '0')} ${ampm}`
}

function buildJobDetailsCard(job: Record<string, unknown>, customer: Record<string, unknown> | null) {
  const rows: string[] = []
  if (job.scheduled_date) rows.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:14px">📅 Date</td><td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px">${fmtDate(job.scheduled_date as string)}</td></tr>`)
  if (job.start_time) {
    const endPart = job.end_time ? ` — ${fmtTime(job.end_time as string)}` : ''
    rows.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:14px">⏰ Heure</td><td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px">${fmtTime(job.start_time as string)}${endPart}</td></tr>`)
  }
  if (job.service_address) rows.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:14px">📍 Adresse</td><td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px">${job.service_address}</td></tr>`)
  if (customer?.name) rows.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:14px">👤 Client</td><td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px">${customer.name}</td></tr>`)
  if (customer?.phone) rows.push(`<tr><td style="padding:6px 0;color:#6b7280;font-size:14px">📞 Téléphone</td><td style="padding:6px 0;font-weight:600;text-align:right;font-size:14px">${customer.phone}</td></tr>`)
  return `<div style="background:white;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:24px">
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827">${job.title || 'Intervention'}</h2>
    <table style="width:100%;border-collapse:collapse">${rows.join('')}</table>
  </div>`
}

function buildAssignmentHtml(p: {
  memberName: string
  bizName: string
  bizPhone?: string
  bizEmail?: string
  job: Record<string, unknown>
  customer: Record<string, unknown> | null
  gcalLink: string
  mapsLink: string | null
  isReschedule?: boolean
}) {
  const card = buildJobDetailsCard(p.job, p.customer)
  const notes = p.job.description ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px"><p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Notes</p><p style="margin:0;font-size:14px;color:#374151">${p.job.description}</p></div>` : ''
  const rescheduleNote = p.isReschedule
    ? `<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px;margin-bottom:20px"><p style="margin:0;font-size:14px;color:#92400e;font-weight:600">⚠️ Cette intervention a été reprogrammée. Veuillez mettre à jour votre calendrier.</p></div>`
    : ''
  const footerParts: string[] = [p.bizName]
  if (p.bizPhone) footerParts.push(p.bizPhone)
  if (p.bizEmail) footerParts.push(p.bizEmail)

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#111827">
    <div style="background:#4f46e5;padding:28px 36px;border-radius:12px 12px 0 0">
      <h1 style="color:white;margin:0 0 4px;font-size:20px;font-weight:700">${p.isReschedule ? 'Intervention reprogrammée' : 'Nouvelle intervention assignée'}</h1>
      <p style="color:#c7d2fe;margin:0;font-size:14px">${p.bizName}</p>
    </div>
    <div style="background:#f9fafb;padding:36px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
      <p style="margin:0 0 20px;font-size:16px">Bonjour ${p.memberName},</p>
      ${rescheduleNote}
      ${card}
      ${notes}
      <div style="margin-bottom:16px">
        <a href="${p.gcalLink}" target="_blank" rel="noopener" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;margin-right:8px;margin-bottom:8px">Ajouter à Google Calendar</a>
      </div>
      <p style="font-size:13px;color:#6b7280;margin-bottom:20px">📎 Ouvrez le fichier .ics joint pour l'ajouter à Apple Calendar ou Outlook.</p>
      ${p.mapsLink ? `<a href="${p.mapsLink}" target="_blank" rel="noopener" style="display:inline-block;background:white;color:#374151;border:1px solid #d1d5db;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;margin-bottom:20px">📍 Ouvrir dans Google Maps</a>` : ''}
      <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0" />
      <p style="font-size:12px;color:#9ca3af;margin:0">${footerParts.join(' · ')}</p>
    </div>
  </div>`
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
  }

  const body = await req.json().catch(() => null) as { jobId?: string; isReschedule?: boolean } | null
  if (!body?.jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })

  const supabase = adminClient()
  const { data: job } = await supabase
    .from('jobs')
    .select('*, customers(name, phone, email)')
    .eq('id', body.jobId)
    .eq('user_id', user.id)
    .single()
  if (!job || !job.assigned_to) return NextResponse.json({ error: 'Job not found or not assigned' }, { status: 404 })

  const { data: member } = await supabase
    .from('team_members')
    .select('id, name, email')
    .eq('id', job.assigned_to)
    .single()
  if (!member?.email) return NextResponse.json({ error: 'Team member not found or no email' }, { status: 404 })

  const { data: org } = await supabase
    .from('organizations')
    .select('name, phone, email')
    .eq('owner_user_id', user.id)
    .single()

  const bizName = org?.name || 'Gestivio'
  const customer = job.customers as Record<string, unknown> | null
  const address = job.service_address || undefined
  const startTime = job.start_time || '09:00'

  const gcalLink = generateGoogleCalendarLink({
    title: job.title || 'Intervention',
    scheduled_date: job.scheduled_date || new Date().toISOString().slice(0, 10),
    start_time: startTime,
    end_time: job.end_time || undefined,
    address,
    description: job.description || undefined,
    customer_name: (customer?.name as string) || undefined,
    customer_phone: (customer?.phone as string) || undefined,
  })

  const icsString = generateICS({
    uid: `job-${job.id}@gestivio.ca`,
    title: job.title || 'Intervention',
    scheduled_date: job.scheduled_date || new Date().toISOString().slice(0, 10),
    start_time: startTime,
    end_time: job.end_time || undefined,
    address,
    description: job.description || undefined,
    customer_name: (customer?.name as string) || undefined,
    customer_phone: (customer?.phone as string) || undefined,
    organizer_email: org?.email || undefined,
    organizer_name: bizName,
  })

  const mapsLink = address
    ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
    : null

  const dateLabel = job.scheduled_date ? fmtDate(job.scheduled_date) : ''
  const subject = body.isReschedule
    ? `Intervention reprogrammée: ${job.title || 'Intervention'} — ${dateLabel}`
    : `Nouvelle intervention: ${job.title || 'Intervention'} — ${dateLabel}`

  const html = buildAssignmentHtml({
    memberName: member.name || member.email,
    bizName,
    bizPhone: org?.phone || undefined,
    bizEmail: org?.email || undefined,
    job,
    customer,
    gcalLink,
    mapsLink,
    isReschedule: body.isReschedule,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data: emailResult, error: emailErr } = await resend.emails.send({
    from: `${bizName} <noreply@gestivio.ca>`,
    to: member.email,
    subject,
    html,
    attachments: [
      {
        filename: 'intervention.ics',
        content: Buffer.from(icsString).toString('base64'),
        contentType: 'text/calendar; method=REQUEST',
      },
    ],
  })

  if (emailErr) {
    console.error('[job-assigned] email failed:', emailErr)
    return NextResponse.json({ error: emailErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, emailId: emailResult?.id })
}
