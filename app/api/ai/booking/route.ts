import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const TODAY = new Date().toISOString().split('T')[0]

const SYSTEM = (businessName: string, agentName: string) => `
You are ${agentName}, a friendly and professional AI booking assistant for ${businessName}, a field service company.

Your job is to help customers book a service appointment through a natural conversation.

CONVERSATION FLOW:
1. Greet warmly and ask what service they need
2. Understand their problem/need clearly
3. Ask for their preferred date (give suggestions like "this week" or "next week")
4. Ask for a preferred time window (morning 8-12, afternoon 12-5, evening 5-8)
5. Collect: full name, email address, phone number (optional), service address
6. Confirm the booking details and thank them

RULES:
- Be warm, conversational, and professional — not robotic
- Ask ONE question at a time
- If the customer asks about prices, say rates vary by job and a technician will provide a quote on-site
- If asked about availability, say you have openings this week and next week
- Today's date is ${TODAY}
- When you have collected all required info (name, email, service type, date), output a JSON block at the END of your message in this exact format (nothing else after it):

BOOKING_DATA:{"serviceType":"<service>","scheduledDate":"<YYYY-MM-DD>","scheduledTime":"<time window>","customerName":"<name>","customerEmail":"<email>","customerPhone":"<phone or empty>","customerAddress":"<address or empty>"}

Only output BOOKING_DATA when you have ALL required fields AND the customer has confirmed. Before that, keep collecting info conversationally.

IMPORTANT: Keep responses SHORT (2-4 sentences max). Sound human. Use the customer's name once you know it.
`.trim()

interface BookingHistory { role: 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: "I'm having trouble connecting right now. Please call us directly.", bookingData: null }, { status: 200 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const { message, businessName, agentName, history = [], bookingData } = await req.json()

  const contextMsg = bookingData && Object.keys(bookingData).length > 0
    ? `[Current booking context: ${JSON.stringify(bookingData)}]\n\n${message}`
    : message

  const messages = [
    ...(history as BookingHistory[]).map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user' as const, content: contextMsg },
  ]

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM(businessName || 'our company', agentName || 'Alex'),
      messages,
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract BOOKING_DATA if present
    const dataMatch = raw.match(/BOOKING_DATA:(\{[^}]*\})/)
    let newBookingData = null
    let reply = raw

    if (dataMatch) {
      try {
        newBookingData = JSON.parse(dataMatch[1])
        reply = raw.replace(/BOOKING_DATA:\{[^}]*\}/, '').trim()
        if (!reply) {
          reply = `Perfect! I have everything I need. I'm creating your booking now — you'll receive a confirmation email shortly. Is there anything else I can help you with?`
        }
      } catch {
        // JSON parse failed, ignore
      }
    }

    return NextResponse.json({ reply, bookingData: newBookingData })
  } catch (err) {
    console.error('Booking AI error:', err)
    return NextResponse.json({
      reply: "I'm having a little trouble right now. Please try again in a moment.",
      bookingData: null,
    })
  }
}
