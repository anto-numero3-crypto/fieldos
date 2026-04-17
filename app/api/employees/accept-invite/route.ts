import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, password } = body as { token?: string; password?: string }

  if (!token || !password) {
    return NextResponse.json({ error: 'token and password are required' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const sb = adminClient()

  // Find employee by token
  const { data: emp, error: empErr } = await sb
    .from('employees')
    .select('id, email, first_name, last_name, status, invite_expires_at')
    .eq('invite_token', token)
    .single()

  if (empErr || !emp) {
    return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 })
  }

  if (emp.status !== 'invited') {
    return NextResponse.json({ error: 'This invitation has already been used' }, { status: 400 })
  }

  if (emp.invite_expires_at && new Date(emp.invite_expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 })
  }

  // Create Supabase auth user
  const { data: authData, error: authErr } = await sb.auth.admin.createUser({
    email: emp.email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: emp.first_name,
      last_name: emp.last_name,
      role: 'employee',
    },
  })

  if (authErr) {
    console.error('[accept-invite] auth create failed:', authErr)
    return NextResponse.json({ error: authErr.message }, { status: 500 })
  }

  // Update employee record
  const { error: updateErr } = await sb
    .from('employees')
    .update({
      user_id: authData.user.id,
      status: 'active',
      invite_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', emp.id)

  if (updateErr) {
    console.error('[accept-invite] employee update failed:', updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
