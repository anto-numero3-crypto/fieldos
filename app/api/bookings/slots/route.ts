import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET /api/bookings/slots?orgSlug=...&date=YYYY-MM-DD&duration=60
// Returns array of available time slot strings ("09:00", "10:00", ...)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const orgSlug  = searchParams.get('orgSlug')
  const date     = searchParams.get('date')
  const duration = parseInt(searchParams.get('duration') || '60', 10)

  if (!orgSlug || !date) {
    return NextResponse.json({ error: 'Missing orgSlug or date' }, { status: 400 })
  }

  const supabase = anonClient()

  // 1. Resolve org → user_id
  const { data: org } = await supabase
    .from('organizations')
    .select('owner_user_id, id')
    .eq('slug', orgSlug)
    .single()

  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  const userId = String(org.owner_user_id)

  // 2. Get availability settings (for buffer and notice)
  const { data: settings } = await supabase
    .from('availability_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  const buffer = settings?.buffer_minutes ?? 15
  const noticeHours = settings?.minimum_notice_hours ?? 24

  // 3. Check for date override
  const { data: override } = await supabase
    .from('availability_overrides')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  // If override says unavailable, return empty
  if (override && !override.is_available) {
    return NextResponse.json({ slots: [] })
  }

  // 4. Get weekly schedule for this day
  const dayOfWeek = new Date(date + 'T12:00:00').getDay() // avoid timezone edge
  const { data: daySchedule } = await supabase
    .from('availability_schedule')
    .select('*')
    .eq('user_id', userId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle()

  // Determine business hours
  let startTime: string
  let endTime: string

  if (override && override.is_available && override.start_time) {
    startTime = override.start_time
    endTime   = override.end_time
  } else if (daySchedule?.is_available) {
    startTime = daySchedule.start_time
    endTime   = daySchedule.end_time
  } else {
    return NextResponse.json({ slots: [] }) // day off
  }

  // 5. Get existing bookings for that date (confirmed or pending)
  const { data: existingBookings } = await supabase
    .from('booking_requests')
    .select('requested_time, requested_end_time, duration_minutes, status')
    .eq('user_id', userId)
    .eq('requested_date', date)
    .in('status', ['pending', 'confirmed'])

  // 6. Generate slots
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const toTimeStr = (mins: number) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0')
    const m = (mins % 60).toString().padStart(2, '0')
    return `${h}:${m}`
  }

  const startMins = toMinutes(startTime)
  const endMins   = toMinutes(endTime)

  // Earliest bookable time (now + noticeHours)
  const now      = new Date()
  const today    = now.toISOString().slice(0, 10)
  const nowMins  = now.getHours() * 60 + now.getMinutes()
  const minStart = date === today ? nowMins + noticeHours * 60 : 0

  const slots: string[] = []
  let cursor = startMins

  while (cursor + duration <= endMins) {
    if (cursor >= minStart) {
      const slotEnd = cursor + duration

      // Check if this slot overlaps with any existing booking (incl. buffer)
      const hasConflict = (existingBookings || []).some((b) => {
        const bStart = toMinutes(b.requested_time)
        const bDur   = b.duration_minutes || duration
        const bEnd   = bStart + bDur + buffer
        return cursor < bEnd && slotEnd > bStart
      })

      if (!hasConflict) {
        slots.push(toTimeStr(cursor))
      }
    }
    cursor += duration + buffer
  }

  return NextResponse.json({ slots })
}
