import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { createCalendarEvent } from '@/lib/google-calendar'

const LOG = '[gcal backfill]'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const supabase = adminClient()
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, timezone, google_calendar_connected')
    .eq('owner_user_id', user.id)
    .single()
  if (orgErr || !org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  if (!org.google_calendar_connected) {
    return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
  }
  const timezone = org.timezone || 'America/Toronto'

  const { data: jobs, error: jobsErr } = await supabase
    .from('jobs')
    .select('*, customers(name, phone, email)')
    .eq('user_id', user.id)
    .not('scheduled_date', 'is', null)
    .is('google_event_id', null)
    .neq('status', 'cancelled')

  if (jobsErr) {
    console.error(`${LOG} jobs fetch failed:`, jobsErr)
    return NextResponse.json({ error: 'Jobs fetch failed', detail: jobsErr.message }, { status: 500 })
  }

  const candidates = jobs || []
  console.log(`${LOG} found ${candidates.length} candidate jobs for user ${user.id}`)

  let synced = 0
  let failed = 0
  const errors: Array<{ jobId: string; reason: string; status?: number; message?: string }> = []

  for (const job of candidates) {
    const result = await createCalendarEvent(org.id, job, timezone)
    if (!result.ok) {
      failed++
      errors.push({ jobId: job.id, reason: result.reason, status: result.status, message: result.message })
      continue
    }
    const { error: saveErr } = await supabase.from('jobs').update({ google_event_id: result.eventId }).eq('id', job.id)
    if (saveErr) {
      console.error(`${LOG} saved event ${result.eventId} but failed to write google_event_id on job ${job.id}:`, saveErr)
      errors.push({ jobId: job.id, reason: 'save_failed', message: saveErr.message })
    }
    synced++
  }

  console.log(`${LOG} done — synced=${synced} failed=${failed}`)
  return NextResponse.json({ ok: true, candidates: candidates.length, synced, failed, errors })
}
