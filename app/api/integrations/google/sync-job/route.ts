import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const body = await req.json().catch(() => null) as { jobId?: string; action?: 'upsert' | 'delete'; googleEventId?: string } | null
  if (!body || !body.action) return NextResponse.json({ error: 'Missing action' }, { status: 400 })

  const supabase = adminClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('id, timezone, google_calendar_connected')
    .eq('owner_user_id', user.id)
    .single()
  if (!org || !org.google_calendar_connected) {
    return NextResponse.json({ ok: true, skipped: 'not_connected' })
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
    if (!eventId) return NextResponse.json({ ok: true, skipped: 'no_event' })
    await deleteCalendarEvent(org.id, eventId)
    return NextResponse.json({ ok: true })
  }

  if (!body.jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('*, customers(name, phone, email)')
    .eq('id', body.jobId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (jobErr || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  if (job.google_event_id) {
    await updateCalendarEvent(org.id, job, timezone)
    return NextResponse.json({ ok: true, action: 'updated', eventId: job.google_event_id })
  }
  const eventId = await createCalendarEvent(org.id, job, timezone)
  if (eventId) {
    await supabase.from('jobs').update({ google_event_id: eventId }).eq('id', job.id)
  }
  return NextResponse.json({ ok: true, action: 'created', eventId })
}
