import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function sendEmail(payload: Record<string, unknown>) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://gestivio.ca'}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.error('Email send error:', e)
  }
}

// GET /api/bookings/[id] — fetch a single booking (by id or token)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = adminClient()

  // Try by id first, then by token
  let query = supabase.from('booking_requests').select('*')
  const isUUID = /^[0-9a-f-]{36}$/i.test(id)
  query = isUUID
    ? query.or(`id.eq.${id},token.eq.${id}`)
    : query.eq('token', id)

  const { data, error } = await query.single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ booking: data })
}

// PATCH /api/bookings/[id] — confirm, decline, cancel, complete
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { action, reason, userId } = body

  if (!action) return NextResponse.json({ error: 'Missing action' }, { status: 400 })

  const supabase = adminClient()

  // Fetch the booking
  const { data: booking } = await supabase
    .from('booking_requests')
    .select('*')
    .or(`id.eq.${id},token.eq.${id}`)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  // Fetch org for email
  const { data: org } = await supabase
    .from('organizations')
    .select('name, email, owner_user_id')
    .eq('id', booking.org_id)
    .single()

  const dateFormatted = new Date(booking.requested_date + 'T12:00:00').toLocaleDateString('fr-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const [hh, mm] = String(booking.requested_time).split(':').map(Number)
  const timeFormatted = `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`

  let update: Record<string, unknown> = {}

  if (action === 'confirm') {
    update = { status: 'confirmed', confirmed_at: new Date().toISOString(), confirmed_by: userId || 'owner' }

    // Create job if not already created
    if (!booking.converted_to_job_id && booking.customer_id) {
      const endTime = booking.requested_end_time || booking.requested_time
      const { data: job } = await supabase
        .from('jobs')
        .insert({
          user_id: booking.user_id,
          customer_id: booking.customer_id,
          title: `${booking.service_name} — ${booking.customer_name}`,
          description: booking.notes || null,
          status: 'scheduled',
          scheduled_date: booking.requested_date,
          start_time: booking.requested_time,
          end_time: endTime,
          service_address: booking.customer_address || null,
          source: 'booking',
        })
        .select('id')
        .single()

      if (job) update.converted_to_job_id = job.id
    }

    // Email customer
    await sendEmail({
      type: 'booking_confirmed',
      to: booking.customer_email,
      customerName: booking.customer_name,
      businessName: org?.name || 'Gestivio Business',
      serviceName: booking.service_name,
      bookingDate: dateFormatted,
      bookingTime: timeFormatted,
      servicePrice: booking.service_price ? `CA$${parseFloat(booking.service_price).toFixed(2)}` : undefined,
      cancelLink: `https://gestivio.ca/booking/cancel/${booking.token}`,
    })

  } else if (action === 'decline') {
    update = { status: 'declined', declined_at: new Date().toISOString(), decline_reason: reason || null }

    await sendEmail({
      type: 'booking_declined',
      to: booking.customer_email,
      customerName: booking.customer_name,
      businessName: org?.name || 'Gestivio Business',
      serviceName: booking.service_name,
      bookingDate: dateFormatted,
      bookingTime: timeFormatted,
      declineReason: reason || undefined,
    })

  } else if (action === 'cancel') {
    update = { status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: reason || null }

    // Email customer if cancellation is by business
    if (userId) {
      await sendEmail({
        type: 'booking_cancelled',
        to: booking.customer_email,
        customerName: booking.customer_name,
        businessName: org?.name || 'Gestivio Business',
        serviceName: booking.service_name,
        bookingDate: dateFormatted,
        bookingTime: timeFormatted,
      })
    }

    // Notify owner if cancellation is by customer (no userId)
    if (!userId && org?.email) {
      await sendEmail({
        type: 'booking_cancelled_owner',
        to: org.email,
        customerName: org.name || 'Owner',
        businessName: org.name,
        bookerName: booking.customer_name,
        serviceName: booking.service_name,
        bookingDate: dateFormatted,
        bookingTime: timeFormatted,
        cancelReason: reason || undefined,
      })
    }

  } else if (action === 'complete') {
    update = { status: 'completed' }
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const { error } = await supabase
    .from('booking_requests')
    .update({ ...update, updated_at: new Date().toISOString() })
    .or(`id.eq.${id},token.eq.${id}`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
