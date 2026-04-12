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
    console.error('Custom-request email failed:', e)
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    orgSlug,
    description,
    preferredDate,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    serviceName, // optional — pre-filled from a quote_required service
    attachments,
  } = body

  if (!orgSlug || !description || !customerName || !customerEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = adminClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, owner_user_id, name, email')
    .eq('slug', orgSlug)
    .single()

  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const userId = String(org.owner_user_id)

  // Match or create customer
  let customerId: string | null = null
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', userId)
    .eq('email', customerEmail)
    .maybeSingle()
  if (existing) {
    customerId = existing.id
  } else {
    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({
        user_id: userId,
        name: customerName,
        email: customerEmail,
        phone: customerPhone || null,
        address: customerAddress || null,
        source: 'custom_request',
      })
      .select('id')
      .single()
    customerId = newCustomer?.id || null
  }

  const { data: booking, error: bookingError } = await supabase
    .from('booking_requests')
    .insert({
      user_id: userId,
      org_id: org.id,
      customer_id: customerId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || null,
      customer_address: customerAddress || null,
      service_name: serviceName || null,
      request_description: description,
      preferred_date: preferredDate || null,
      attachments: attachments || null,
      status: 'custom_request',
    })
    .select()
    .single()

  if (bookingError || !booking) {
    console.error('[custom-request] insert failed:', bookingError)
    return NextResponse.json({ error: 'Failed to save request' }, { status: 500 })
  }

  // Email customer confirmation
  await sendEmail({
    type: 'custom_request_received',
    to: customerEmail,
    customerName,
    businessName: org.name,
    description,
    bookingToken: booking.token,
  })

  // Notify business owner
  if (org.email) {
    await sendEmail({
      type: 'custom_request_new',
      to: org.email,
      customerName: org.name || 'Business Owner',
      businessName: org.name,
      bookerName: customerName,
      bookerEmail: customerEmail,
      bookerPhone: customerPhone || undefined,
      description,
      preferredDate: preferredDate || undefined,
      serviceName: serviceName || undefined,
      manageLink: 'https://gestivio.ca/schedule/bookings',
    })
  }

  // In-app notification
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'info',
      title: `Demande personnalisée de ${customerName}`,
      body: description.slice(0, 140),
      link: '/schedule/bookings',
      read: false,
    })
  } catch { /* ignore */ }

  return NextResponse.json({
    success: true,
    booking: { id: booking.id, token: booking.token, status: booking.status },
  })
}
