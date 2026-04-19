'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CheckCircle, Clock, AlertCircle, CreditCard, Phone, Mail, Printer, Lock } from 'lucide-react'
import { fmtMoney, fmtDate } from '@/lib/format'
import { secureUrl } from '@/lib/secure-url'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'
import translations from '@/lib/i18n'
import { getPlanLimits, normalizePlan } from '@/lib/plan-limits'

interface LineItem {
  id?: string
  description: string
  qty: number
  unit?: string
  unit_price: number
  taxable?: boolean
}

interface PublicInvoice {
  id: string
  user_id: string
  token: string
  invoice_number: string | null
  amount: number
  subtotal: number | null
  tax_rate: number | null
  tax_amount: number | null
  tax_name: string | null
  tax2_rate: number | null
  tax2_amount: number | null
  tax2_name: string | null
  discount: number | null
  status: string
  due_date: string | null
  created_at: string
  paid_at: string | null
  client_notes: string | null
  terms: string | null
  line_items: LineItem[] | null
  customers: { name: string; email: string | null; phone: string | null; address: string | null } | null
}

interface OrgData {
  name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  tax_number: string | null
  logo_url: string | null
  stripe_connect_charges_enabled: boolean | null
  plan?: string | null
  tps_number?: string | null
  tvq_number?: string | null
  neq_number?: string | null
  rbq_number?: string | null
  cmeq_number?: string | null
  cmmtq_number?: string | null
  other_licence_name?: string | null
  other_licence_number?: string | null
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Legacy formatter kept for backward compat with any remaining usages
const fmt = (n: number) =>
  `$${parseFloat(String(n || 0)).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function PublicInvoiceContent() {
  const { token } = useParams<{ token: string }>()
  const searchParams = useSearchParams()
  const { lang } = useLanguage()
  // publicInvoice keys were added via Object.assign merge; access via typed cast
  const ti = (translations[lang] as unknown as { publicInvoice: Record<string, string> }).publicInvoice

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null)
  const [org, setOrg] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [paying, setPaying] = useState(false)
  const justPaid = searchParams.get('paid') === 'true'

  useEffect(() => {
    const load = async () => {
      // Step 1: fetch invoice by token
      const { data: invData, error } = await supabase
        .from('invoices')
        .select(`
          id, user_id, token, invoice_number, amount, subtotal,
          tax_rate, tax_amount, tax_name,
          tax2_rate, tax2_amount, tax2_name,
          discount, status, due_date, created_at, paid_at,
          client_notes, terms, line_items,
          customers(name, email, phone, address)
        `)
        .eq('token', token)
        .single()

      if (error || !invData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setInvoice(invData as unknown as PublicInvoice)

      // Step 2: fetch org separately by owner_user_id
      if (invData.user_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name, email, phone, address, city, state, zip, tax_number, logo_url, stripe_connect_charges_enabled, plan, tps_number, tvq_number, neq_number, rbq_number, cmeq_number, cmmtq_number, other_licence_name, other_licence_number')
          .eq('owner_user_id', invData.user_id)
          .single()
        if (orgData) setOrg(orgData as OrgData)
      }

      // Mark as viewed via track-view API (fire-and-forget, ignore errors)
      if (invData.status !== 'paid') {
        fetch('/api/invoices/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }).catch(() => {})
      }

      setLoading(false)
    }
    load()
  }, [token])

  const [payError, setPayError] = useState<string | null>(null)
  const handlePay = async () => {
    if (!invoice) return
    setPaying(true)
    setPayError(null)
    try {
      const res = await fetch('/api/stripe/invoice-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          token: invoice.token,
          returnPath: `/invoice/${token}`,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setPayError(data.error || 'Paiement indisponible pour le moment.')
        setPaying(false)
      }
    } catch {
      setPayError('Erreur réseau. Veuillez réessayer.')
      setPaying(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl border border-gray-200 bg-white p-10 max-w-sm shadow-sm">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">{ti.notFound}</h1>
        <p className="text-sm text-gray-500">{ti.notFoundDesc}</p>
      </div>
    </div>
  )

  const inv = invoice!
  const isPaid = inv.status === 'paid' || justPaid
  const isOverdue = !isPaid && inv.due_date && new Date(inv.due_date) < new Date()

  // Calculate totals from line items if available, else fall back to stored amount
  const lineItems = (inv.line_items || []).filter((li) => li.description?.trim())
  const taxableItems = lineItems.filter((li) => li.taxable !== false)
  const nonTaxableItems = lineItems.filter((li) => li.taxable === false)

  const subtotal = lineItems.length > 0
    ? lineItems.reduce((s, li) => s + (li.qty || 1) * (li.unit_price || 0), 0)
    : (inv.subtotal || inv.amount || 0)

  const taxableSubtotal = lineItems.length > 0
    ? taxableItems.reduce((s, li) => s + (li.qty || 1) * (li.unit_price || 0), 0)
    : subtotal

  const taxAmt  = inv.tax_amount  != null ? inv.tax_amount  : taxableSubtotal * ((inv.tax_rate  || 0) / 100)
  const tax2Amt = inv.tax2_amount != null ? inv.tax2_amount : taxableSubtotal * ((inv.tax2_rate || 0) / 100)
  const discount = inv.discount || 0
  const total = subtotal + taxAmt + tax2Amt - discount

  const canPay = !isPaid && (org?.stripe_connect_charges_enabled || true) // allow Stripe checkout even without Connect

  // Gestivio branding is only shown on the Démarrage plan (includes legacy "starter").
  const showBranding = getPlanLimits(normalizePlan(org?.plan)).showGestivioBranding

  const fr = lang === 'fr'
  const invoiceNumber = inv.invoice_number || inv.id.slice(0, 8).toUpperCase()
  const hasLogo = !!org?.logo_url && !showBranding
  const bizName = org?.name || ''

  // Address dedup: if org.address contains commas, use as-is
  const orgAddressLine = org?.address
    ? org.address.includes(',')
      ? org.address
      : [org.address, org.city, org.state, org.zip].filter(Boolean).join(', ')
    : [org?.city, org?.state, org?.zip].filter(Boolean).join(', ')

  // Quebec legal lines
  const taxLine = [
    org?.tps_number && `N\u00B0 TPS: ${org.tps_number}`,
    org?.tvq_number && `N\u00B0 TVQ: ${org.tvq_number}`,
    org?.neq_number && `NEQ: ${org.neq_number}`,
  ].filter(Boolean).join(' \u00B7 ')

  const licenceLine = [
    org?.rbq_number && `RBQ: ${org.rbq_number}`,
    org?.cmeq_number && `CMEQ: ${org.cmeq_number}`,
    org?.cmmtq_number && `CMMTQ: ${org.cmmtq_number}`,
    org?.other_licence_name && org?.other_licence_number && `${org.other_licence_name}: ${org.other_licence_number}`,
  ].filter(Boolean).join(' \u00B7 ')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: letter; margin: 0.45in 0.5in; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; font-size: 9pt !important; line-height: 1.3 !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .screen-only, .no-print, nav, header, button { display: none !important; }
          .print-only {
            display: block !important;
            background: white !important; box-shadow: none !important; border: none !important;
            border-radius: 0 !important; padding: 0 !important; margin: 0 !important;
            width: 100% !important; max-width: 100% !important;
          }
          .print-footer { page-break-inside: avoid; }
          .print-section { page-break-inside: avoid; break-inside: avoid; }
        }
        @media screen { .print-only { display: none !important; } }
      `}} />
      <div className="min-h-screen bg-slate-50 py-6 px-4 print:!bg-white print:!p-0 print:!m-0">
        {/* ═══════ PRINT-ONLY PROFESSIONAL INVOICE ═══════ */}
        <div className="print-only" style={{ fontFamily: "-apple-system, 'Segoe UI', sans-serif", color: '#111', position: 'relative' }}>

          {/* WATERMARKS */}
          {isPaid && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-35deg)', fontSize: '60pt', fontWeight: 800, color: '#16a34a', opacity: 0.08, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              {fr ? 'PAYÉE' : 'PAID'}
            </div>
          )}
          {inv.status === 'draft' && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-35deg)', fontSize: '60pt', fontWeight: 800, color: '#888', opacity: 0.08, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              {fr ? 'BROUILLON' : 'DRAFT'}
            </div>
          )}

          {/* HEADER: two columns */}
          <div className="print-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* LEFT: logo/name + address */}
            <div style={{ maxWidth: '60%' }}>
              {hasLogo ? (
                <img src={secureUrl(org!.logo_url!)} alt={bizName} style={{ maxWidth: '95px', maxHeight: '32px', objectFit: 'contain', display: 'block', marginBottom: '2px' }} />
              ) : (
                <div style={{ fontSize: '13pt', fontWeight: 800, marginBottom: '1px' }}>{bizName}</div>
              )}
              {orgAddressLine && <div style={{ fontSize: '7.5pt', color: '#555' }}>{orgAddressLine}</div>}
              {(org?.phone || org?.email) && (
                <div style={{ fontSize: '7.5pt', color: '#555' }}>
                  {[org?.phone, org?.email].filter(Boolean).join(' \u00B7 ')}
                </div>
              )}
              {taxLine && <div style={{ fontSize: '7pt', color: '#888' }}>{taxLine}</div>}
              {licenceLine && <div style={{ fontSize: '7pt', color: '#888' }}>{licenceLine}</div>}
            </div>
            {/* RIGHT: FACTURE box */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18pt', fontWeight: 800, letterSpacing: '2px', color: '#111', marginBottom: '4px' }}>
                {fr ? 'FACTURE' : 'INVOICE'}
              </div>
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '3px 6px', textAlign: 'left', fontSize: '8pt', lineHeight: 1.5 }}>
                <div><strong>{fr ? 'Numéro' : 'Number'}:</strong> {invoiceNumber}</div>
                <div><strong>Date:</strong> {fmtDate(inv.created_at, lang)}</div>
                {inv.due_date && <div><strong>{fr ? 'Échéance' : 'Due'}:</strong> {fmtDate(inv.due_date, lang)}</div>}
                <div><strong>{fr ? 'Statut' : 'Status'}:</strong> {isPaid ? (fr ? 'Payée' : 'Paid') : isOverdue ? (fr ? 'En retard' : 'Overdue') : (fr ? 'En attente' : 'Pending')}</div>
              </div>
            </div>
          </div>

          {/* DIVIDER */}
          <div style={{ borderTop: '1.5px solid #000', margin: '3px 0' }} />

          {/* BILL TO */}
          {inv.customers && (
            <div className="print-section" style={{ marginBottom: '4px' }}>
              <div style={{ fontSize: '6pt', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1px' }}>
                {fr ? 'FACTURÉ À' : 'BILLED TO'}
              </div>
              <div style={{ fontSize: '9.5pt', fontWeight: 700 }}>{inv.customers.name}</div>
              <div style={{ fontSize: '8pt', color: '#555' }}>
                {[inv.customers.address, inv.customers.phone, inv.customers.email].filter(Boolean).join(' \u00B7 ')}
              </div>
            </div>
          )}

          {/* LINE ITEMS TABLE */}
          <table className="print-section" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
            <thead>
              <tr style={{ background: '#1f2937', color: 'white' }}>
                <th style={{ textAlign: 'left', padding: '3px 6px', fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                <th style={{ textAlign: 'center', padding: '3px 6px', fontSize: '7.5pt', textTransform: 'uppercase', width: '50px' }}>{fr ? 'Qté' : 'Qty'}</th>
                <th style={{ textAlign: 'right', padding: '3px 6px', fontSize: '7.5pt', textTransform: 'uppercase', width: '80px' }}>{fr ? 'Prix unit.' : 'Unit price'}</th>
                <th style={{ textAlign: 'right', padding: '3px 6px', fontSize: '7.5pt', textTransform: 'uppercase', width: '80px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(lineItems.length > 0 ? lineItems : [{ description: inv.invoice_number || 'Services', qty: 1, unit_price: subtotal } as LineItem]).map((li, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 ? '#fafafa' : 'white' }}>
                  <td style={{ padding: '3px 6px', fontSize: '8.5pt' }}>{li.description}{li.unit && li.unit !== 'unité' && li.unit !== 'unit' ? ` (${li.unit})` : ''}</td>
                  <td style={{ textAlign: 'center', padding: '3px 6px', fontSize: '8.5pt' }}>{li.qty}</td>
                  <td style={{ textAlign: 'right', padding: '3px 6px', fontSize: '8.5pt' }}>{fmtMoney(li.unit_price, lang)}</td>
                  <td style={{ textAlign: 'right', padding: '3px 6px', fontSize: '8.5pt', fontWeight: 600 }}>{fmtMoney((li.qty || 1) * (li.unit_price || 0), lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS (right-aligned) */}
          <div className="print-section" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
            <div style={{ width: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '9pt', color: '#555' }}>
                <span>{fr ? 'Sous-total' : 'Subtotal'}</span><span>{fmtMoney(subtotal, lang)}</span>
              </div>
              {taxAmt > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '9pt', color: '#555' }}>
                  <span>{inv.tax_name || 'TPS'}{inv.tax_rate ? ` (${inv.tax_rate}%)` : ''}</span><span>{fmtMoney(taxAmt, lang)}</span>
                </div>
              )}
              {tax2Amt > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '9pt', color: '#555' }}>
                  <span>{inv.tax2_name || 'TVQ'}{inv.tax2_rate ? ` (${inv.tax2_rate}%)` : ''}</span><span>{fmtMoney(tax2Amt, lang)}</span>
                </div>
              )}
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '9pt', color: '#16a34a' }}>
                  <span>{fr ? 'Rabais' : 'Discount'}</span><span>-{fmtMoney(discount, lang)}</span>
                </div>
              )}
              <div style={{ borderTop: '2px solid #000', marginTop: '4px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '11pt', fontWeight: 800 }}>
                <span>{fr ? 'TOTAL DÛ' : 'TOTAL DUE'}</span><span>{fmtMoney(total, lang)}</span>
              </div>
            </div>
          </div>

          {/* PAYMENT STATUS */}
          <div className="print-section">
            {isPaid ? (
              <div style={{ border: '2px solid #16a34a', borderRadius: '4px', background: '#f0fdf4', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '9pt' }}>&#10003; {fr ? 'PAYÉE' : 'PAID'}</span>
                {inv.paid_at && <span style={{ fontSize: '8pt', color: '#555' }}>{fr ? 'Reçu le' : 'Received'} {fmtDate(inv.paid_at, lang)}</span>}
              </div>
            ) : (
              <div style={{ border: '2px solid #111', borderRadius: '4px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '9pt' }}>{fr ? 'SOLDE DÛ' : 'BALANCE DUE'}: {fmtMoney(total, lang)}</span>
              </div>
            )}
          </div>

          {/* SPACER */}

          {/* NOTES */}
          {inv.client_notes && (
            <div className="print-section" style={{ borderLeft: '3px solid #ddd', padding: '4px 8px', marginBottom: '6px', background: '#fafafa' }}>
              <div style={{ fontSize: '7pt', fontWeight: 700, color: '#888', marginBottom: '2px' }}>Notes</div>
              <div style={{ fontSize: '8pt', color: '#555', whiteSpace: 'pre-wrap' }}>{inv.client_notes}</div>
            </div>
          )}

          {/* FOOTER */}
          <div className="print-footer" style={{ borderTop: '1px solid #ddd', paddingTop: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '8pt', color: '#888', fontStyle: 'italic', marginBottom: '2px' }}>
              {fr ? 'Merci pour votre confiance.' : 'Thank you for your business.'}
            </div>
            <div style={{ fontSize: '7pt', color: '#999' }}>
              {bizName}{org?.phone ? ` \u00B7 ${org.phone}` : ''}{org?.email ? ` \u00B7 ${org.email}` : ''}
            </div>
            {showBranding && (
              <div style={{ fontSize: '7pt', color: '#ccc', marginTop: '4px' }}>
                {fr ? 'Facture générée via Gestivio \u00B7 gestivio.ca' : 'Invoice generated via Gestivio \u00B7 gestivio.ca'}
              </div>
            )}
          </div>
        </div>


        {/* ══════════ SCREEN-ONLY ONLINE PAYMENT VIEW ══════════ */}
        <div className="screen-only max-w-2xl mx-auto space-y-4">
          <div className="flex justify-end items-center gap-2">
            <LanguageToggle />
            <div className="text-right">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
              >
                <Printer className="h-3.5 w-3.5" /> {ti.printPdf}
              </button>
              <p className="text-[11px] text-gray-400 mt-1">
                {fr
                  ? "Dans la boîte de dialogue d'impression, sélectionnez « Enregistrer en PDF »"
                  : 'In the print dialog, select "Save as PDF"'}
              </p>
            </div>
          </div>
          {lang === 'en' && (
            <p className="text-xs text-center text-gray-400 italic">{ti.formalNote}</p>
          )}

          {/* Business header with logo */}
          {org && (
            <div className="text-center pt-2 pb-1">
              {hasLogo ? (
                <img src={secureUrl(org.logo_url!)} alt={bizName} className="mx-auto mb-2" style={{ maxWidth: '150px', maxHeight: '70px', objectFit: 'contain' }} />
              ) : (
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-xl mb-2">
                  {bizName.charAt(0).toUpperCase()}
                </div>
              )}
              <p className="font-bold text-gray-900">{bizName}</p>
              {(org.city || org.state) && <p className="text-xs text-gray-400">{[org.city, org.state].filter(Boolean).join(', ')}</p>}
            </div>
          )}

          {/* Payment success banner */}
          {isPaid && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-emerald-900">{ti.paymentReceived}</p>
                <p className="text-sm text-emerald-700 mt-0.5">
                  {ti.paymentReceivedSub}
                  {inv.customers?.email && ` Un reçu a été envoyé à ${inv.customers.email}.`}
                </p>
              </div>
            </div>
          )}

          {/* Main invoice card */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

            {/* Invoice header */}
            <div className="px-6 py-6 sm:px-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{ti.invoice}</p>
                  <h1 className="text-2xl font-black text-gray-900">{inv.invoice_number || `INV-${inv.id.slice(0, 8).toUpperCase()}`}</h1>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold mb-2 ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : isOverdue ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {isPaid ? <CheckCircle className="h-3.5 w-3.5" /> : isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    {isPaid ? ti.paid : isOverdue ? ti.overdue : ti.outstanding}
                  </div>
                  <div className="text-sm text-gray-500 space-y-0.5">
                    <p>{ti.issued} {fmtDate(inv.created_at, lang)}</p>
                    {inv.due_date && (
                      <p className={isOverdue && !isPaid ? 'text-red-600 font-semibold' : ''}>
                        {ti.due}: {fmtDate(inv.due_date, lang)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Amount due — prominent */}
            {!isPaid && (
              <div className="mx-6 sm:mx-8 mb-2 rounded-2xl bg-indigo-600 px-6 py-5 text-white text-center">
                <p className="text-sm font-medium text-indigo-200 mb-1">{ti.amountDue}</p>
                <p className="text-4xl font-black">{fmtMoney(total, lang)}</p>
              </div>
            )}

            {/* Bill from / to */}
            <div className="px-6 sm:px-8 py-5 grid sm:grid-cols-2 gap-5 border-t border-gray-100">
              {org && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{ti.from}</p>
                  <p className="font-semibold text-gray-900 text-sm">{org.name}</p>
                  {org.address && <p className="text-xs text-gray-500 mt-0.5">{org.address}</p>}
                  {(org.city || org.state) && <p className="text-xs text-gray-500">{[org.city, org.state, org.zip].filter(Boolean).join(', ')}</p>}
                  {org.email && <p className="text-xs text-gray-500">{org.email}</p>}
                  {org.phone && <p className="text-xs text-gray-500">{org.phone}</p>}
                  {org.tax_number && <p className="text-xs text-gray-400 mt-1">TPS/TVQ: {org.tax_number}</p>}
                  {taxLine && <p className="text-[11px] text-gray-400">{taxLine}</p>}
                  {licenceLine && <p className="text-[11px] text-gray-400">{licenceLine}</p>}
                </div>
              )}
              {inv.customers && (
                <div className={org ? '' : 'sm:col-start-2'}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{ti.billedTo}</p>
                  <p className="font-semibold text-gray-900 text-sm">{inv.customers.name}</p>
                  {inv.customers.address && <p className="text-xs text-gray-500 mt-0.5">{inv.customers.address}</p>}
                  {inv.customers.email && <p className="text-xs text-gray-500">{inv.customers.email}</p>}
                  {inv.customers.phone && <p className="text-xs text-gray-500">{inv.customers.phone}</p>}
                </div>
              )}
            </div>

            {/* Line items */}
            {lineItems.length > 0 && (
              <div className="px-6 sm:px-8 py-4 border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-14">{fr ? 'Qté' : 'Qty'}</th>
                      <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">{fr ? 'Prix unit.' : 'Unit price'}</th>
                      <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {lineItems.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2.5 text-gray-900">
                          {item.description}
                          {item.unit && item.unit !== 'unité' && <span className="text-xs text-gray-400 ml-1">/ {item.unit}</span>}
                        </td>
                        <td className="py-2.5 text-right text-gray-500">{item.qty}</td>
                        <td className="py-2.5 text-right text-gray-500">{fmtMoney(item.unit_price, lang)}</td>
                        <td className="py-2.5 text-right font-semibold text-gray-900">{fmtMoney((item.qty || 1) * (item.unit_price || 0), lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div className="px-6 sm:px-8 py-4 border-t border-gray-100">
              <div className="flex flex-col items-end gap-1.5 max-w-xs ml-auto">
                {lineItems.length > 0 && (
                  <div className="flex justify-between w-full text-sm">
                    <span className="text-gray-500">{fr ? 'Sous-total' : 'Subtotal'}</span>
                    <span className="font-medium text-gray-900">{fmtMoney(subtotal, lang)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between w-full text-sm">
                    <span className="text-gray-500">{fr ? 'Escompte' : 'Discount'}</span>
                    <span className="font-medium text-emerald-600">-{fmtMoney(discount, lang)}</span>
                  </div>
                )}
                {taxAmt > 0 && (
                  <div className="flex justify-between w-full text-sm">
                    <span className="text-gray-500">{inv.tax_name || 'TPS'}{inv.tax_rate ? ` (${inv.tax_rate}%)` : ''}</span>
                    <span className="font-medium text-gray-900">{fmtMoney(taxAmt, lang)}</span>
                  </div>
                )}
                {tax2Amt > 0 && (
                  <div className="flex justify-between w-full text-sm">
                    <span className="text-gray-500">{inv.tax2_name || 'TVQ'}{inv.tax2_rate ? ` (${inv.tax2_rate}%)` : ''}</span>
                    <span className="font-medium text-gray-900">{fmtMoney(tax2Amt, lang)}</span>
                  </div>
                )}
                <div className="flex justify-between w-full border-t border-gray-200 pt-2 mt-1">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-black text-gray-900">{fmtMoney(total, lang)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {inv.client_notes && (
              <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Notes</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">{inv.client_notes}</p>
              </div>
            )}
            {inv.terms && (
              <div className="px-6 sm:px-8 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">{inv.terms}</p>
              </div>
            )}

            {/* Payment CTA */}
            <div className="px-6 sm:px-8 py-6 border-t border-gray-100 no-print">
              {isPaid ? (
                <div className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  <p className="font-semibold text-emerald-800">
                    {ti.paidOn} {inv.paid_at ? fmtDate(inv.paid_at, lang) : '\u2014'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={handlePay}
                    disabled={paying}
                    className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all active:scale-[0.99] shadow-lg shadow-indigo-100"
                  >
                    <CreditCard className="h-5 w-5" />
                    {paying ? ti.redirecting : `${ti.payNow} ${fmtMoney(total, lang)}`}
                  </button>
                  {payError && (
                    <p className="text-sm text-red-600 text-center">{payError}</p>
                  )}
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <span className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold text-gray-700 tracking-wider">VISA</span>
                      <span className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold text-gray-700 tracking-wider">MASTERCARD</span>
                      <span className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold text-gray-700 tracking-wider">AMEX</span>
                      <span className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold text-gray-700 tracking-wider">INTERAC</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Lock className="h-3.5 w-3.5" />
                      <span>{ti.securedByStripe}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact footer */}
          {org && (
            <div className="text-center py-2 space-y-1 no-print">
              <p className="text-xs text-gray-400">{ti.questionsContact.replace('{name}', org.name || '')}</p>
              <div className="flex items-center justify-center gap-5 text-xs text-gray-400">
                {org.email && (
                  <a href={`mailto:${org.email}`} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                    <Mail className="h-3.5 w-3.5" />{org.email}
                  </a>
                )}
                {org.phone && (
                  <a href={`tel:${org.phone}`} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                    <Phone className="h-3.5 w-3.5" />{org.phone}
                  </a>
                )}
              </div>
              {showBranding && (
                <p className="text-xs text-gray-300 pt-1">
                  {fr ? 'Propulsé par' : 'Powered by'} <a href="https://gestivio.ca" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">Gestivio</a>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function PublicInvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
      </div>
    }>
      <PublicInvoiceContent />
    </Suspense>
  )
}
