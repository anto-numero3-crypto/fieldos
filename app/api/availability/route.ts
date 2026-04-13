import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const supabase = adminClient()
  const [settingsRes, scheduleRes, overridesRes] = await Promise.all([
    supabase.from('availability_settings').select('*').eq('user_id', user.id).single(),
    supabase.from('availability_schedule').select('*').eq('user_id', user.id).order('day_of_week'),
    supabase.from('availability_overrides').select('*').eq('user_id', user.id)
      .gte('date', new Date().toISOString().slice(0, 10)).order('date'),
  ])

  return NextResponse.json({
    settings: settingsRes.data,
    schedule: scheduleRes.data || [],
    overrides: overridesRes.data || [],
  })
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const body = await req.json()
  const { settings, schedule, overrides } = body
  const supabase = adminClient()

  if (settings) {
    await supabase.from('availability_settings').upsert(
      { ...settings, user_id: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  if (schedule && schedule.length > 0) {
    await supabase.from('availability_schedule').upsert(
      schedule.map((s: Record<string, unknown>) => ({ ...s, user_id: user.id })),
      { onConflict: 'user_id,day_of_week' }
    )
  }

  if (overrides && overrides.length > 0) {
    await supabase.from('availability_overrides').upsert(
      overrides.map((o: Record<string, unknown>) => ({ ...o, user_id: user.id })),
      { onConflict: 'user_id,date' }
    )
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })

  const supabase = adminClient()
  await supabase.from('availability_overrides').delete().eq('user_id', user.id).eq('date', date)
  return NextResponse.json({ success: true })
}
