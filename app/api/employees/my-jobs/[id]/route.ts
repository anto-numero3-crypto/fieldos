import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()
  const { id } = await params

  const sb = adminClient()

  const { data: emp } = await sb
    .from('employees')
    .select('id, email')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (!emp) return NextResponse.json({ error: 'Not an employee' }, { status: 403 })

  const { data: tm } = await sb
    .from('team_members')
    .select('id')
    .eq('email', emp.email)
    .maybeSingle()

  // Check if assigned via junction table
  const { data: junctionAssign } = await sb
    .from('job_assignments')
    .select('id')
    .eq('job_id', id)
    .eq('employee_id', emp.id)
    .maybeSingle()

  // Verify the job is assigned to this employee (via either field or junction table)
  const conditions: string[] = []
  if (tm?.id) conditions.push(`assigned_to.eq.${tm.id}`)
  conditions.push(`assigned_employee_id.eq.${emp.id}`)
  if (junctionAssign) conditions.push(`id.eq.${id}`)

  const { data: job } = await sb
    .from('jobs')
    .select('id, title, description, status, scheduled_date, start_time, end_time, service_address, internal_notes, customers(name, phone, email)')
    .eq('id', id)
    .or(conditions.join(','))
    .maybeSingle()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  return NextResponse.json({ job })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()
  const { id } = await params
  const body = await req.json()

  const sb = adminClient()

  const { data: emp } = await sb
    .from('employees')
    .select('id, email')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (!emp) return NextResponse.json({ error: 'Not an employee' }, { status: 403 })

  const { data: tm } = await sb
    .from('team_members')
    .select('id')
    .eq('email', emp.email)
    .maybeSingle()

  // Check junction table
  const { data: junctionAssignPatch } = await sb
    .from('job_assignments')
    .select('id')
    .eq('job_id', id)
    .eq('employee_id', emp.id)
    .maybeSingle()

  const conditions: string[] = []
  if (tm?.id) conditions.push(`assigned_to.eq.${tm.id}`)
  conditions.push(`assigned_employee_id.eq.${emp.id}`)
  if (junctionAssignPatch) conditions.push(`id.eq.${id}`)

  // Verify ownership
  const { data: job } = await sb
    .from('jobs')
    .select('id')
    .eq('id', id)
    .or(conditions.join(','))
    .maybeSingle()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const update: Record<string, unknown> = {}
  if (body.status === 'completed') update.status = 'completed'
  if (typeof body.internal_notes === 'string') update.internal_notes = body.internal_notes

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await sb.from('jobs').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto clock-out any active time entry when job is completed
  if (body.status === 'completed') {
    const now = new Date().toISOString()
    const { data: activeEntries } = await sb
      .from('time_entries')
      .select('id, clocked_in_at')
      .eq('job_id', id)
      .is('clocked_out_at', null)
    if (activeEntries && activeEntries.length > 0) {
      for (const entry of activeEntries) {
        const durationMinutes = Math.round((Date.now() - new Date(entry.clocked_in_at).getTime()) / 60000)
        await sb.from('time_entries').update({
          clocked_out_at: now,
          duration_minutes: durationMinutes,
        }).eq('id', entry.id)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
