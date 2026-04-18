import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const { id } = await params
  const sb = adminClient()

  // Verify ownership
  const { data: org } = await sb
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .single()
  if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

  // Verify employee belongs to org
  const { data: emp } = await sb
    .from('employees')
    .select('id')
    .eq('id', id)
    .eq('org_id', org.id)
    .single()
  if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const { data: jobs, error } = await sb
    .from('jobs')
    .select('id, title, status, scheduled_date, start_time, end_time, is_multi_day, end_date, created_at, customers(name)')
    .eq('assigned_employee_id', id)
    .order('scheduled_date', { ascending: false })

  if (error) {
    console.error('[employee jobs]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ jobs: jobs || [] })
}
