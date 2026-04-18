import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const sb = adminClient()

  const { data: emp, error } = await sb
    .from('employees')
    .select('*, organizations(id, name, plan, enabled_modules)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (error || !emp) {
    return NextResponse.json({ error: 'Not an employee' }, { status: 404 })
  }

  return NextResponse.json({ employee: emp })
}
