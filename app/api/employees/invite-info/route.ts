import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  const sb = adminClient()

  const { data: emp, error } = await sb
    .from('employees')
    .select('first_name, last_name, email, status, invite_expires_at, organizations(name)')
    .eq('invite_token', token)
    .single()

  if (error || !emp) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  if (emp.status !== 'invited') {
    return NextResponse.json({ error: 'Already accepted' }, { status: 400 })
  }

  if (emp.invite_expires_at && new Date(emp.invite_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Expired' }, { status: 410 })
  }

  const org = emp.organizations as unknown as { name: string } | null

  return NextResponse.json({
    first_name: emp.first_name,
    last_name: emp.last_name,
    email: emp.email,
    org_name: org?.name || 'Gestivio',
  })
}
