'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'
import { fmtMoney, fmtDate } from '@/lib/format'
import { getRecurrenceLabel, getBillingTypeLabel, getBillingFrequencyLabel } from '@/lib/contract-labels'
import { calculateRecurringDates } from '@/lib/recurring-dates'
import SignaturePad from '@/components/SignaturePad'
import {
  CheckCircle, FileText, Calendar, DollarSign, Loader2, Send,
  MessageSquare, Wrench, AlertCircle, Printer, ChevronDown, Shield,
} from 'lucide-react'

interface ContractData {
  id: string
  title: string
  description: string | null
  status: string
  start_date: string
  end_date: string
  recurrence_type: string
  recurrence_days: number[] | null
  service_name: string
  service_description: string | null
  price_per_visit: number
  total_price: number
  billing_type: string
  billing_frequency: string | null
  include_tps: boolean
  include_tvq: boolean
  approval_token: string
  notes: string | null
  org_id: string
  customers: { name: string; email: string | null; phone: string | null; address: string | null } | null
  owner_signature: string | null
  owner_signed_at: string | null
  owner_signed_name: string | null
  client_signature: string | null
  client_signed_at: string | null
  client_signed_name: string | null
  fully_executed_at: string | null
}

interface OrgData {
  name: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  tax_number: string | null
}

