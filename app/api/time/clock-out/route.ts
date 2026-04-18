import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const body = await req.json()
  const entryId: string = body.entryId
  const notes: string | undefined = body.notes

  if (!entryId) return NextResponse.json({ error: 'missing entryId' }, { status: 400 })

  const sb = adminClient()

  // Find the entry and verify ownership via user_id
  const { data: entry } = await sb
    .from('time_entries')
    .select('*')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!entry) return NextResponse.json({ error: 'entry_not_found' }, { status: 404 })

  // Calculate final pause chunk if currently paused
  let totalPaused = entry.paused_duration_minutes || 0
  if (entry.status === 'paused' && entry.pause_started_at) {
    const pauseStart = new Date(entry.pause_started_at).getTime()
    totalPaused += Math.round((Date.now() - pauseStart) / 60000)
  }

  // Calculate duration minus pauses
  const clockedIn = new Date(entry.clocked_in_at).getTime()
  const now = Date.now()
  const totalMinutes = Math.round((now - clockedIn) / 60000)
  const durationMinutes = Math.max(0, totalMinutes - totalPaused)

  const updateData: Record<string, unknown> = {
    clocked_out_at: new Date().toISOString(),
    duration_minutes: durationMinutes,
    status: 'completed',
    paused_duration_minutes: totalPaused,
    pause_started_at: null,
  }
  if (notes !== undefined) updateData.notes = notes

  const { data: updated, error } = await sb
    .from('time_entries')
    .update(updateData)
    .eq('id', entryId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify org owner
  try {
    const { data: empFull } = await sb
      .from('employees')
      .select('first_name, last_name, org_id')
      .eq('user_id', user.id)
      .single()
    if (empFull?.org_id) {
      const { data: org } = await sb
        .from('organizations')
        .select('owner_user_id')
        .eq('id', empFull.org_id)
        .single()
      if (org?.owner_user_id) {
        const empName = `${empFull.first_name} ${empFull.last_name}`.trim()
        const hours = Math.floor(durationMinutes / 60)
        const mins = durationMinutes % 60
        const durationStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`
        let jobTitle = ''
        if (entry.job_id) {
          const { data: j } = await sb.from('jobs').select('title').eq('id', entry.job_id).single()
          jobTitle = j?.title || ''
        }
        await sb.from('notifications').insert({
          user_id: org.owner_user_id,
          type: 'info',
          title: `${empName} a terminé — ${durationStr}`,
          body: `${empName} a terminé${jobTitle ? ` ${jobTitle}` : ''}. Durée: ${durationStr}.`,
          link: '/feuilles-de-temps',
        })      }
    }
  } catch (_) { /* non-blocking */ }

  return NextResponse.json({ ok: true, entry: updated })
}
