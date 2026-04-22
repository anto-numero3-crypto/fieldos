import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

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

// POST /api/bookings/public — create a booking from public booking page
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { key: 'booking-public', limit: 15, windowMs: 60 * 60 * 1000 })
  if (limited) return limited
  const body = await req.json()
  const {
    orgSlug,
    serviceId,
    serviceName,
    servicePrice,
    serviceDuration,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    date,
    time,
    notes,
  } = body

  if (!orgSlug || !customerName || !customerEmail || !date || !time || !serviceName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = adminClient()

  // Resolve org
  const { data: org } = await supabase
    .from('organizations')
    .select('id, owner_user_id, name, email')
    .eq('slug', orgSlug)
    .single()

  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const userId = String(org.owner_user_id)

  // Get availability settings (auto_accept)
  const { data: avSettings } = await supabase
    .from('availability_settings')
    .select('auto_accept, confirmation_message, slot_duration_minutes')
    .eq('user_id', userId)
    .single()

  const autoAccept = avSettings?.auto_accept ?? false
  const duration   = serviceDuration || avSettings?.slot_duration_minutes || 60

  // Calculate end time
  const [h, m]   = time.split(':').map(Number)
  const endMins  = h * 60 + m + duration
  const endTime  = `${Math.floor(endMins / 60).toString().padStart(2, '0')}:${(endMins % 60).toString().padStart(2, '0')}`

  // Match or create customer record
  let customerId: string | null = null
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', userId)
    .eq('email', customerEmail)
    .maybeSingle()

  if (existingCustomer) {
    customerId = existingCustomer.id
  } else if (customerName && customerEmail) {
    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({
        user_id: userId,
        name: customerName,
        email: customerEmail,
        phone: customerPhone || null,
        address: customerAddress || null,
        source: 'booking_page',
      })
      .select('id')
      .single()
    customerId = newCustomer?.id || null
  }

  // Insert booking
  const { data: booking, error: bookingError } = await supabase
    .from('booking_requests')
    .insert({
      user_id: userId,
      org_id: org.id,
      service_id: serviceId || null,
      customer_id: customerId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null,
      customer_address: customerAddress || null,
      service_name: serviceName,
      service_price: servicePrice || null,
      requested_date: date,
      requested_time: time,
      requested_end_time: endTime,
      duration_minutes: duration,
      notes: notes || null,
      status: autoAccept ? 'confirmed' : 'pending',
      auto_accepted: autoAccept,
      confirmed_at: autoAccept ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (bookingError || !booking) {
    console.error('Booking insert error:', bookingError)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }

  // If auto-accepted, create a job linked back to this booking
  if (autoAccept && customerId) {
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .insert({
        user_id: userId,
        customer_id: customerId,
        title: serviceName,
        description: notes || null,
        status: 'scheduled',
        scheduled_date: date,
        start_time: time,
        end_time: endTime,
        service_address: customerAddress || null,
        source: 'booking',
        booking_id: booking.id,
      })
      .select('id')
      .single()

    if (jobErr) console.error('[public booking] job create failed:', jobErr)
    if (job) {
      await supabase
        .from('booking_requests')
        .update({ converted_to_job_id: job.id })
        .eq('id', booking.id)
    }
  }

  // Format date for emails
  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('fr-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const [hh, mm] = time.split(':').map(Number)
  const timeFormatted = `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`
  const cancelLink = `https://gestivio.ca/booking/cancel/${booking.token}`

  // Email customer
  await sendEmail({
    type: autoAccept ? 'booking_confirmed' : 'booking_pending',
    to: customerEmail,
    customerName,
    businessName: org.name,
    serviceName,
    bookingDate: dateFormatted,
    bookingTime: timeFormatted,
    servicePrice: servicePrice ? `CA$${parseFloat(servicePrice).toFixed(2)}` : undefined,
    cancelLink,
    confirmationMessage: avSettings?.confirmation_message || undefined,
    bookingToken: booking.token,
  })

  // Notify business owner
  if (org.email) {
    await sendEmail({
      type: 'booking_new_request',
      to: org.email,
      customerName: org.name || 'Business Owner',
      businessName: org.name,
      bookerName: customerName,
      bookerEmail: customerEmail,
      bookerPhone: customerPhone || undefined,
      serviceName,
      bookingDate: dateFormatted,
      bookingTime: timeFormatted,
      bookingNotes: notes || undefined,
      manageLink: 'https://gestivio.ca/schedule/bookings',
      autoAccepted: autoAccept,
    })
  }

  // Create in-app notification for owner
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'info',
      title: `Nouvelle réservation de ${customerName}`,
      body: `${serviceName} · ${dateFormatted} à ${timeFormatted}`,
      link: '/schedule/bookings',
      read: false,
    })
  } catch {
    // Non-critical — ignore notification errors
  }

  return NextResponse.json({
    success: true,
    booking: {
      id: booking.id,
      token: booking.token,
      status: booking.status,
    },
  })
}
