import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const secret = searchParams.get('secret')

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Invalid or missing secret param' }, { status: 403 })
  }

  if (!email) {
    return NextResponse.json({ error: 'Missing ?email= query param' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not set' }, { status: 503 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data, error } = await resend.emails.send({
    from: 'Gestivio <noreply@gestivio.ca>',
    to: email,
    subject: 'Test email from Gestivio',
    html: '<p>This is a test email. If you received this, email sending works.</p>',
  })

  return NextResponse.json({ data, error })
}
