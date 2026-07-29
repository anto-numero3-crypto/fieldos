'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Clock, FileSignature, Wallet, Printer, Loader2 } from 'lucide-react'
import { fmtMoney, fmtDate } from '@/lib/format'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'
import { secureUrl } from '@/lib/secure-url'
import { getPlanLimits, normalizePlan } from '@/lib/plan-limits'

interface LineItem { id?: string; description: string; qty: number; unit_price: number }
interface PublicQuote {
  id: string
  user_id: string
  title: string
  quote_number: string | null
  status: string
  line_items: LineItem[]
  subtotal: number
  tax_rate: number | null
  tax_amount: number | null
  total: number
  valid_until: string | null
  notes: string | null
  created_at: string
  sent_at: string | null
  accepted_at: string | null
  deposit_required: boolean | null
  deposit_type: 'fixed' | 'percentage' | null
  deposit_value: number | null
  deposit_taxes_included: boolean | null
  deposit_amount: number | null
  deposit_paid_at: string | null
  token: string
  customers: { name: string; email?: string; phone?: string; address?: string } | null
}
interface OrgData {
  name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  logo_url: string | null
  stripe_connect_charges_enabled: boolean | null
  plan?: string | null
  tps_number: string | null
  tvq_number: string | null
  neq_number?: string | null
  rbq_number?: string | null
  cmeq_number?: string | null
  cmmtq_number?: string | null
  other_licence_name?: string | null
  other_licence_number?: string | null
}

