import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser } from '@/lib/supabase-server'

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

// GET: lookup by token (public — customer-facing cancel/confirm link) OR by id for authed owner
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = adminClient()
  const isUUID = /^[0-9a-f-]{36}$/i.test(id)

  if (isUUID) {
    // UUID → require auth + ownership
    const user = await getAuthedUser(req)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const { data, error } = await supabase
      .from('booking_requests').select('*').eq('id', id).eq('user_id', user.id).single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ booking: data })
  }

  // Token lookup (public — needs to work for customer cancel link)
  const { data, error } = await supabase
    .from('booking_requests').select('*').eq('token', id).single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ booking: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { action, reason } = body
  if (!action) return NextResponse.json({ error: 'Missing action' }, { status: 400 })

  const supabase = adminClient()
  const isUUID = /^[0-9a-f-]{36}$/i.test(id)

  // Fetch booking
  const q = supabase.from('booking_requests').select('*')
  const { data: booking } = isUUID
    ? await q.eq('id', id).single()
    : await q.eq('token', id).single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  // Auth: owner actions require auth+ownership; customer-cancel via token is allowed only for 'cancel'
  const user = await getAuthedUser(req)
  const isOwner = !!user && user.id === booking.user_id
  const isCustomerCancelByToken = !isUUID && action === 'cancel'

  if (!isOwner && !isCustomerCancelByToken) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Only the owner can confirm/decline/complete
  if ((action === 'confirm' || action === 'decline' || action === 'complete') && !isOwner) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

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
  let debug: Record<string, unknown> = {}

  if (action === 'confirm') {
    update = { status: 'confirmed', confirmed_at: new Date().toISOString(), confirmed_by: user!.id }

    // STEP 1: Find or create customer (by email, scoped to owner)
    let customerId: string | null = booking.customer_id || null
    if (!customerId && booking.customer_email) {
      const { data: existing, error: findErr } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', booking.user_id)
        .eq('email', booking.customer_email)
        .maybeSingle()
      if (findErr) {
        console.error('[booking confirm] customer find failed:', findErr)
        debug = { ...debug, customerFindError: findErr.message }
      }
      if (existing) {
        customerId = existing.id
      } else {
        const { data: created, error: custErr } = await supabase
          .from('customers')
          .insert({
            user_id: booking.user_id,
            name: booking.customer_name,
            email: booking.customer_email,
            phone: booking.customer_phone || null,
            address: booking.customer_address || null,
            source: 'booking_portal',
          })
          .select('id')
          .single()
        if (custErr) {
          console.error('[booking confirm] customer create failed:', custErr)
          debug = { ...debug, customerCreateError: custErr.message, customerCreateDetails: custErr.details }
        }
        customerId = created?.id || null
      }
    }

    // STEP 2: Create job (always, if we have a customer)
    let jobAssignee: string | null = body.assignedTo || null
    if (!booking.converted_to_job_id && customerId) {
      const endTime = booking.requested_end_time || booking.requested_time
      const { data: job, error: jobErr } = await supabase
        .from('jobs')
        .insert({
          user_id: booking.user_id,
          customer_id: customerId,
          title: `${booking.service_name} — ${booking.customer_name}`,
          description: booking.notes || null,
          status: 'scheduled',
          scheduled_date: booking.requested_date,
          start_time: booking.requested_time,
          end_time: endTime,
          service_address: booking.customer_address || null,
          source: 'booking',
          booking_id: booking.id,
          assigned_to: jobAssignee,
        })
        .select('id')
        .single()
      if (jobErr) {
        console.error('[booking confirm] job create failed:', jobErr)
        debug = { ...debug, jobCreateError: jobErr.message, jobCreateDetails: jobErr.details }
      }
      if (job) {
        update.converted_to_job_id = job.id
        // Email assigned team member
        if (jobAssignee) {
          const { data: member } = await supabase
            .from('team_members')
            .select('name, email')
            .eq('id', jobAssignee)
            .single()
          if (member?.email) {
            await sendEmail({
              type: 'job_assigned',
              to: member.email,
              memberName: member.name,
              serviceName: booking.service_name,
              customerName: booking.customer_name,
              customerPhone: booking.customer_phone || undefined,
              address: booking.customer_address || undefined,
              bookingDate: dateFormatted,
              bookingTime: timeFormatted,
              notes: booking.notes || undefined,
              jobLink: `https://gestivio.ca/jobs/${job.id}`,
            })
          }
        }
      }
    }

    // STEP 3: booking update (customer_id + converted_to_job_id)
    if (customerId && !booking.customer_id) update.customer_id = customerId

    // STEP 4: confirmation email
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

    // STEP 5: in-app notification
    try {
      await supabase.from('notifications').insert({
        user_id: booking.user_id,
        type: 'booking_confirmed',
        title: 'Réservation confirmée',
        body: `${booking.customer_name} — ${dateFormatted} à ${timeFormatted}`,
        link: '/schedule/bookings',
        read: false,
      })
    } catch (e) {
      console.error('[booking confirm] notification insert failed:', e)
    }
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
    if (isOwner) {
      await sendEmail({
        type: 'booking_cancelled',
        to: booking.customer_email,
        customerName: booking.customer_name,
        businessName: org?.name || 'Gestivio Business',
        serviceName: booking.service_name,
        bookingDate: dateFormatted,
        bookingTime: timeFormatted,
      })
    } else if (org?.email) {
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
    .eq('id', booking.id)

  if (error) return NextResponse.json({ error: 'Update failed', debug }, { status: 500 })
  return NextResponse.json({ success: true, debug })
}
