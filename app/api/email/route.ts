import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

type EmailType = 'invoice' | 'payment_reminder' | 'quote' | 'job_confirmation' | 'custom'

interface EmailPayload {
  type: EmailType
  to: string
  customerName: string
  // Invoice / Quote fields
  invoiceNumber?: string
  amount?: string
  dueDate?: string
  quoteTitle?: string
  // Job fields
  jobTitle?: string
  scheduledDate?: string
  // Custom
  subject?: string
  body?: string
  // Sender identity
  businessName?: string
}

function buildEmailContent(payload: EmailPayload): { subject: string; html: string } {
  const biz = payload.businessName || 'FieldOS Business'

  switch (payload.type) {
    case 'invoice':
      return {
        subject: `Invoice ${payload.invoiceNumber || ''} from ${biz}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827">
            <div style="background:#4f46e5;padding:24px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0;font-size:20px">${biz}</h1>
            </div>
            <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
              <p style="margin:0 0 16px">Hi ${payload.customerName},</p>
              <p style="margin:0 0 24px">Please find your invoice details below.</p>
              <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px">
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="padding:6px 0;color:#6b7280">Invoice #</td><td style="padding:6px 0;font-weight:600;text-align:right">${payload.invoiceNumber || '—'}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280">Amount Due</td><td style="padding:6px 0;font-weight:700;font-size:18px;color:#4f46e5;text-align:right">${payload.amount || '—'}</td></tr>
                  ${payload.dueDate ? `<tr><td style="padding:6px 0;color:#6b7280">Due Date</td><td style="padding:6px 0;font-weight:600;text-align:right">${payload.dueDate}</td></tr>` : ''}
                </table>
              </div>
              <p style="color:#6b7280;font-size:13px;margin:0">If you have questions, reply to this email.</p>
            </div>
          </div>`,
      }

    case 'payment_reminder':
      return {
        subject: `Payment reminder: ${payload.invoiceNumber || 'Invoice'} is overdue`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827">
            <div style="background:#dc2626;padding:24px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0;font-size:20px">Payment Reminder — ${biz}</h1>
            </div>
            <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
              <p style="margin:0 0 16px">Hi ${payload.customerName},</p>
              <p style="margin:0 0 24px">This is a friendly reminder that the following invoice is <strong>overdue</strong>.</p>
              <div style="background:white;border:2px solid #fca5a5;border-radius:8px;padding:20px;margin-bottom:24px">
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="padding:6px 0;color:#6b7280">Invoice #</td><td style="padding:6px 0;font-weight:600;text-align:right">${payload.invoiceNumber || '—'}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b7280">Amount Due</td><td style="padding:6px 0;font-weight:700;font-size:18px;color:#dc2626;text-align:right">${payload.amount || '—'}</td></tr>
                  ${payload.dueDate ? `<tr><td style="padding:6px 0;color:#6b7280">Was Due</td><td style="padding:6px 0;font-weight:600;text-align:right">${payload.dueDate}</td></tr>` : ''}
                </table>
              </div>
              <p style="color:#6b7280;font-size:13px;margin:0">Please contact us to arrange payment. Thank you.</p>
            </div>
          </div>`,
      }

    case 'quote':
      return {
        subject: `Quote from ${biz}: ${payload.quoteTitle || ''}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827">
            <div style="background:#4f46e5;padding:24px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0;font-size:20px">Quote from ${biz}</h1>
            </div>
            <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
              <p>Hi ${payload.customerName},</p>
              <p>We've prepared a quote for <strong>${payload.quoteTitle || 'your request'}</strong>.</p>
              <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px">
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="padding:6px 0;color:#6b7280">Quote Total</td><td style="padding:6px 0;font-weight:700;font-size:18px;color:#4f46e5;text-align:right">${payload.amount || '—'}</td></tr>
                </table>
              </div>
              <p style="color:#6b7280;font-size:13px">Reply to this email to accept or request changes.</p>
            </div>
          </div>`,
      }

    case 'job_confirmation':
      return {
        subject: `Job confirmed: ${payload.jobTitle || ''} — ${biz}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827">
            <div style="background:#059669;padding:24px 32px;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0;font-size:20px">Booking Confirmed — ${biz}</h1>
            </div>
            <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
              <p>Hi ${payload.customerName},</p>
              <p>Your booking is confirmed!</p>
              <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px">
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="padding:6px 0;color:#6b7280">Service</td><td style="padding:6px 0;font-weight:600;text-align:right">${payload.jobTitle || '—'}</td></tr>
                  ${payload.scheduledDate ? `<tr><td style="padding:6px 0;color:#6b7280">Date</td><td style="padding:6px 0;font-weight:600;text-align:right">${payload.scheduledDate}</td></tr>` : ''}
                </table>
              </div>
              <p style="color:#6b7280;font-size:13px">We'll be in touch to confirm the time. See you soon!</p>
            </div>
          </div>`,
      }

    case 'custom':
    default:
      return {
        subject: payload.subject || `Message from ${biz}`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111827;padding:32px">
          <p>Hi ${payload.customerName},</p>
          <div style="white-space:pre-wrap">${payload.body || ''}</div>
          <p style="margin-top:24px;color:#6b7280;font-size:13px">— ${biz}</p>
        </div>`,
      }
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email not configured. Add RESEND_API_KEY to environment variables.' }, { status: 503 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const payload: EmailPayload = await req.json()

    if (!payload.to || !payload.customerName) {
      return NextResponse.json({ error: 'Missing required fields: to, customerName' }, { status: 400 })
    }

    const { subject, html } = buildEmailContent(payload)

    const { data, error } = await resend.emails.send({
      from: `${payload.businessName || 'FieldOS'} <noreply@${process.env.RESEND_FROM_DOMAIN || 'resend.dev'}>`,
      to: payload.to,
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Email route error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
