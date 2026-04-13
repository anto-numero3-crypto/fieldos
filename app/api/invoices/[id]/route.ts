import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()
  const { id } = await params

  const supabase = adminClient()

  // Try full nested select first; fall back if PostgREST can't resolve jobs
  let { data, error } = await supabase
    .from('invoices')
    .select('*, customers(id, name, email, phone, address), jobs(id, title)')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    const retry = await supabase
      .from('invoices')
      .select('*, customers(id, name, email, phone, address)')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    data = retry.data
    error = retry.error
  }

  if (error) {
    console.error('[invoice detail] fetch failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ invoice: data })
}
