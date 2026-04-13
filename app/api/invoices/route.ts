import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

// Owner-scoped invoice list using service role (bypasses RLS).
// Session auth is still required via getAuthedUser.
//
// Defensive: tries the full nested select first. If PostgREST can't resolve
// one of the embedded relationships (e.g. the jobs FK hasn't been declared),
// falls back to a plain select so the page always renders.
export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const supabase = adminClient()

  // Attempt 1: full join
  let { data, error } = await supabase
    .from('invoices')
    .select('*, customers(id, name, email), jobs(id, title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[invoices list] nested select failed, retrying without jobs join:', error.message)
    const retry = await supabase
      .from('invoices')
      .select('*, customers(id, name, email)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    data = retry.data
    error = retry.error
  }

  if (error) {
    console.error('[invoices list] customers-only select failed, retrying bare:', error.message)
    const retry = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    data = retry.data
    error = retry.error
  }

  if (error) {
    console.error('[invoices list] fetch failed:', error)
    return NextResponse.json({ error: error.message, invoices: [] }, { status: 500 })
  }

  return NextResponse.json({ invoices: data || [] })
}
