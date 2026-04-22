import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit } from '@/lib/rate-limit'

interface ContactPayload {
  name?: string
  email?: string
  company?: string
  subject?: string
  message?: string
}

export async function POST(req: NextRequest) {
  // 5 contact submissions per hour per IP. More than enough for a real user;
  // stops obvious form-bot spam.
  const limited = rateLimit(req, { key: 'contact', limit: 5, windowMs: 60 * 60 * 1000 })
  if (limited) return limited

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
  }

  const payload: ContactPayload = await req.json().catch(() => ({}))
  const name = (payload.name ?? '').trim()
  const email = (payload.email ?? '').trim()
  const subject = (payload.subject ?? '').trim() || 'Contact form'
  const message = (payload.message ?? '').trim()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    await resend.emails.send({
      from: 'Gestivio <noreply@gestivio.ca>',
      to: 'support@gestivio.ca',
      replyTo: email,
      subject: `[Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nCompany: ${payload.company ?? '—'}\n\nMessage:\n${message}`,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact]', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
