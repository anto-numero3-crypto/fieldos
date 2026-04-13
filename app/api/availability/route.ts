import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

// Schema uses `availability_schedule` with (user_id, day_of_week, is_available, start_time, end_time).
// Only those fields are safe to upsert — anything else will fail the INSERT.
const SCHEDULE_COLS = ['day_of_week', 'is_available', 'start_time', 'end_time'] as const
const OVERRIDE_COLS = ['date', 'is_available', 'start_time', 'end_time', 'reason'] as const
const SETTINGS_COLS = [
  'timezone', 'auto_accept', 'advance_booking_days', 'minimum_notice_hours',
  'slot_duration_minutes', 'buffer_minutes', 'booking_page_title',
  'booking_page_description', 'booking_page_color', 'confirmation_message',
  'cancellation_policy',
] as const

function pick<T extends Record<string, unknown>>(obj: T, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of keys) if (k in obj) out[k] = obj[k]
  return out
}

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const supabase = adminClient()
  const [settingsRes, scheduleRes, overridesRes] = await Promise.all([
    supabase.from('availability_settings').select('*').eq('user_id', user.id).maybeSingle(),
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
  const debug: Record<string, unknown> = {}

  if (settings && typeof settings === 'object') {
    const row = { ...pick(settings, SETTINGS_COLS), user_id: user.id, updated_at: new Date().toISOString() }
    const { error } = await supabase
      .from('availability_settings')
      .upsert(row, { onConflict: 'user_id' })
    if (error) {
      console.error('[availability] settings upsert failed:', error)
      debug.settingsError = error.message
    }
  }

  if (Array.isArray(schedule) && schedule.length > 0) {
    const rows = schedule.map((s: Record<string, unknown>) => ({
      ...pick(s, SCHEDULE_COLS),
      user_id: user.id,
    }))
    const { error } = await supabase
      .from('availability_schedule')
      .upsert(rows, { onConflict: 'user_id,day_of_week' })
    if (error) {
      console.error('[availability] schedule upsert failed:', error)
      debug.scheduleError = error.message
    }
  }

  if (Array.isArray(overrides) && overrides.length > 0) {
    const rows = overrides.map((o: Record<string, unknown>) => ({
      ...pick(o, OVERRIDE_COLS),
      user_id: user.id,
    }))
    const { error } = await supabase
      .from('availability_overrides')
      .upsert(rows, { onConflict: 'user_id,date' })
    if (error) {
      console.error('[availability] overrides upsert failed:', error)
      debug.overridesError = error.message
    }
  }

  const hasError = Object.keys(debug).length > 0
  return NextResponse.json({ success: !hasError, debug }, { status: hasError ? 500 : 200 })
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
