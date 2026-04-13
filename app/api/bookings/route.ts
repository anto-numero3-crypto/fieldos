import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const from   = searchParams.get('from')
  const to     = searchParams.get('to')

  const supabase = adminClient()
  let query = supabase
    .from('booking_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('requested_date', { ascending: false })
    .order('requested_time', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (from) query = query.gte('requested_date', from)
  if (to)   query = query.lte('requested_date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  return NextResponse.json({ bookings: data || [] })
}
