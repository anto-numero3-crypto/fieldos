import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase-server'
import { getPlanLimits, normalizePlan } from '@/lib/plan-limits'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI is not configured.' }, { status: 503 })
  }

  try {
    const { message, history = [], orgSlug } = await req.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }
    if (!orgSlug || typeof orgSlug !== 'string') {
      return NextResponse.json({ error: 'Missing orgSlug' }, { status: 400 })
    }

    const supabase = adminClient()

    // 1. Look up org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, owner_user_id, service_types, ai_agent_name, ai_agent_greeting, plan, ai_messages_this_month, ai_messages_reset_at')
      .eq('slug', orgSlug)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // 2. Check AI message limit
    const normalizedPlan = normalizePlan(org.plan)
    const planLimits = getPlanLimits(normalizedPlan)
    const AI_LIMIT = planLimits.maxAIMessages

    let currentCount = org.ai_messages_this_month || 0
    const resetAt = org.ai_messages_reset_at ? new Date(org.ai_messages_reset_at) : null
    const nowTs = new Date()
    if (!resetAt || nowTs.getTime() - resetAt.getTime() > 30 * 24 * 60 * 60 * 1000) {
      currentCount = 0
      await supabase.from('organizations').update({
        ai_messages_this_month: 0,
        ai_messages_reset_at: nowTs.toISOString(),
      }).eq('id', org.id)
    }

    if (AI_LIMIT !== Infinity && currentCount >= AI_LIMIT) {
      return NextResponse.json({
        error: 'ai_limit_reached',
        message: 'Le nombre de messages IA mensuels a été atteint.',
      })
    }

    // 3. Look up availability schedule
    const { data: schedule } = await supabase
      .from('availability_schedule')
      .select('*')
      .eq('user_id', org.owner_user_id)

    let availabilityDescription = 'No specific availability set.'
    if (schedule && schedule.length > 0) {
      const lines = schedule
        .filter((s: { is_available: boolean }) => s.is_available)
        .map((s: { day_of_week: number; start_time: string; end_time: string }) =>
          `${DAY_NAMES[s.day_of_week]}: ${s.start_time} - ${s.end_time}`
        )
      availabilityDescription = lines.length > 0
        ? lines.join('\n')
        : 'The business has no available slots currently.'
    }

    // 4. Look up services for richer context
    const { data: services } = await supabase
      .from('services')
      .select('name, description, base_price, duration_minutes, pricing_type')
      .eq('user_id', org.owner_user_id)
      .eq('is_active', true)
      .order('name')

    const serviceTypes = org.service_types || []
    const serviceList = services && services.length > 0
      ? services.map((s: { name: string; description: string | null; base_price: number; duration_minutes: number; pricing_type: string }) => {
          let line = `- ${s.name}`
          if (s.description) line += ` — ${s.description}`
          if (s.duration_minutes) line += ` (${s.duration_minutes} min)`
          if (s.pricing_type === 'fixed' && s.base_price) line += ` — $${s.base_price}`
          else if (s.pricing_type === 'quote_required') line += ' — Sur devis / Quote required'
          return line
        }).join('\n')
      : serviceTypes.map((s: string) => '- ' + s).join('\n')

    const agentName = org.ai_agent_name || 'Alex'
    const orgName = org.name

    // 5. Build system prompt
    const systemPrompt = `You are ${agentName}, the AI booking assistant for ${orgName}.

Services offered by this business:
${serviceList || '- General service'}

Business availability:
${availabilityDescription}

Today's date: ${new Date().toLocaleDateString('fr-CA')}

Your job:
1. Greet the client warmly
2. Understand what service they need
3. Match to available services
4. Suggest available time slots based on the schedule
5. Collect: name, email, phone, address
6. Show a clear booking summary
7. Ask for confirmation

Always respond in the SAME LANGUAGE as the client (French or English).
Be friendly, professional, and concise. Keep responses under 150 words.

When the client confirms the booking (says oui, yes, confirm, etc.), output this exact format on its own line:
BOOKING_CONFIRMED: {"service":"...","date":"YYYY-MM-DD","time":"HH:MM","customer_name":"...","customer_email":"...","customer_phone":"...","customer_address":"...","notes":"..."}

Do NOT output BOOKING_CONFIRMED until you have ALL required fields (name, email, phone, date, time, service) AND the client has explicitly confirmed.`

    // 6. Call Anthropic
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const safeHistory = Array.isArray(history)
      ? history.filter((m: { role: string; content: string }) =>
          (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
        ).map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
      : []

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [...safeHistory, { role: 'user' as const, content: message }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const reply = textBlock ? textBlock.text : ''

    // 7. Increment message count
    await supabase.from('organizations').update({
      ai_messages_this_month: currentCount + 1,
    }).eq('id', org.id)

    // 8. Check for booking confirmation
    let bookingCreated = false
    let booking: { id: string; service: string; date: string; time: string } | undefined

    const confirmMatch = reply.match(/BOOKING_CONFIRMED:\s*(\{[\s\S]*?\})/)
    if (confirmMatch) {
      try {
        const bookingData = JSON.parse(confirmMatch[1])

        const { data: inserted, error: insertError } = await supabase
          .from('booking_requests')
          .insert({
            org_id: org.id,
            customer_name: bookingData.customer_name || '',
            customer_email: bookingData.customer_email || '',
            customer_phone: bookingData.customer_phone || '',
            customer_address: bookingData.customer_address || '',
            service_name: bookingData.service || '',
            requested_date: bookingData.date || '',
            requested_time: bookingData.time || '',
            notes: bookingData.notes || '',
            status: 'pending',
            source: 'ai_chat',
          })
          .select('id')
          .single()

        if (!insertError && inserted) {
          bookingCreated = true
          booking = {
            id: inserted.id,
            service: bookingData.service,
            date: bookingData.date,
            time: bookingData.time,
          }

          // 9. Send notification emails (fire-and-forget)
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000'

          // Notify owner
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', org.owner_user_id)
            .single()

          if (ownerProfile?.email) {
            fetch(`${baseUrl}/api/email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'booking_new_request',
                to: ownerProfile.email,
                customerName: bookingData.customer_name,
                serviceName: bookingData.service,
                bookingDate: bookingData.date,
                bookingTime: bookingData.time,
                businessName: orgName,
              }),
            }).catch(() => { /* ignore email errors */ })
          }

          // Notify customer
          if (bookingData.customer_email) {
            fetch(`${baseUrl}/api/email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'booking_pending',
                to: bookingData.customer_email,
                customerName: bookingData.customer_name,
                serviceName: bookingData.service,
                bookingDate: bookingData.date,
                bookingTime: bookingData.time,
                businessName: orgName,
              }),
            }).catch(() => { /* ignore email errors */ })
          }
        }
      } catch {
        // JSON parse failed — ignore, just return the reply
      }
    }

    // Clean the BOOKING_CONFIRMED line from the visible reply
    const cleanReply = reply.replace(/BOOKING_CONFIRMED:\s*\{[\s\S]*?\}/, '').trim()

    return NextResponse.json({
      reply: cleanReply,
      bookingCreated,
      booking,
    })
  } catch (err) {
    console.error('[booking/ai-chat] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