export default function PublicQuotePage() {
  const { token } = useParams<{ token: string }>()
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const [quote, setQuote] = useState<PublicQuote | null>(null)
  const [org, setOrg] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [acting, setActing] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/quotes/public/${token}`)
        if (!res.ok) { setNotFound(true); return }
        const data = await res.json()
        setQuote(data.quote as PublicQuote)
        setOrg(data.org as OrgData)
        setAccepted(!!data.quote?.accepted_at || !!data.quote?.deposit_paid_at)
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const handlePayDeposit = async () => {
    if (!quote) return
    setActing(true); setError(null)
    try {
      const res = await fetch('/api/stripe/deposit-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'quote', token }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
      setActing(false)
    }
  }

  const handleAcceptNoDeposit = async () => {
    if (!quote) return
    setActing(true); setError(null)
    try {
      const res = await fetch(`/api/quotes/public/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Accept failed')
      setAccepted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }
  if (notFound || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-900">
            <FileSignature className="h-6 w-6 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{fr ? 'Devis introuvable' : 'Quote not found'}</h1>
          <p className="text-sm text-gray-500">{fr ? 'Ce lien a peut-être expiré.' : 'This link may have expired.'}</p>
        </div>
      </div>
    )
  }

  const justPaid = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('paid') === 'true'
  const depositPaid = !!quote.deposit_paid_at || justPaid
  const lineItems = (quote.line_items || []).filter((li) => li.description?.trim())
  const bizName = org?.name || ''
  const hasLogo = !!org?.logo_url
  const quoteNumber = quote.quote_number || `DEV-${quote.id.slice(0, 8).toUpperCase()}`
  const showBranding = getPlanLimits(normalizePlan(org?.plan)).showGestivioBranding

  const orgAddressLine = org?.address
    ? org.address.includes(',')
      ? org.address
      : [org.address, org.city, org.state, org.zip].filter(Boolean).join(', ')
    : [org?.city, org?.state, org?.zip].filter(Boolean).join(', ')

  const taxLine = [
    org?.tps_number && `N° TPS: ${org.tps_number}`,
    org?.tvq_number && `N° TVQ: ${org.tvq_number}`,
    org?.neq_number && `NEQ: ${org.neq_number}`,
  ].filter(Boolean).join(' · ')

  const licenceLine = [
    org?.rbq_number && `RBQ: ${org.rbq_number}`,
    org?.cmeq_number && `CMEQ: ${org.cmeq_number}`,
    org?.cmmtq_number && `CMMTQ: ${org.cmmtq_number}`,
    org?.other_licence_name && org?.other_licence_number && `${org.other_licence_name}: ${org.other_licence_number}`,
  ].filter(Boolean).join(' · ')

  const statusLabel = accepted || depositPaid
    ? (fr ? 'Accepté' : 'Accepted')
    : (fr ? 'En attente' : 'Pending')

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 print:!bg-white print:!p-0 print:!m-0">
        {/* ═══════ PRINT-ONLY PROFESSIONAL QUOTE ═══════ */}
        <div className="print-only" style={{ fontFamily: "-apple-system, 'Segoe UI', sans-serif", color: '#111', position: 'relative' }}>

          {(accepted || depositPaid) && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-35deg)', fontSize: '60pt', fontWeight: 800, color: '#16a34a', opacity: 0.08, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              {fr ? 'ACCEPTÉ' : 'ACCEPTED'}
            </div>
          )}

          {/* HEADER: two columns */}
          <div className="print-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '60%' }}>
              {hasLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={secureUrl(org!.logo_url!)} alt={bizName} style={{ maxWidth: '95px', maxHeight: '32px', objectFit: 'contain', display: 'block', marginBottom: '2px' }} />
              ) : (
                <div style={{ fontSize: '13pt', fontWeight: 800, marginBottom: '1px' }}>{bizName}</div>
              )}
              {orgAddressLine && <div style={{ fontSize: '7.5pt', color: '#555' }}>{orgAddressLine}</div>}
              {(org?.phone || org?.email) && (
                <div style={{ fontSize: '7.5pt', color: '#555' }}>
                  {[org?.phone, org?.email].filter(Boolean).join(' · ')}
                </div>
              )}
              {taxLine && <div style={{ fontSize: '7pt', color: '#888' }}>{taxLine}</div>}
              {licenceLine && <div style={{ fontSize: '7pt', color: '#888' }}>{licenceLine}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18pt', fontWeight: 800, letterSpacing: '2px', color: '#111', marginBottom: '4px' }}>
                {fr ? 'DEVIS' : 'QUOTE'}
              </div>
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '3px 6px', textAlign: 'left', fontSize: '8pt', lineHeight: 1.5 }}>
                <div><strong>{fr ? 'Numéro' : 'Number'}:</strong> {quoteNumber}</div>
                <div><strong>Date:</strong> {fmtDate(quote.created_at, lang)}</div>
                {quote.valid_until && <div><strong>{fr ? 'Valide jusqu\'au' : 'Valid until'}:</strong> {fmtDate(quote.valid_until, lang)}</div>}
                <div><strong>{fr ? 'Statut' : 'Status'}:</strong> {statusLabel}</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1.5px solid #000', margin: '3px 0' }} />

          {/* QUOTE FOR */}
          {quote.customers && (
            <div className="print-section" style={{ marginBottom: '4px' }}>
              <div style={{ fontSize: '6pt', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1px' }}>
                {fr ? 'DEVIS POUR' : 'QUOTE FOR'}
              </div>
              <div style={{ fontSize: '9.5pt', fontWeight: 700 }}>{quote.customers.name}</div>
              <div style={{ fontSize: '8pt', color: '#555' }}>
                {[quote.customers.address, quote.customers.phone, quote.customers.email].filter(Boolean).join(' · ')}
              </div>
            </div>
          )}

          {/* TITLE */}
          <div className="print-section" style={{ fontSize: '10.5pt', fontWeight: 700, margin: '6px 0 4px' }}>{quote.title}</div>

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
              {(lineItems.length > 0 ? lineItems : [{ description: quote.title || 'Services', qty: 1, unit_price: quote.subtotal } as LineItem]).map((li, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 ? '#fafafa' : 'white' }}>
                  <td style={{ padding: '3px 6px', fontSize: '8.5pt' }}>{li.description}</td>
                  <td style={{ textAlign: 'center', padding: '3px 6px', fontSize: '8.5pt' }}>{li.qty}</td>
                  <td style={{ textAlign: 'right', padding: '3px 6px', fontSize: '8.5pt' }}>{fmtMoney(li.unit_price, lang)}</td>
                  <td style={{ textAlign: 'right', padding: '3px 6px', fontSize: '8.5pt', fontWeight: 600 }}>{fmtMoney((li.qty || 1) * (li.unit_price || 0), lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS */}
          <div className="print-section" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
            <div style={{ width: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '9pt', color: '#555' }}>
                <span>{fr ? 'Sous-total' : 'Subtotal'}</span><span>{fmtMoney(quote.subtotal, lang)}</span>
              </div>
              {(quote.tax_amount || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '9pt', color: '#555' }}>
                  <span>{fr ? 'Taxes' : 'Taxes'}{quote.tax_rate ? ` (${quote.tax_rate}%)` : ''}</span><span>{fmtMoney(quote.tax_amount || 0, lang)}</span>
                </div>
              )}
              <div style={{ borderTop: '2px solid #000', marginTop: '4px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '11pt', fontWeight: 800 }}>
                <span>TOTAL</span><span>{fmtMoney(quote.total, lang)}</span>
              </div>
              {quote.deposit_required && (quote.deposit_amount || 0) > 0 && (
                <div style={{ marginTop: '6px', border: '1px solid #ddd', borderRadius: '4px', padding: '5px 8px' }}>
                  <div style={{ fontSize: '7pt', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                    {fr ? 'Acompte requis' : 'Required deposit'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5pt', fontWeight: 700 }}>
                    <span>{fmtMoney(quote.deposit_amount || 0, lang)}</span>
                    {quote.deposit_paid_at && <span style={{ color: '#16a34a', fontSize: '8pt' }}>{fr ? 'Payé' : 'Paid'}</span>}
                  </div>
                  <div style={{ fontSize: '7pt', color: '#888', marginTop: '2px' }}>
                    {fr
                      ? `Solde de ${fmtMoney(Math.max(0, quote.total - (quote.deposit_amount || 0)), lang)} facturé à la fin du travail.`
                      : `Balance of ${fmtMoney(Math.max(0, quote.total - (quote.deposit_amount || 0)), lang)} invoiced when work is complete.`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STATUS BADGE */}
          <div className="print-section">
            {accepted || depositPaid ? (
              <div style={{ border: '2px solid #16a34a', borderRadius: '4px', background: '#f0fdf4', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '9pt' }}>&#10003; {fr ? 'ACCEPTÉ' : 'ACCEPTED'}</span>
              </div>
            ) : (
              <div style={{ border: '2px solid #111', borderRadius: '4px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '9pt' }}>{fr ? 'EN ATTENTE D’ACCEPTATION' : 'PENDING ACCEPTANCE'}</span>
              </div>
            )}
          </div>

          {/* NOTES */}
          {quote.notes && (
            <div className="print-section" style={{ borderLeft: '3px solid #ddd', padding: '4px 8px', marginBottom: '6px', background: '#fafafa' }}>
              <div style={{ fontSize: '7pt', fontWeight: 700, color: '#888', marginBottom: '2px' }}>Notes</div>
              <div style={{ fontSize: '8pt', color: '#555', whiteSpace: 'pre-wrap' }}>{quote.notes}</div>
            </div>
          )}

          {/* FOOTER */}
          <div className="print-footer" style={{ borderTop: '1px solid #ddd', paddingTop: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '8pt', color: '#888', fontStyle: 'italic', marginBottom: '2px' }}>
              {fr ? 'Merci pour votre confiance.' : 'Thank you for your business.'}
            </div>
            <div style={{ fontSize: '7pt', color: '#999' }}>
              {bizName}{org?.phone ? ` · ${org.phone}` : ''}{org?.email ? ` · ${org.email}` : ''}
            </div>
            {showBranding && (
              <div style={{ fontSize: '7pt', color: '#ccc', marginTop: '4px' }}>
                {fr ? 'Devis généré via Gestivio · gestivio.ca' : 'Quote generated via Gestivio · gestivio.ca'}
              </div>
            )}
          </div>
        </div>

        {/* ══════════ SCREEN-ONLY VIEW ══════════ */}
        <div className="screen-only max-w-3xl mx-auto px-4 py-8 sm:py-12">
          <div className="fixed top-4 right-4 z-10"><LanguageToggle /></div>

          {depositPaid && (
            <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    {fr ? 'Acompte versé — Merci !' : 'Deposit paid — Thank you!'}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {fr ? "Nous vous contacterons sous peu pour planifier l'intervention." : "We'll contact you shortly to schedule the work."}
                  </p>
                </div>
              </div>
            </div>
          )}
          {accepted && !quote.deposit_required && (
            <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  {fr ? 'Devis accepté — Merci !' : 'Quote accepted — Thank you!'}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
              <div>
                {hasLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={secureUrl(org!.logo_url!)} alt={org?.name || ''} className="h-10 mb-3" />
                )}
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{org?.name}</p>
                {orgAddressLine && <p className="text-xs text-gray-500">{orgAddressLine}</p>}
                {org?.email && <p className="text-xs text-gray-500">{org.email}</p>}
                {taxLine && <p className="text-[11px] text-gray-400 mt-1">{taxLine}</p>}
                {licenceLine && <p className="text-[11px] text-gray-400">{licenceLine}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">{fr ? 'Devis' : 'Quote'}</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{quoteNumber}</p>
                {quote.valid_until && (
                  <p className="text-[11px] text-gray-400 mt-1">{fr ? 'Valide jusqu\'au' : 'Valid until'} {fmtDate(quote.valid_until, lang)}</p>
                )}
              </div>
            </div>

            {/* Customer */}
            <div className="px-6 sm:px-8 py-4 border-b border-gray-100 dark:border-gray-800">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{fr ? 'Devis pour' : 'Quote for'}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{quote.customers?.name}</p>
              {quote.customers?.email && <p className="text-xs text-gray-500">{quote.customers.email}</p>}
              {quote.customers?.phone && <p className="text-xs text-gray-500">{quote.customers.phone}</p>}
            </div>

            {/* Title */}
            <div className="px-6 sm:px-8 py-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{quote.title}</h1>
            </div>

            {/* Line items */}
            <div className="px-6 sm:px-8 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] uppercase tracking-wider text-gray-400">
                      <th className="text-left py-2 pr-2 font-semibold">{fr ? 'Description' : 'Description'}</th>
                      <th className="text-right py-2 px-2 font-semibold w-16">{fr ? 'Qté' : 'Qty'}</th>
                      <th className="text-right py-2 px-2 font-semibold w-24">{fr ? 'Prix unit.' : 'Unit price'}</th>
                      <th className="text-right py-2 pl-2 font-semibold w-24">{fr ? 'Total' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.line_items.map((it, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50">
                        <td className="py-2.5 pr-2 text-gray-800 dark:text-gray-200">{it.description}</td>
                        <td className="py-2.5 px-2 text-right text-gray-600 dark:text-gray-400">{it.qty}</td>
                        <td className="py-2.5 px-2 text-right text-gray-600 dark:text-gray-400">{fmtMoney(it.unit_price, lang)}</td>
                        <td className="py-2.5 pl-2 text-right font-medium text-gray-900 dark:text-white">{fmtMoney(it.qty * it.unit_price, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="w-full sm:w-72 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{fr ? 'Sous-total' : 'Subtotal'}</span>
                    <span className="text-gray-900 dark:text-white">{fmtMoney(quote.subtotal, lang)}</span>
                  </div>
                  {(quote.tax_amount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{fr ? 'Taxes' : 'Taxes'} ({quote.tax_rate}%)</span>
                      <span className="text-gray-900 dark:text-white">{fmtMoney(quote.tax_amount || 0, lang)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-white">{fr ? 'Total' : 'Total'}</span>
                    <span className="text-gray-900 dark:text-white">{fmtMoney(quote.total, lang)}</span>
                  </div>

                  {quote.deposit_required && (quote.deposit_amount || 0) > 0 && (
                    <div className="mt-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-1">
                        <Wallet className="h-3.5 w-3.5" /> {fr ? 'Acompte requis' : 'Required deposit'}
                      </div>
                      <div className="flex justify-between text-lg font-bold text-violet-900 dark:text-violet-200">
                        <span>{fmtMoney(quote.deposit_amount || 0, lang)}</span>
                      </div>
                      <p className="text-[11px] text-violet-700 dark:text-violet-400 mt-1">
                        {fr
                          ? `Le solde de ${fmtMoney(Math.max(0, quote.total - (quote.deposit_amount || 0)), lang)} sera facturé à la fin du travail.`
                          : `Balance of ${fmtMoney(Math.max(0, quote.total - (quote.deposit_amount || 0)), lang)} will be invoiced when work is complete.`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {quote.notes && (
                <div className="mt-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{fr ? 'Notes' : 'Notes'}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{quote.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {!accepted && !depositPaid && (
              <div className="border-t border-gray-100 dark:border-gray-800 px-6 sm:px-8 py-5 bg-gray-50/50 dark:bg-gray-900/50 no-print">
                {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                {quote.deposit_required && (quote.deposit_amount || 0) > 0 ? (
                  <>
                    {!org?.stripe_connect_charges_enabled ? (
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                        {fr
                          ? 'Ce prestataire n\'a pas encore activé les paiements en ligne. Veuillez le contacter directement.'
                          : 'This provider has not yet enabled online payments. Please contact them directly.'}
                      </div>
                    ) : (
                      <button
                        onClick={handlePayDeposit}
                        disabled={acting}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60 transition-all"
                      >
                        {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                        {fr ? `Accepter et payer l'acompte de ${fmtMoney(quote.deposit_amount || 0, lang)}` : `Accept & pay deposit of ${fmtMoney(quote.deposit_amount || 0, lang)}`}
                      </button>
                    )}
                    <p className="text-[11px] text-gray-400 text-center mt-2">{fr ? 'Paiement sécurisé par Stripe' : 'Secure payment by Stripe'}</p>
                  </>
                ) : (
                  <button
                    onClick={handleAcceptNoDeposit}
                    disabled={acting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition-all"
                  >
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    {fr ? 'Accepter le devis' : 'Accept the quote'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400 no-print">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 hover:text-gray-600">
              <Printer className="h-3.5 w-3.5" /> {fr ? 'Imprimer / PDF' : 'Print / PDF'}
            </button>
            {quote.sent_at && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {fr ? 'Envoyé le' : 'Sent'} {fmtDate(quote.sent_at, lang)}
              </span>
            )}
          </div>
          {showBranding && (
            <p className="text-center text-xs text-gray-300 mt-4 no-print">
              {fr ? 'Propulsé par' : 'Powered by'} <a href="https://gestivio.ca" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">Gestivio</a>
            </p>
          )}
        </div>
      </div>
    </>
  )
}
