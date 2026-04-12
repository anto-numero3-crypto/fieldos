import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

type EmailType = 'invoice' | 'payment_reminder' | 'quote' | 'job_confirmation' | 'custom'

interface LineItemEmail {
  description: string
  qty: number
  unit?: string
  unit_price: number
  taxable?: boolean
}

interface EmailPayload {
  type: EmailType
  to: string
  customerName: string
  // Invoice / Quote fields
  invoiceNumber?: string
  amount?: string
  subtotal?: string
  taxName?: string
  taxAmount?: string
  tax2Name?: string
  tax2Amount?: string
  discount?: string
  dueDate?: string
  quoteTitle?: string
  paymentLink?: string
  lineItems?: LineItemEmail[]
  // Job fields
  jobTitle?: string
  scheduledDate?: string
  // Custom
  subject?: string
  body?: string
  // Sender identity
  businessName?: string
}

function fmtAmt(n: number): string {
  return n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 })
}

function buildEmailContent(payload: EmailPayload): { subject: string; html: string } {
  const biz = payload.businessName || 'Gestivio Business'

  switch (payload.type) {
    case 'invoice': {
      const lineItemsHtml = payload.lineItems && payload.lineItems.length > 0
        ? `<table style="width:100%;border-collapse:collapse;margin-bottom:0">
            <thead>
              <tr style="border-bottom:2px solid #e5e7eb">
                <th style="padding:8px 6px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Description</th>
                <th style="padding:8px 6px;text-align:center;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Qté</th>
                <th style="padding:8px 6px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Prix unit.</th>
                <th style="padding:8px 6px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Total</th>
              </tr>
            </thead>
            <tbody>
              ${payload.lineItems.map(li => `<tr style="border-bottom:1px solid #f3f4f6">
                <td style="padding:10px 6px;font-size:14px;color:#111827">${li.description}${li.unit ? ` <span style="color:#9ca3af;font-size:12px">(${li.unit})</span>` : ''}</td>
                <td style="padding:10px 6px;text-align:center;font-size:14px;color:#6b7280">${li.qty}</td>
                <td style="padding:10px 6px;text-align:right;font-size:14px;color:#6b7280">${fmtAmt(li.unit_price)}</td>
                <td style="padding:10px 6px;text-align:right;font-size:14px;font-weight:600;color:#111827">${fmtAmt(li.qty * li.unit_price)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
          <div style="border-top:2px solid #e5e7eb;padding-top:12px;margin-top:4px">
            ${payload.subtotal ? `<div style="display:flex;justify-content:space-between;padding:4px 6px;font-size:14px;color:#6b7280"><span>Sous-total</span><span>${payload.subtotal}</span></div>` : ''}
            ${payload.discount ? `<div style="display:flex;justify-content:space-between;padding:4px 6px;font-size:14px;color:#059669"><span>Rabais</span><span>− ${payload.discount}</span></div>` : ''}
            ${payload.taxAmount ? `<div style="display:flex;justify-content:space-between;padding:4px 6px;font-size:14px;color:#6b7280"><span>${payload.taxName || 'TPS'}</span><span>${payload.taxAmount}</span></div>` : ''}
            ${payload.tax2Amount ? `<div style="display:flex;justify-content:space-between;padding:4px 6px;font-size:14px;color:#6b7280"><span>${payload.tax2Name || 'TVQ'}</span><span>${payload.tax2Amount}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;padding:8px 6px;font-size:18px;font-weight:700;color:#111827;border-top:1px solid #e5e7eb;margin-top:4px"><span>Total</span><span style="color:#4f46e5">${payload.amount || '—'}</span></div>
          </div>`
        : `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0">
            <span style="font-size:14px;color:#6b7280">Montant dû</span>
            <span style="font-size:24px;font-weight:700;color:#4f46e5">${payload.amount || '—'}</span>
          </div>`
      return {
        subject: `Facture ${payload.invoiceNumber || ''} — ${biz}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827">
            <div style="background:#4f46e5;padding:28px 36px;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0 0 4px;font-size:22px;font-weight:700">${biz}</h1>
              <p style="color:#c7d2fe;margin:0;font-size:14px">Facture ${payload.invoiceNumber || ''}</p>
            </div>
            <div style="background:#f9fafb;padding:36px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
              <p style="margin:0 0 8px;font-size:16px">Bonjour ${payload.customerName},</p>
              <p style="margin:0 0 28px;color:#6b7280;font-size:14px">Veuillez trouver ci-dessous le détail de votre facture.</p>
              <div style="background:white;border:1px solid #e5e7eb;border-radius:10px;padding:4px 20px 20px;margin-bottom:28px">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 6px 12px;border-bottom:1px solid #f3f4f6;margin-bottom:12px">
                  <div>
                    ${payload.dueDate ? `<p style="margin:0;font-size:13px;color:#6b7280">Échéance : <strong style="color:#111827">${payload.dueDate}</strong></p>` : ''}
                  </div>
                </div>
                ${lineItemsHtml}
              </div>
              ${payload.paymentLink ? `<div style="text-align:center;margin:28px 0">
                <a href="${payload.paymentLink}" style="background:#4f46e5;color:white;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;letter-spacing:.01em">Payer maintenant ${payload.amount || ''}</a>
                <p style="color:#9ca3af;font-size:12px;margin-top:12px">Paiement sécurisé · Visa · Mastercard · Amex · Interac</p>
              </div>` : ''}
              <p style="color:#9ca3af;font-size:13px;margin:0;border-top:1px solid #e5e7eb;padding-top:20px">Pour toute question, répondez directement à cet email.</p>
            </div>
          </div>`,
      }
    }

    case 'payment_reminder': {
      const reminderLineItemsHtml = payload.lineItems && payload.lineItems.length > 0
        ? `<table style="width:100%;border-collapse:collapse;margin-bottom:0">
            <thead>
              <tr style="border-bottom:2px solid #fecaca">
                <th style="padding:8px 6px;text-align:left;font-size:12px;font-weight:600;color:#6b7280">Description</th>
                <th style="padding:8px 6px;text-align:right;font-size:12px;font-weight:600;color:#6b7280">Total</th>
              </tr>
            </thead>
            <tbody>
              ${payload.lineItems.map(li => `<tr style="border-bottom:1px solid #fef2f2">
                <td style="padding:8px 6px;font-size:13px;color:#111827">${li.description}</td>
                <td style="padding:8px 6px;text-align:right;font-size:13px;font-weight:600;color:#111827">${fmtAmt(li.qty * li.unit_price)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
          <div style="border-top:2px solid #fecaca;padding-top:10px;margin-top:4px">
            <div style="display:flex;justify-content:space-between;padding:6px;font-size:17px;font-weight:700;color:#dc2626"><span>Total dû</span><span>${payload.amount || '—'}</span></div>
          </div>`
        : `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0">
            <span style="font-size:14px;color:#6b7280">Montant en souffrance</span>
            <span style="font-size:22px;font-weight:700;color:#dc2626">${payload.amount || '—'}</span>
          </div>`
      return {
        subject: `Rappel de paiement : facture ${payload.invoiceNumber || ''} en souffrance`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827">
            <div style="background:#dc2626;padding:28px 36px;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0 0 4px;font-size:22px;font-weight:700">Rappel de paiement</h1>
              <p style="color:#fecaca;margin:0;font-size:14px">${biz}</p>
            </div>
            <div style="background:#f9fafb;padding:36px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
              <p style="margin:0 0 8px;font-size:16px">Bonjour ${payload.customerName},</p>
              <p style="margin:0 0 28px;color:#6b7280;font-size:14px">Nous vous rappelons amicalement que la facture suivante est <strong style="color:#dc2626">en souffrance</strong>. Merci d'effectuer le paiement dans les plus brefs délais.</p>
              <div style="background:white;border:2px solid #fecaca;border-radius:10px;padding:4px 20px 20px;margin-bottom:28px">
                <div style="padding:14px 6px 12px;border-bottom:1px solid #fef2f2;margin-bottom:12px">
                  <p style="margin:0;font-size:13px;color:#6b7280">Facture <strong style="color:#111827">${payload.invoiceNumber || '—'}</strong>${payload.dueDate ? ` · Était due le <strong style="color:#dc2626">${payload.dueDate}</strong>` : ''}</p>
                </div>
                ${reminderLineItemsHtml}
              </div>
              ${payload.paymentLink ? `<div style="text-align:center;margin:28px 0">
                <a href="${payload.paymentLink}" style="background:#dc2626;color:white;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">Payer maintenant ${payload.amount || ''}</a>
              </div>` : ''}
              <p style="color:#9ca3af;font-size:13px;margin:0;border-top:1px solid #e5e7eb;padding-top:20px">Veuillez nous contacter si vous pensez avoir déjà réglé cette facture.</p>
            </div>
          </div>`,
      }
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
      from: `${payload.businessName || 'Gestivio'} <noreply@gestivio.ca>`,
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
