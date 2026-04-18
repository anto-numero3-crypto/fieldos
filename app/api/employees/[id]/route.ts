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

  const { data: org } = await sb
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .single()
  if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

  const { data: emp, error } = await sb
    .from('employees')
    .select('*')
    .eq('id', id)
    .eq('org_id', org.id)
    .single()

  if (error || !emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  return NextResponse.json({ employee: emp })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const { id } = await params
  const body = await req.json()
  const sb = adminClient()

  // Verify ownership
  const { data: org } = await sb
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .single()
  if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

  const { data: emp } = await sb
    .from('employees')
    .select('id')
    .eq('id', id)
    .eq('org_id', org.id)
    .single()
  if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const allowed = ['first_name', 'last_name', 'phone', 'color', 'status'] as const
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await sb
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[employee update]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, employee: data })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const { id } = await params
  const sb = adminClient()

  const { data: org } = await sb
    .from('organizations')
    .select('id')
    .eq('owner_user_id', user.id)
    .single()
  if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

  // Check if employee has any assigned jobs
  const { count: jobCount } = await sb
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_employee_id', id)

  if ((jobCount || 0) > 0) {
    return NextResponse.json(
      { error: 'employee_has_jobs', count: jobCount },
      { status: 400 }
    )
  }

  const { error } = await sb
    .from('employees')
    .delete()
    .eq('id', id)
    .eq('org_id', org.id)

  if (error) {
    console.error('[employee delete]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
