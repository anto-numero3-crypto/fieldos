import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'

const LOG = '[gcal sync-job]'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) {
    console.warn(`${LOG} unauthenticated request`)
    return UNAUTHORIZED()
  }

  const body = await req.json().catch(() => null) as { jobId?: string; action?: 'upsert' | 'delete'; googleEventId?: string } | null
  if (!body || !body.action) {
    console.warn(`${LOG} missing action`, body)
    return NextResponse.json({ error: 'Missing action' }, { status: 400 })
  }
  console.log(`${LOG} incoming`, { userId: user.id, action: body.action, jobId: body.jobId })

  const supabase = adminClient()
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, timezone, google_calendar_connected, google_calendar_refresh_token')
    .eq('owner_user_id', user.id)
    .single()
  if (orgErr) {
    console.error(`${LOG} org lookup failed:`, orgErr)
    return NextResponse.json({ error: 'Organization not found', detail: orgErr.message }, { status: 404 })
  }
  if (!org) {
    console.warn(`${LOG} no organization for user ${user.id}`)
    return NextResponse.json({ ok: true, skipped: 'no_org' })
  }
  if (!org.google_calendar_connected) {
    console.log(`${LOG} org ${org.id} not connected to Google Calendar — skipping`)
    return NextResponse.json({ ok: true, skipped: 'not_connected' })
  }
  if (!org.google_calendar_refresh_token) {
    console.error(`${LOG} org ${org.id} marked connected but no refresh token — re-auth needed`)
    return NextResponse.json({ ok: false, error: 'missing_refresh_token' }, { status: 500 })
  }
  const timezone = org.timezone || 'America/Toronto'

  if (body.action === 'delete') {
    if (!body.googleEventId && !body.jobId) return NextResponse.json({ error: 'Missing job or event id' }, { status: 400 })
    let eventId = body.googleEventId
    if (!eventId && body.jobId) {
      const { data: job } = await supabase
        .from('jobs')
        .select('google_event_id, user_id')
        .eq('id', body.jobId)
        .maybeSingle()
      if (job && job.user_id === user.id) eventId = job.google_event_id || undefined
    }
    if (!eventId) {
      console.log(`${LOG} delete skipped — no event id`)
      return NextResponse.json({ ok: true, skipped: 'no_event' })
    }
    const ok = await deleteCalendarEvent(org.id, eventId)
    console.log(`${LOG} delete event ${eventId} ok=${ok}`)
    return NextResponse.json({ ok })
  }

  if (!body.jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('*, customers(name, phone, email)')
    .eq('id', body.jobId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (jobErr) {
    console.error(`${LOG} job fetch failed:`, jobErr)
    return NextResponse.json({ error: 'Job fetch failed', detail: jobErr.message }, { status: 500 })
  }
  if (!job) {
    console.warn(`${LOG} job ${body.jobId} not found for user ${user.id}`)
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
  if (!job.scheduled_date) {
    console.log(`${LOG} job ${job.id} has no scheduled_date — skipping`)
    return NextResponse.json({ ok: true, skipped: 'no_date' })
  }

  if (job.google_event_id) {
    const result = await updateCalendarEvent(org.id, job, timezone)
    if (!result.ok) {
      return NextResponse.json({ action: 'update_failed', ...result }, { status: 500 })
    }
    console.log(`${LOG} updated event ${result.eventId} for job ${job.id}`)
    return NextResponse.json({ ok: true, action: 'updated', eventId: result.eventId })
  }
  const result = await createCalendarEvent(org.id, job, timezone)
  if (!result.ok) {
    console.error(`${LOG} create failed for job ${job.id}:`, result)
    return NextResponse.json({ action: 'create_failed', ...result }, { status: 500 })
  }
  const { error: saveErr } = await supabase.from('jobs').update({ google_event_id: result.eventId }).eq('id', job.id)
  if (saveErr) {
    console.error(`${LOG} failed to save google_event_id on job ${job.id} — column missing?`, saveErr)
  } else {
    console.log(`${LOG} created event ${result.eventId} for job ${job.id}`)
  }
  return NextResponse.json({ ok: true, action: 'created', eventId: result.eventId, savedEventId: !saveErr })
}
