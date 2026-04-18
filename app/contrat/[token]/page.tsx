'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'
import { fmtMoney, fmtDate } from '@/lib/format'
import { getRecurrenceLabel, getBillingTypeLabel, getBillingFrequencyLabel } from '@/lib/contract-labels'
import { calculateRecurringDates } from '@/lib/recurring-dates'
import {
  CheckCircle, FileText, Calendar, DollarSign, Loader2, Send,
  MessageSquare, Wrench, AlertCircle, Printer,
} from 'lucide-react'

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

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
  const [approved, setApproved] = useState(false)
  const [approving, setApproving] = useState(false)
  const [name, setName] = useState('')
  const [showModify, setShowModify] = useState(false)
  const [comments, setComments] = useState('')
  const [modifySent, setModifySent] = useState(false)

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

      if (['approved', 'active'].includes(data.status)) {
        setApproved(true)
      }

      if (orgData) setOrg(orgData)
      setLoading(false)
    }
    load()
  }, [token])

  const handleApprove = async () => {
    if (!name.trim() || !contract) return
    setApproving(true)
    try {
      const res = await fetch(`/api/contracts/${contract.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim() }),
      })
      if (res.ok) {
        setApproved(true)
      }
    } catch { /* ignore */ } finally {
      setApproving(false)
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
            {fr ? 'Ce lien est invalide ou expir\u00e9.' : 'This link is invalid or expired.'}
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen {
          .print-view { display: none !important; }
        }
        @media print {
          @page { size: letter; margin: 0.6in; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .web-view, nav, header, .no-print { display: none !important; }
          .print-view {
            display: flex !important;
            flex-direction: column !important;
            min-height: 100vh !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .print-footer { page-break-inside: avoid; margin-top: auto; }
        }
      `}} />

      {/* ===== PRINT VIEW ===== */}
      <div className="print-view" style={{ flexDirection: 'column', minHeight: '100vh', fontFamily: "-apple-system, 'Segoe UI', sans-serif", color: '#111', padding: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            {org?.logo_url && (
              <img src={org.logo_url} alt={bizName} style={{ maxWidth: '180px', maxHeight: '80px', objectFit: 'contain', marginBottom: '8px', display: 'block' }} />
            )}
            {!org?.logo_url && (
              <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>{bizName}</div>
            )}
            <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.6 }}>
              {org?.address && <>{org.address}<br /></>}
              {(org?.city || org?.state || org?.zip) && <>{[org?.city, org?.state].filter(Boolean).join(', ')} {org?.zip}</>}
              {org?.phone && <><br />{org.phone}</>}
              {org?.email && <><br />{org.email}</>}
              {org?.tax_number && <><br />TPS/TVQ: {org.tax_number}</>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '2px', color: '#111', marginBottom: '12px' }}>
              {fr ? 'CONTRAT DE SERVICE' : 'SERVICE CONTRACT'}
            </div>
            <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '12px 16px', textAlign: 'left', fontSize: '12px', lineHeight: 1.8 }}>
              <div><strong>{fr ? 'Contrat' : 'Contract'}:</strong> {contract.title}</div>
              <div><strong>{fr ? 'D\u00e9but' : 'Start'}:</strong> {fmtDate(contract.start_date, lang)}</div>
              <div><strong>{fr ? 'Fin' : 'End'}:</strong> {fmtDate(contract.end_date, lang)}</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '2px solid #000', marginBottom: '20px' }} />

        {/* Client */}
        {contract.customers && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              {fr ? 'CLIENT' : 'CLIENT'}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>{contract.customers.name}</div>
            {contract.customers.address && <div style={{ fontSize: '11px', color: '#555' }}>{contract.customers.address}</div>}
            {contract.customers.phone && <div style={{ fontSize: '11px', color: '#555' }}>{contract.customers.phone}</div>}
            {contract.customers.email && <div style={{ fontSize: '11px', color: '#555' }}>{contract.customers.email}</div>}
          </div>
        )}

        {/* Service description */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            {fr ? 'DESCRIPTION DU SERVICE' : 'SERVICE DESCRIPTION'}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>{contract.service_name}</div>
          {contract.service_description && (
            <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{contract.service_description}</div>
          )}
        </div>

        {/* Schedule */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            {fr ? 'HORAIRE' : 'SCHEDULE'}
          </div>
          <div style={{ fontSize: '12px', color: '#333', lineHeight: 1.8 }}>
            <div>{fr ? 'R\u00e9currence' : 'Recurrence'}: {getRecurrenceLabel(contract.recurrence_type, lang)}</div>
            <div>{fr ? 'P\u00e9riode' : 'Period'}: {fmtDate(contract.start_date, lang)} - {fmtDate(contract.end_date, lang)}</div>
            {previewDates.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontWeight: 600 }}>{fr ? 'Premi\u00e8res dates:' : 'First dates:'}</span>{' '}
                {previewDates.map((d) => fmtDate(d, lang, 'short')).join(', ')}
                ...
              </div>
            )}
          </div>
        </div>

        {/* Pricing table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ background: '#1f2937', color: 'white' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '10px', textTransform: 'uppercase', width: '120px' }}>{fr ? 'Prix/visite' : 'Price/visit'}</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '10px', textTransform: 'uppercase', width: '120px' }}>{fr ? 'Sous-total' : 'Subtotal'}</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px 12px', fontSize: '12px' }}>{contract.service_name}</td>
              <td style={{ textAlign: 'right', padding: '10px 12px', fontSize: '12px' }}>{fmtMoney(contract.price_per_visit, lang)}</td>
              <td style={{ textAlign: 'right', padding: '10px 12px', fontSize: '12px', fontWeight: 600 }}>{fmtMoney(subtotal, lang)}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <div style={{ width: '250px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#555' }}>
              <span>{fr ? 'Sous-total' : 'Subtotal'}</span><span>{fmtMoney(subtotal, lang)}</span>
            </div>
            {includeTps && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#555' }}>
                <span>TPS (5%)</span><span>{fmtMoney(tpsAmount, lang)}</span>
              </div>
            )}
            {includeTvq && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#555' }}>
                <span>TVQ (9,975%)</span><span>{fmtMoney(tvqAmount, lang)}</span>
              </div>
            )}
            <div style={{ borderTop: '2px solid #000', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800 }}>
              <span>TOTAL</span><span>{fmtMoney(totalWithTaxes, lang)}</span>
            </div>
          </div>
        </div>

        {/* Payment terms */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            {fr ? 'MODALIT\u00c9S DE PAIEMENT' : 'PAYMENT TERMS'}
          </div>
          <div style={{ fontSize: '12px', color: '#555' }}>
            {fr ? `Facturation: ${getBillingTypeLabel(contract.billing_type, lang)}` : `Billing: ${getBillingTypeLabel(contract.billing_type, lang)}`}
            {contract.billing_frequency && (
              <span> - {fr ? 'Fr\u00e9quence' : 'Frequency'}: {getBillingFrequencyLabel(contract.billing_frequency, lang)}</span>
            )}
          </div>
          {contract.notes && (
            <div style={{ fontSize: '11px', color: '#555', marginTop: '8px', fontStyle: 'italic' }}>{contract.notes}</div>
          )}
        </div>

        {/* Signature lines */}
        <div style={{ display: 'flex', gap: '60px', marginBottom: '24px', marginTop: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: '1px solid #999', height: '40px' }} />
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              {fr ? 'Signature du client' : 'Client signature'}
            </div>
            <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>Date: _______________</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: '1px solid #999', height: '40px' }} />
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              {fr ? 'Signature de l\'entreprise' : 'Business signature'}
            </div>
            <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>Date: _______________</div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div className="print-footer" style={{ borderTop: '1px solid #ddd', paddingTop: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', marginBottom: '4px' }}>
            {fr ? 'Merci pour votre confiance.' : 'Thank you for your business.'}
          </div>
          <div style={{ fontSize: '10px', color: '#999' }}>
            {bizName}{org?.phone ? ` \u00B7 ${org.phone}` : ''}{org?.email ? ` \u00B7 ${org.email}` : ''}
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
          {approved ? (
            <div className="rounded-2xl bg-white border border-gray-100 p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {fr ? 'Contrat approuv\u00e9!' : 'Contract approved!'}
              </h1>
              <p className="text-gray-500 max-w-md mx-auto">
                {fr
                  ? `Merci! Le contrat "${contract.title}" a \u00e9t\u00e9 approuv\u00e9 avec succ\u00e8s. ${bizName} vous contactera bient\u00f4t.`
                  : `Thank you! The contract "${contract.title}" has been approved successfully. ${bizName} will be in touch soon.`}
              </p>
            </div>
          ) : (
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

              {/* Contract info */}
              <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-gray-900">{contract.title}</h2>
                {contract.description && (
                  <p className="text-sm text-gray-600">{contract.description}</p>
                )}

                <div className="grid gap-3">
                  <InfoRow icon={FileText} label={fr ? 'Service' : 'Service'} value={contract.service_name} />
                  {contract.service_description && (
                    <InfoRow icon={FileText} label={fr ? 'D\u00e9tails' : 'Details'} value={contract.service_description} />
                  )}
                  <InfoRow icon={Calendar} label={fr ? 'P\u00e9riode' : 'Period'} value={`${fmtDate(contract.start_date, lang)} - ${fmtDate(contract.end_date, lang)}`} />
                  <InfoRow icon={Calendar} label={fr ? 'Fr\u00e9quence' : 'Frequency'} value={getRecurrenceLabel(contract.recurrence_type, lang)} />
                </div>
              </div>

              {/* Price breakdown */}
              <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-indigo-600" />
                  {fr ? 'Tarification' : 'Pricing'}
                </h3>
                <div className="space-y-2">
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
              </div>

              {contract.notes && (
                <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600">{contract.notes}</p>
                </div>
              )}

              {/* Approve */}
              <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {fr ? 'Votre nom complet' : 'Your full name'} *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={fr ? 'Pr\u00e9nom et nom' : 'First and last name'}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
                <button
                  onClick={handleApprove}
                  disabled={!name.trim() || approving}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {fr ? 'Approuver le contrat' : 'Approve contract'}
                </button>

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
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={3}
                      placeholder={fr ? 'D\u00e9crivez les modifications souhait\u00e9es...' : 'Describe the changes you would like...'}
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
                    {fr ? 'Votre demande a \u00e9t\u00e9 envoy\u00e9e.' : 'Your request has been sent.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8 pb-8">
            <p className="text-xs text-gray-400">
              {fr ? 'Propuls\u00e9 par' : 'Powered by'}{' '}
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
