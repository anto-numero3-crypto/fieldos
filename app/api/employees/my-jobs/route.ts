import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const sb = adminClient()

  // Find the employee record for this user
  const { data: emp } = await sb
    .from('employees')
    .select('id, email, org_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!emp) return NextResponse.json({ todayJobs: [], upcomingJobs: [] })

  // Also find the matching team_member by email (jobs use assigned_to = team_members.id)
  const { data: tm } = await sb
    .from('team_members')
    .select('id')
    .eq('email', emp.email)
    .maybeSingle()

  const today = new Date().toLocaleDateString('en-CA')
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA')
  const jobSelect = 'id, title, description, status, scheduled_date, start_time, end_time, service_address, customers(name, phone)'

  // Get jobs via junction table
  const { data: assignmentJobs } = await sb
    .from('job_assignments')
    .select('job_id')
    .eq('employee_id', emp.id)
  const assignmentJobIds = (assignmentJobs || []).map((a) => a.job_id)

  // Build OR filter: assigned_to = team_member_id OR assigned_employee_id = employee_id OR id IN assignmentJobIds
  const conditions: string[] = []
  if (tm?.id) conditions.push(`assigned_to.eq.${tm.id}`)
  conditions.push(`assigned_employee_id.eq.${emp.id}`)
  if (assignmentJobIds.length > 0) conditions.push(`id.in.(${assignmentJobIds.join(',')})`)
  const orFilter = conditions.join(',')

  const { data: todayData } = await sb
    .from('jobs')
    .select(jobSelect)
    .or(orFilter)
    .eq('scheduled_date', today)
    .order('start_time', { ascending: true })

  const { data: upData } = await sb
    .from('jobs')
    .select(jobSelect)
    .or(orFilter)
    .gt('scheduled_date', today)
    .lte('scheduled_date', nextWeek)
    .order('scheduled_date', { ascending: true })

  return NextResponse.json({
    todayJobs: todayData || [],
    upcomingJobs: upData || [],
  })
}
