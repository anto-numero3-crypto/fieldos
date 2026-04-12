import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET /api/bookings?userId=...&status=...&from=...&to=...
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const userId = searchParams.get('userId')
  const status = searchParams.get('status')
  const from   = searchParams.get('from')
  const to     = searchParams.get('to')

  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const supabase = adminClient()
  let query = supabase
    .from('booking_requests')
    .select('*')
    .eq('user_id', userId)
    .order('requested_date', { ascending: false })
    .order('requested_time', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (from) query = query.gte('requested_date', from)
  if (to)   query = query.lte('requested_date', to)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bookings: data || [] })
}