export default function ContractApprovalPage() {
  const { token } = useParams<{ token: string }>()
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const [contract, setContract] = useState<ContractData | null>(null)
  const [org, setOrg] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Signing state
  const [signed, setSigned] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signName, setSignName] = useState('')
  const [signEmail, setSignEmail] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)

  // Modification request state
  const [showModify, setShowModify] = useState(false)
  const [comments, setComments] = useState('')
  const [modifySent, setModifySent] = useState(false)

  const contractScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/contracts/public/${token}`)
      if (!res.ok) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const { contract: data, org: orgData } = await res.json()

      if (!data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setContract(data)

      // Pre-fill signing fields
      if (data.customers?.name) setSignName(data.customers.name)
      if (data.customers?.email) setSignEmail(data.customers.email)

      // Already signed by client?
      if (data.client_signed_at) {
        setSigned(true)
      }

      if (orgData) setOrg(orgData)
      setLoading(false)
    }
    load()
  }, [token])

  // Scroll detection
  const handleScroll = useCallback(() => {
    const el = contractScrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    if (atBottom) setScrolledToBottom(true)
  }, [])

  const handleSign = async () => {
    if (!signName.trim() || !signEmail.trim() || !signatureData || !confirmed || !contract) return
    setSigning(true)
    try {
      const res = await fetch(`/api/contracts/${contract.id}/client-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: signName.trim(),
          email: signEmail.trim(),
          signature: signatureData,
          confirmed: true,
        }),
      })
      if (res.ok) {
        setSigned(true)
        // Reload contract data to get signature info
        const refreshRes = await fetch(`/api/contracts/public/${token}`)
        if (refreshRes.ok) {
          const { contract: refreshed } = await refreshRes.json()
          if (refreshed) setContract(refreshed)
        }
      }
    } catch { /* ignore */ } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {fr ? 'Contrat introuvable' : 'Contract not found'}
          </h1>
          <p className="text-gray-500">
            {fr ? 'Ce lien est invalide ou expiré.' : 'This link is invalid or expired.'}
          </p>
        </div>
      </div>
    )
  }

  if (!contract) return null

  // Tax calculations
  const includeTps = contract.include_tps !== false
  const includeTvq = contract.include_tvq !== false
  const subtotal = contract.total_price || 0
  const tpsAmount = includeTps ? subtotal * 0.05 : 0
  const tvqAmount = includeTvq ? subtotal * 0.09975 : 0
  const totalWithTaxes = subtotal + tpsAmount + tvqAmount

  // Preview dates
  const previewDates = contract.start_date && contract.end_date
    ? calculateRecurringDates(contract.start_date, contract.end_date, contract.recurrence_type, contract.recurrence_days || []).slice(0, 5)
    : []

  const bizName = org?.name || 'Gestivio'

  const canSign = scrolledToBottom && confirmed && signatureData && signName.trim() && signEmail.trim()
  const isSigned = signed || !!contract.client_signed_at
  const isFullyExecuted = !!contract.fully_executed_at

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen {
          .print-view { display: none !important; }
        }
        @media print {
          @page { size: letter; margin: 0.5in; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; font-size: 10px !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .web-view, nav, header, .no-print { display: none !important; }
          .print-view {
            display: flex !important;
            flex-direction: column !important;
            min-height: 100vh !important;
            background: white !important;
            box-shadow: none !important; border: none !important; border-radius: 0 !important;
            padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important;
            line-height: 1.3 !important;
          }
          .print-footer { page-break-inside: avoid; margin-top: auto; }
          .contract-section, .pricing-table, .signature-block { page-break-inside: avoid; break-inside: avoid; }
        }
      `}} />

      {/* ===== PRINT VIEW ===== */}
      <div className="print-view" style={{ flexDirection: 'column', minHeight: '100vh', fontFamily: "-apple-system, 'Segoe UI', sans-serif", color: '#111', padding: 0, lineHeight: 1.3 }}>
        {/* Header — compact 60px max */}
        <div className="contract-section" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', maxHeight: '60px', overflow: 'hidden' }}>
          <div>
            {org?.logo_url && (
              <img src={org.logo_url} alt={bizName} style={{ maxWidth: '120px', maxHeight: '40px', objectFit: 'contain', display: 'block', marginBottom: '2px' }} />
            )}
            {!org?.logo_url && (
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '2px' }}>{bizName}</div>
            )}
            <div style={{ fontSize: '8px', color: '#555', lineHeight: 1.3 }}>
              {(() => {
                const addressLine = org?.address && org.address.includes(',')
                  ? org.address
                  : [org?.address, org?.city, org?.state, org?.zip].filter(Boolean).join(', ')
                return addressLine ? <>{addressLine}</> : null
              })()}
              {(org?.phone || org?.email) && (
                <>{org?.address ? <br /> : ''}{[org?.phone, org?.email].filter(Boolean).join(' \u00B7 ')}</>
              )}
              {org?.tax_number && <><br />TPS/TVQ: {org.tax_number}</>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '1px', color: '#111', marginBottom: '4px' }}>
              {fr ? 'CONTRAT DE SERVICE' : 'SERVICE CONTRACT'}
            </div>
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '4px 8px', textAlign: 'left', fontSize: '9px', lineHeight: 1.4 }}>
              <div><strong>{fr ? 'Contrat' : 'Contract'}:</strong> {contract.title}</div>
              <div><strong>{fr ? 'D\u00e9but' : 'Start'}:</strong> {fmtDate(contract.start_date, lang)} &mdash; <strong>{fr ? 'Fin' : 'End'}:</strong> {fmtDate(contract.end_date, lang)}</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '2px solid #000', marginBottom: '6px' }} />

        {/* Client — one line */}
        {contract.customers && (
          <div className="contract-section" style={{ marginBottom: '6px' }}>
            <div style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
              {fr ? 'CONTRAT POUR' : 'CONTRACT FOR'}
            </div>
            <div style={{ fontSize: '9px', color: '#333' }}>
              <strong>{contract.customers.name}</strong>
              {contract.customers.phone && <> &middot; {contract.customers.phone}</>}
              {contract.customers.email && <> &middot; {contract.customers.email}</>}
              {contract.customers.address && <> &middot; {contract.customers.address}</>}
            </div>
          </div>
        )}

        {/* Service description */}
        <div className="contract-section" style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
            {fr ? 'DESCRIPTION DU SERVICE' : 'SERVICE DESCRIPTION'}
          </div>
          <div style={{ fontSize: '9px', fontWeight: 600 }}>{contract.service_name}</div>
          {contract.service_description && (
            <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>{contract.service_description}</div>
          )}
        </div>

        {/* Schedule — one line */}
        <div className="contract-section" style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
            {fr ? 'HORAIRE' : 'SCHEDULE'}
          </div>
          <div style={{ fontSize: '9px', color: '#333', lineHeight: 1.3 }}>
            <div>
              {fr ? 'R\u00e9currence' : 'Recurrence'}: {getRecurrenceLabel(contract.recurrence_type, lang)} &middot; {fr ? 'P\u00e9riode' : 'Period'}: {fmtDate(contract.start_date, lang)} &mdash; {fmtDate(contract.end_date, lang)}
            </div>
            {previewDates.length > 0 && (
              <div>
                {fr ? 'Prochaines dates' : 'Next dates'}: {previewDates.map((d) => fmtDate(d, lang, 'short')).join(', ')}...
              </div>
            )}
          </div>
        </div>

        {/* Pricing table — compact */}
        <table className="pricing-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px' }}>
          <thead>
            <tr style={{ background: '#1f2937', color: 'white' }}>
              <th style={{ textAlign: 'left', padding: '3px 6px', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
              <th style={{ textAlign: 'right', padding: '3px 6px', fontSize: '8px', textTransform: 'uppercase', width: '100px' }}>{fr ? 'Prix/visite' : 'Price/visit'}</th>
              <th style={{ textAlign: 'right', padding: '3px 6px', fontSize: '8px', textTransform: 'uppercase', width: '100px' }}>{fr ? 'Sous-total' : 'Subtotal'}</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '3px 6px', fontSize: '9px' }}>{contract.service_name}</td>
              <td style={{ textAlign: 'right', padding: '3px 6px', fontSize: '9px' }}>{fmtMoney(contract.price_per_visit, lang)}</td>
              <td style={{ textAlign: 'right', padding: '3px 6px', fontSize: '9px', fontWeight: 600 }}>{fmtMoney(subtotal, lang)}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
          <div style={{ width: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '9px', color: '#555' }}>
              <span>{fr ? 'Sous-total' : 'Subtotal'}</span><span>{fmtMoney(subtotal, lang)}</span>
            </div>
            {includeTps && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '9px', color: '#555' }}>
                <span>TPS (5%)</span><span>{fmtMoney(tpsAmount, lang)}</span>
              </div>
            )}
            {includeTvq && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '9px', color: '#555' }}>
                <span>TVQ (9,975%)</span><span>{fmtMoney(tvqAmount, lang)}</span>
              </div>
            )}
            <div style={{ borderTop: '2px solid #000', marginTop: '4px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
              <span>TOTAL</span><span>{fmtMoney(totalWithTaxes, lang)}</span>
            </div>
          </div>
        </div>

        {/* Payment terms — one line */}
        <div className="contract-section" style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '9px', color: '#555' }}>
            {fr ? 'Facturation' : 'Billing'}: {getBillingTypeLabel(contract.billing_type, lang)}
            {contract.billing_frequency && (
              <> &middot; {fr ? 'Fr\u00e9quence' : 'Frequency'}: {getBillingFrequencyLabel(contract.billing_frequency, lang)}</>
            )}
          </div>
          {contract.notes && (
            <div style={{ fontSize: '8px', color: '#555', marginTop: '2px', fontStyle: 'italic' }}>{contract.notes}</div>
          )}
        </div>

        {/* Signature block — two columns, max 80px height */}
        <div className="signature-block" style={{ marginBottom: '6px', marginTop: '6px', maxHeight: '80px' }}>
          <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
            SIGNATURES
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Owner / Business */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                {fr ? `Pour ${bizName}` : `For ${bizName}`}
              </div>
              {contract.owner_signature ? (
                <>
                  <img src={contract.owner_signature} alt="Owner signature" style={{ maxWidth: '120px', maxHeight: '40px', objectFit: 'contain', display: 'block', marginBottom: '2px' }} />
                  <div style={{ borderBottom: '1px solid #000', width: '150px', marginBottom: '2px' }} />
                  <div style={{ fontSize: '9px', fontWeight: 600 }}>{contract.owner_signed_name}</div>
                  <div style={{ fontSize: '8px', color: '#666' }}>
                    {contract.owner_signed_at ? fmtDate(contract.owner_signed_at, lang) : ''}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ borderBottom: '1px solid #000', width: '150px', marginTop: '20px', marginBottom: '2px' }} />
                  <span style={{ fontSize: '8px', color: '#999', fontStyle: 'italic' }}>
                    {fr ? 'En attente de signature' : 'Awaiting signature'}
                  </span>
                </>
              )}
            </div>
            {/* Client */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Client
              </div>
              {contract.client_signature ? (
                <>
                  <img src={contract.client_signature} alt="Client signature" style={{ maxWidth: '120px', maxHeight: '40px', objectFit: 'contain', display: 'block', marginBottom: '2px' }} />
                  <div style={{ borderBottom: '1px solid #000', width: '150px', marginBottom: '2px' }} />
                  <div style={{ fontSize: '9px', fontWeight: 600 }}>{contract.client_signed_name}</div>
                  <div style={{ fontSize: '8px', color: '#666' }}>
                    {contract.client_signed_at ? fmtDate(contract.client_signed_at, lang) : ''}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ borderBottom: '1px solid #000', width: '150px', marginTop: '20px', marginBottom: '2px' }} />
                  <span style={{ fontSize: '8px', color: '#999', fontStyle: 'italic' }}>
                    {fr ? 'En attente de signature' : 'Awaiting signature'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer — legal ref pinned to bottom */}
        <div className="print-footer" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '7px', color: '#999' }}>
            {fr
              ? `Document sign\u00e9 \u00e9lectroniquement via Gestivio \u00B7 R\u00e9f: ${contract.id.slice(0, 8)}`
              : `Document signed electronically via Gestivio \u00B7 Ref: ${contract.id.slice(0, 8)}`}
          </div>
        </div>
      </div>

      {/* ===== WEB VIEW ===== */}
      <div className="web-view min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
                <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-base font-bold text-gray-900">{bizName}</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
              >
                <Printer className="h-3.5 w-3.5" />
                {fr ? 'Imprimer' : 'Print'}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          {isSigned ? (
            /* ===== SIGNED VIEW ===== */
            <div className="space-y-6">
              {/* Success banner */}
              {!isFullyExecuted && (
                <div className="rounded-2xl bg-white border border-gray-100 p-8 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {fr ? 'Contrat signé!' : 'Contract signed!'}
                  </h1>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {fr
                      ? `Votre signature a été enregistrée. Un email de confirmation a été envoyé à ${signEmail || contract.customers?.email || ''}.`
                      : `Your signature has been recorded. A confirmation email has been sent to ${signEmail || contract.customers?.email || ''}.`}
                  </p>
                </div>
              )}

              {isFullyExecuted && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <h2 className="text-lg font-bold text-emerald-800">
                    {fr ? 'Contrat entièrement signé' : 'Contract fully executed'}
                  </h2>
                  <p className="text-sm text-emerald-700 mt-1">
                    {fr
                      ? 'Les deux parties ont signé ce contrat.'
                      : 'Both parties have signed this contract.'}
                  </p>
                </div>
              )}

              {/* Contract details summary */}
              <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{contract.title}</h2>
                {contract.description && <p className="text-sm text-gray-600 mb-4">{contract.description}</p>}
                <div className="grid gap-3">
                  <InfoRow icon={FileText} label={fr ? 'Service' : 'Service'} value={contract.service_name} />
                  <InfoRow icon={Calendar} label={fr ? 'Période' : 'Period'} value={`${fmtDate(contract.start_date, lang)} - ${fmtDate(contract.end_date, lang)}`} />
                  <InfoRow icon={DollarSign} label="Total" value={fmtMoney(totalWithTaxes, lang)} />
                </div>
              </div>

              {/* Signature block */}
              <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                  {fr ? 'Signatures' : 'Signatures'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Owner signature */}
                  <div className="border border-gray-100 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
                      {fr ? `Pour ${bizName}` : `For ${bizName}`}
                    </p>
                    {contract.owner_signature ? (
                      <>
                        <img src={contract.owner_signature} alt="Owner signature" className="max-h-[60px] object-contain mb-2" />
                        <p className="text-sm font-medium text-gray-900">{contract.owner_signed_name}</p>
                        <p className="text-xs text-gray-500">
                          {contract.owner_signed_at ? fmtDate(contract.owner_signed_at, lang) : ''}
                        </p>
                      </>
                    ) : (
                      <div className="h-[60px] flex items-center justify-center">
                        <span className="text-xs text-gray-400 italic">
                          {fr ? 'En attente de signature' : 'Awaiting signature'}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Client signature */}
                  <div className="border border-gray-100 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Client</p>
                    {contract.client_signature ? (
                      <>
                        <img src={contract.client_signature} alt="Client signature" className="max-h-[60px] object-contain mb-2" />
                        <p className="text-sm font-medium text-gray-900">{contract.client_signed_name}</p>
                        <p className="text-xs text-gray-500">
                          {contract.client_signed_at ? fmtDate(contract.client_signed_at, lang) : ''}
                        </p>
                      </>
                    ) : (
                      <div className="h-[60px] flex items-center justify-center">
                        <span className="text-xs text-gray-400 italic">
                          {fr ? 'En attente de signature' : 'Awaiting signature'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-4">
                  {fr
                    ? `Document sign\u00e9 \u00e9lectroniquement via Gestivio \u00B7 R\u00e9f: ${contract.id.slice(0, 8)}`
                    : `Document signed electronically via Gestivio \u00B7 Ref: ${contract.id.slice(0, 8)}`}
                </p>
              </div>

              {/* Print button */}
              <div className="text-center">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
                >
                  <Printer className="h-4 w-4" />
                  {fr ? 'Imprimer le contrat' : 'Print contract'}
                </button>
              </div>
            </div>
          ) : (
            /* ===== SIGNING FLOW ===== */
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {fr ? 'Contrat de service' : 'Service contract'}
                </h1>
                <p className="text-gray-500">
                  {fr
                    ? `${bizName} vous propose le contrat suivant`
                    : `${bizName} is proposing the following contract`}
                </p>
              </div>

              {/* 1. Contract review (scrollable) */}
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {fr ? '1. Lire le contrat' : '1. Review the contract'}
                  </h2>
                  {!scrolledToBottom && (
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-600 animate-pulse">
                      <ChevronDown className="h-3.5 w-3.5" />
                      {fr ? 'Faites défiler pour lire le contrat' : 'Scroll to read the contract'}
                    </span>
                  )}
                  {scrolledToBottom && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {fr ? 'Lu' : 'Read'}
                    </span>
                  )}
                </div>
                <div
                  ref={contractScrollRef}
                  onScroll={handleScroll}
                  className="max-h-[400px] overflow-y-auto p-6 space-y-4"
                >
                  <h3 className="text-lg font-bold text-gray-900">{contract.title}</h3>
                  {contract.description && <p className="text-sm text-gray-600">{contract.description}</p>}

                  <div className="grid gap-3">
                    <InfoRow icon={FileText} label={fr ? 'Service' : 'Service'} value={contract.service_name} />
                    {contract.service_description && (
                      <InfoRow icon={FileText} label={fr ? 'Détails' : 'Details'} value={contract.service_description} />
                    )}
                    <InfoRow icon={Calendar} label={fr ? 'Période' : 'Period'} value={`${fmtDate(contract.start_date, lang)} - ${fmtDate(contract.end_date, lang)}`} />
                    <InfoRow icon={Calendar} label={fr ? 'Fréquence' : 'Frequency'} value={getRecurrenceLabel(contract.recurrence_type, lang)} />
                  </div>

                  {/* Price breakdown */}
                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-indigo-600" />
                      {fr ? 'Tarification' : 'Pricing'}
                    </h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{fr ? 'Prix par visite' : 'Price per visit'}</span>
                      <span className="font-medium text-gray-900">{fmtMoney(contract.price_per_visit, lang)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{fr ? 'Sous-total' : 'Subtotal'}</span>
                      <span className="font-medium text-gray-900">{fmtMoney(subtotal, lang)}</span>
                    </div>
                    {includeTps && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">TPS (5%)</span>
                        <span className="text-gray-700">{fmtMoney(tpsAmount, lang)}</span>
                      </div>
                    )}
                    {includeTvq && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">TVQ (9,975%)</span>
                        <span className="text-gray-700">{fmtMoney(tvqAmount, lang)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-100 pt-2 flex justify-between text-base font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-indigo-600">{fmtMoney(totalWithTaxes, lang)}</span>
                    </div>
                  </div>

                  {/* Billing terms */}
                  <div className="border-t border-gray-100 pt-4 text-sm text-gray-600">
                    <p>{fr ? 'Facturation' : 'Billing'}: {getBillingTypeLabel(contract.billing_type, lang)}
                      {contract.billing_frequency && ` - ${getBillingFrequencyLabel(contract.billing_frequency, lang)}`}
                    </p>
                  </div>

                  {contract.notes && (
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Notes</h4>
                      <p className="text-sm text-gray-600">{contract.notes}</p>
                    </div>
                  )}

                  {/* Preview dates */}
                  {previewDates.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        {fr ? 'Premières dates prévues' : 'First scheduled dates'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {previewDates.map((d) => (
                          <span key={d} className="px-2 py-1 rounded-lg bg-gray-50 text-xs text-gray-600">
                            {fmtDate(d, lang, 'short')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Owner signature if present */}
                  {contract.owner_signature && (
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        {fr ? `Signé par ${bizName}` : `Signed by ${bizName}`}
                      </h4>
                      <img src={contract.owner_signature} alt="Owner signature" className="max-h-[50px] object-contain mb-1" />
                      <p className="text-xs text-gray-500">
                        {contract.owner_signed_name} - {contract.owner_signed_at ? fmtDate(contract.owner_signed_at, lang) : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Identity section */}
              <div className={`rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-4 transition-opacity ${scrolledToBottom ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <h2 className="text-sm font-semibold text-gray-900">
                  {fr ? '2. Vos informations' : '2. Your information'}
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {fr ? 'Nom complet' : 'Full name'} *
                  </label>
                  <input
                    type="text"
                    value={signName}
                    onChange={(e) => setSignName(e.target.value)}
                    placeholder={fr ? 'Prénom et nom' : 'First and last name'}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {fr ? 'Courriel' : 'Email'} *
                  </label>
                  <input
                    type="email"
                    value={signEmail}
                    readOnly={!!contract.customers?.email}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 outline-none"
                  />
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">
                    {fr
                      ? 'Je confirme avoir lu et compris ce contrat'
                      : 'I confirm that I have read and understood this contract'}
                  </span>
                </label>
              </div>

              {/* 3. Signature section */}
              <div className={`rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-4 transition-opacity ${scrolledToBottom ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <h2 className="text-sm font-semibold text-gray-900">
                  {fr ? '3. Votre signature' : '3. Your signature'}
                </h2>
                <SignaturePad
                  onSave={(dataUrl) => setSignatureData(dataUrl)}
                  onClear={() => setSignatureData(null)}
                />
                {signatureData && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {fr ? 'Signature enregistrée' : 'Signature captured'}
                  </p>
                )}
                <div className="flex items-start gap-2 mt-3">
                  <Shield className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-400">
                    {fr
                      ? 'En signant ce document, vous consentez à utiliser une signature électronique conformément aux lois canadiennes applicables (Loi concernant le cadre juridique des technologies de l\'information du Québec).'
                      : 'By signing this document, you consent to using an electronic signature in accordance with applicable Canadian laws (Quebec Act to establish a legal framework for information technology).'}
                  </p>
                </div>
              </div>

              {/* 4. Submit button */}
              <button
                onClick={handleSign}
                disabled={!canSign || signing}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {fr ? 'Signer et approuver le contrat' : 'Sign and approve the contract'}
              </button>

              {/* Request modifications */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowModify(!showModify)}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {fr ? 'Demander des modifications' : 'Request modifications'}
                </button>
              </div>

              {showModify && !modifySent && (
                <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-3">
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                    placeholder={fr ? 'Décrivez les modifications souhaitées...' : 'Describe the changes you would like...'}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => setModifySent(true)}
                    disabled={!comments.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {fr ? 'Envoyer la demande' : 'Send request'}
                  </button>
                </div>
              )}
              {modifySent && (
                <p className="text-sm text-emerald-600 text-center">
                  {fr ? 'Votre demande a été envoyée.' : 'Your request has been sent.'}
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8 pb-8">
            <p className="text-xs text-gray-400">
              {fr ? 'Propulsé par' : 'Powered by'}{' '}
              <a href="https://gestivio.ca" className="text-indigo-500 hover:underline">Gestivio</a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  )
}
