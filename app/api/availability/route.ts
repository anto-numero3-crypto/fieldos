import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET /api/availability?userId=...
// Returns settings + weekly schedule + upcoming overrides for a user
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const supabase = adminClient()

  const [settingsRes, scheduleRes, overridesRes] = await Promise.all([
    supabase.from('availability_settings').select('*').eq('user_id', userId).single(),
    supabase.from('availability_schedule').select('*').eq('user_id', userId).order('day_of_week'),
    supabase.from('availability_overrides').select('*').eq('user_id', userId)
      .gte('date', new Date().toISOString().slice(0, 10)).order('date'),
  ])

  return NextResponse.json({
    settings: settingsRes.data,
    schedule: scheduleRes.data || [],
    overrides: overridesRes.data || [],
  })
}

// POST /api/availability — save settings, schedule, and overrides
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, settings, schedule, overrides } = body
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const supabase = adminClient()

  // Upsert settings
  if (settings) {
    await supabase.from('availability_settings').upsert(
      { ...settings, user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  // Upsert weekly schedule rows
  if (schedule && schedule.length > 0) {
    await supabase.from('availability_schedule').upsert(
      schedule.map((s: Record<string, unknown>) => ({ ...s, user_id: userId })),
      { onConflict: 'user_id,day_of_week' }
    )
  }

  // Upsert overrides (only included ones)
  if (overrides && overrides.length > 0) {
    await supabase.from('availability_overrides').upsert(
      overrides.map((o: Record<string, unknown>) => ({ ...o, user_id: userId })),
      { onConflict: 'user_id,date' }
    )
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/availability?userId=...&date=YYYY-MM-DD — remove a date override
export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const date = req.nextUrl.searchParams.get('date')
  if (!userId || !date) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = adminClient()
  await supabase.from('availability_overrides').delete().eq('user_id', userId).eq('date', date)

  return NextResponse.json({ success: true })
}
