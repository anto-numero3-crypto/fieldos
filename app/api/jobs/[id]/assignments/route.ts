import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()
  const { id } = await params

  const sb = adminClient()

  // Verify job ownership
  const { data: job } = await sb
    .from('jobs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: assignments, error } = await sb
    .from('job_assignments')
    .select('id, employee_id, assigned_at, employees(id, first_name, last_name, color)')
    .eq('job_id', id)

  if (error) {
    console.error('[job-assignments] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const mapped = (assignments || []).map((a) => {
    const emp = a.employees as unknown as { id: string; first_name: string; last_name: string; color: string } | null
    return {
      id: a.id,
      employee_id: a.employee_id,
      first_name: emp?.first_name || '',
      last_name: emp?.last_name || '',
      color: emp?.color || '#6366f1',
      assigned_at: a.assigned_at,
    }
  })

  return NextResponse.json({ assignments: mapped })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()
  const { id } = await params

  const body = await req.json().catch(() => null) as { employee_ids?: string[] } | null
  if (!body || !Array.isArray(body.employee_ids)) {
    return NextResponse.json({ error: 'employee_ids array required' }, { status: 400 })
  }

  const sb = adminClient()

  // Verify job ownership
  const { data: job } = await sb
    .from('jobs')
    .select('id, title, assigned_to')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get existing assignments to determine who is newly added
  const { data: existingAssignments } = await sb
    .from('job_assignments')
    .select('employee_id')
    .eq('job_id', id)
  const existingIds = new Set((existingAssignments || []).map((a) => a.employee_id))

  // Delete all existing assignments
  const { error: delErr } = await sb
    .from('job_assignments')
    .delete()
    .eq('job_id', id)
  if (delErr) {
    console.error('[job-assignments] delete error:', delErr)
    return NextResponse.json({ error: delErr.message }, { status: 500 })
  }

  // Insert new assignments
  if (body.employee_ids.length > 0) {
    const rows = body.employee_ids.map((eid) => ({
      job_id: id,
      employee_id: eid,
      assigned_by: user.id,
    }))
    const { error: insErr } = await sb.from('job_assignments').insert(rows)
    if (insErr) {
      console.error('[job-assignments] insert error:', insErr)
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }
  }

  // Backward compat: set assigned_to to first employee's team_member if available
  if (body.employee_ids.length > 0) {
    const { data: firstEmp } = await sb
      .from('employees')
      .select('email')
      .eq('id', body.employee_ids[0])
      .maybeSingle()
    if (firstEmp?.email) {
      const { data: tm } = await sb
        .from('team_members')
        .select('id')
        .eq('email', firstEmp.email)
        .maybeSingle()
      if (tm) {
        await sb.from('jobs').update({ assigned_to: tm.id }).eq('id', id)
      }
    }
  } else {
    // No employees assigned — clear assigned_to
    await sb.from('jobs').update({ assigned_to: null }).eq('id', id)
  }

  // In-app notifications for newly assigned employees
  const newlyAdded = body.employee_ids.filter((eid) => !existingIds.has(eid))
  if (newlyAdded.length > 0) {
    try {
      // Fetch job details for the notification
      const { data: jobDetails } = await sb
        .from('jobs')
        .select('title, scheduled_date')
        .eq('id', id)
        .single()
      const jobTitle = jobDetails?.title || job.title || 'une intervention'
      const dateStr = jobDetails?.scheduled_date
        ? new Date(jobDetails.scheduled_date + 'T12:00:00').toLocaleDateString('fr-CA')
        : ''

      for (const empId of newlyAdded) {
        const { data: emp } = await sb
          .from('employees')
          .select('user_id')
          .eq('id', empId)
          .maybeSingle()
        if (emp?.user_id) {
          await sb.from('notifications').insert({
            user_id: emp.user_id,
            type: 'info',
            title: 'Nouvelle intervention assignée',
            body: `Vous avez été assigné à ${jobTitle}${dateStr ? ` le ${dateStr}` : ''}.`,
            link: `/employee/jobs/${id}`,
          })        }
      }
    } catch (_) { /* non-blocking */ }
  }

  // Return updated assignments
  const { data: final } = await sb
    .from('job_assignments')
    .select('id, employee_id, assigned_at, employees(id, first_name, last_name, color)')
    .eq('job_id', id)

  const mapped = (final || []).map((a) => {
    const emp = a.employees as unknown as { id: string; first_name: string; last_name: string; color: string } | null
    return {
      id: a.id,
      employee_id: a.employee_id,
      first_name: emp?.first_name || '',
      last_name: emp?.last_name || '',
      color: emp?.color || '#6366f1',
      assigned_at: a.assigned_at,
    }
  })

  return NextResponse.json({ ok: true, assignments: mapped })
}
