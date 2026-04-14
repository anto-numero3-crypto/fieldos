'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CheckCircle, Clock, AlertCircle, CreditCard, Phone, Mail, Printer, Lock } from 'lucide-react'
import { secureUrl } from '@/lib/secure-url'

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
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const fmt = (n: number) =>
  `$${parseFloat(String(n || 0)).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function PublicInvoiceContent() {
  const { token } = useParams<{ token: string }>()
  const searchParams = useSearchParams()

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
          .select('name, email, phone, address, city, state, zip, tax_number, logo_url, stripe_connect_charges_enabled, plan')
          .eq('owner_user_id', invData.user_id)
          .single()
        if (orgData) setOrg(orgData as OrgData)
      }

      // Mark as viewed (fire-and-forget, ignore errors)
      if (invData.status !== 'paid') {
        supabase.from('invoices').update({ viewed_at: new Date().toISOString() }).eq('token', token).then(() => {})
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
        <h1 className="text-xl font-bold text-gray-900 mb-2">Facture introuvable</h1>
        <p className="text-sm text-gray-500">Ce lien est invalide ou a expiré. Contactez l&apos;entreprise qui vous a envoyé cette facture.</p>
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

  const printDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })
  const isStarter = !org?.plan || org.plan === 'starter'

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      {/* ═══════ PRINT-ONLY FORMAL INVOICE (QuickBooks-style) ═══════ */}
      <div className="print-only" style={{ background: '#fff', color: '#000', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10px' }}>

        {/* SECTION 1 — HEADER */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <tbody>
            <tr>
              <td style={{ width: '55%', verticalAlign: 'top' }}>
                {org?.logo_url && (
                  <img
                    src={secureUrl(org.logo_url)}
                    alt={org.name || ''}
                    style={{ maxWidth: '160px', maxHeight: '70px', objectFit: 'contain', marginBottom: '12px', display: 'block' }}
                  />
                )}
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '4px' }}>{org?.name || ''}</div>
                <div style={{ fontSize: '10px', color: '#333', lineHeight: 1.7 }}>
                  {org?.address && <div>{org.address}</div>}
                  {(org?.city || org?.state || org?.zip) && <div>{[org.city, org.state, org.zip].filter(Boolean).join(', ')}</div>}
                  {org?.phone && <div>{org.phone}</div>}
                  {org?.email && <div>{org.email}</div>}
                </div>
              </td>
              <td style={{ width: '45%', verticalAlign: 'top', textAlign: 'right' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#000', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px' }}>Facture</div>
                <table style={{ marginLeft: 'auto', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#666', textAlign: 'right', padding: '2px 12px 2px 0' }}>Numéro&nbsp;:</td>
                      <td style={{ color: '#000', fontWeight: 'bold', textAlign: 'right' }}>{inv.invoice_number || inv.id.slice(0, 8).toUpperCase()}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#666', textAlign: 'right', padding: '2px 12px 2px 0' }}>Date&nbsp;:</td>
                      <td style={{ color: '#000', fontWeight: 'bold', textAlign: 'right' }}>{printDate(inv.created_at)}</td>
                    </tr>
                    {inv.due_date && (
                      <tr>
                        <td style={{ color: '#666', textAlign: 'right', padding: '2px 12px 2px 0' }}>Échéance&nbsp;:</td>
                        <td style={{ color: '#000', fontWeight: 'bold', textAlign: 'right' }}>{printDate(inv.due_date)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ borderTop: '1.5px solid #000', margin: '20px 0' }} />

        {/* SECTION 2 — BILL TO */}
        {inv.customers && (
          <div>
            <div style={{ fontSize: '8px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', color: '#999', marginBottom: '6px' }}>Facturé à</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#000', marginBottom: '3px' }}>{inv.customers.name}</div>
            <div style={{ fontSize: '10px', color: '#333', lineHeight: 1.7 }}>
              {inv.customers.address && <div>{inv.customers.address}</div>}
              {inv.customers.phone && <div>{inv.customers.phone}</div>}
              {inv.customers.email && <div>{inv.customers.email}</div>}
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid #ccc', margin: '16px 0' }} />

        {/* SECTION 3 — ITEMS TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr className="print-table-header" style={{ background: '#f2f2f2', borderTop: '1px solid #ccc', borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left',   fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#333', width: '58%' }}>Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#333', width: '9%' }}>Qté</th>
              <th style={{ padding: '8px 10px', textAlign: 'right',  fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#333', width: '16%' }}>Prix unit.</th>
              <th style={{ padding: '8px 10px', textAlign: 'right',  fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#333', width: '17%' }}>Montant</th>
            </tr>
          </thead>
          <tbody>
            {(lineItems.length > 0 ? lineItems : [{ description: inv.invoice_number || 'Services', qty: 1, unit_price: subtotal } as LineItem]).map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '9px 10px', textAlign: 'left',   fontSize: '10px', color: '#000' }}>{item.description}</td>
                <td style={{ padding: '9px 10px', textAlign: 'center', fontSize: '10px', color: '#666' }}>{item.qty}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right',  fontSize: '10px', color: '#666' }}>{fmt(item.unit_price)}</td>
                <td style={{ padding: '9px 10px', textAlign: 'right',  fontSize: '10px', color: '#000', fontWeight: 'bold' }}>{fmt((item.qty || 1) * (item.unit_price || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ borderTop: '1px solid #ccc' }} />

        {/* SECTION 4 — TOTALS */}
        <div style={{ width: '100%', overflow: 'hidden', marginTop: '12px' }}>
          <div style={{ float: 'right', width: '38%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee', fontSize: '10px' }}>
              <span style={{ color: '#666' }}>Sous-total</span>
              <span style={{ color: '#000' }}>{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee', fontSize: '10px' }}>
                <span style={{ color: '#666' }}>Escompte</span>
                <span style={{ color: '#000' }}>-{fmt(discount)}</span>
              </div>
            )}
            {taxAmt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee', fontSize: '10px' }}>
                <span style={{ color: '#666' }}>{inv.tax_name || 'TPS'}{inv.tax_rate ? ` (${inv.tax_rate}%)` : ''}</span>
                <span style={{ color: '#000' }}>{fmt(taxAmt)}</span>
              </div>
            )}
            {tax2Amt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee', fontSize: '10px' }}>
                <span style={{ color: '#666' }}>{inv.tax2_name || 'TVQ'}{inv.tax2_rate ? ` (${inv.tax2_rate}%)` : ''}</span>
                <span style={{ color: '#000' }}>{fmt(tax2Amt)}</span>
              </div>
            )}
            <div style={{ borderTop: '1.5px solid #000' }} />
            {isPaid && (
              <div style={{ padding: '6px 0 0 0', fontSize: '10px', color: '#333' }}>✓ Cette facture a été payée.</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '12px', fontWeight: 'bold', color: '#000' }}>
              <span>{isPaid ? `Payée le ${inv.paid_at ? printDate(inv.paid_at) : '—'} :` : 'Solde dû :'}</span>
              <span>{fmt(total)}</span>
            </div>
          </div>
          <div style={{ clear: 'both' }} />
        </div>

        {/* SECTION 5 — TERMS + NOTES */}
        {(inv.terms || inv.client_notes) && (
          <div style={{ clear: 'both', marginTop: '32px', fontSize: '10px' }}>
            {inv.terms && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold', color: '#333' }}>Modalités&nbsp;: </span>
                <span style={{ color: '#666', whiteSpace: 'pre-line' }}>{inv.terms}</span>
              </div>
            )}
            {inv.client_notes && (
              <div>
                <span style={{ fontWeight: 'bold', color: '#333' }}>Notes&nbsp;: </span>
                <span style={{ color: '#666', whiteSpace: 'pre-line' }}>{inv.client_notes}</span>
              </div>
            )}
          </div>
        )}

        {/* SECTION 6 — FOOTER */}
        <div style={{ marginTop: '40px', borderTop: '1px solid #ccc', paddingTop: '12px', textAlign: 'center', fontSize: '9px', color: '#999' }}>
          <div style={{ marginBottom: '4px' }}>Merci pour votre confiance.</div>
          {org?.name && (
            <div>
              {org.name}
              {org.phone && ` · ${org.phone}`}
              {org.email && ` · ${org.email}`}
            </div>
          )}
          {isStarter && (
            <div style={{ marginTop: '6px', fontSize: '8px', color: '#ccc' }}>
              Facture générée via Gestivio
            </div>
          )}
        </div>
      </div>


      {/* ══════════ SCREEN-ONLY ONLINE PAYMENT VIEW ══════════ */}
      <div className="screen-only max-w-2xl mx-auto space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimer / Télécharger PDF
          </button>
        </div>

        {/* Business header */}
        {org?.name && (
          <div className="text-center pt-2 pb-1">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-xl mb-2">
              {org.name.charAt(0).toUpperCase()}
            </div>
            <p className="font-bold text-gray-900">{org.name}</p>
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
              <p className="font-bold text-emerald-900">Paiement reçu — Merci !</p>
              <p className="text-sm text-emerald-700 mt-0.5">
                Votre paiement a été traité avec succès.
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
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Facture</p>
                <h1 className="text-2xl font-black text-gray-900">{inv.invoice_number || `INV-${inv.id.slice(0, 8).toUpperCase()}`}</h1>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold mb-2 ${isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : isOverdue ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {isPaid ? <CheckCircle className="h-3.5 w-3.5" /> : isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  {isPaid ? 'Payée' : isOverdue ? 'En retard' : 'En attente'}
                </div>
                <div className="text-sm text-gray-500 space-y-0.5">
                  <p>Émise le {new Date(inv.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  {inv.due_date && (
                    <p className={isOverdue && !isPaid ? 'text-red-600 font-semibold' : ''}>
                      Échéance: {new Date(inv.due_date).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Amount due — prominent */}
          {!isPaid && (
            <div className="mx-6 sm:mx-8 mb-2 rounded-2xl bg-indigo-600 px-6 py-5 text-white text-center">
              <p className="text-sm font-medium text-indigo-200 mb-1">Montant dû</p>
              <p className="text-4xl font-black">{fmt(total)}</p>
            </div>
          )}

          {/* Bill from / to */}
          <div className="px-6 sm:px-8 py-5 grid sm:grid-cols-2 gap-5 border-t border-gray-100">
            {org && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">De</p>
                <p className="font-semibold text-gray-900 text-sm">{org.name}</p>
                {org.address && <p className="text-xs text-gray-500 mt-0.5">{org.address}</p>}
                {(org.city || org.state) && <p className="text-xs text-gray-500">{[org.city, org.state, org.zip].filter(Boolean).join(', ')}</p>}
                {org.email && <p className="text-xs text-gray-500">{org.email}</p>}
                {org.phone && <p className="text-xs text-gray-500">{org.phone}</p>}
                {org.tax_number && <p className="text-xs text-gray-400 mt-1">TPS/TVQ: {org.tax_number}</p>}
              </div>
            )}
            {inv.customers && (
              <div className={org ? '' : 'sm:col-start-2'}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Facturé à</p>
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
                    <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-14">Qté</th>
                    <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Prix unit.</th>
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
                      <td className="py-2.5 text-right text-gray-500">{fmt(item.unit_price)}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-900">{fmt((item.qty || 1) * (item.unit_price || 0))}</td>
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
                  <span className="text-gray-500">Sous-total</span>
                  <span className="font-medium text-gray-900">{fmt(subtotal)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between w-full text-sm">
                  <span className="text-gray-500">Escompte</span>
                  <span className="font-medium text-emerald-600">-{fmt(discount)}</span>
                </div>
              )}
              {taxAmt > 0 && (
                <div className="flex justify-between w-full text-sm">
                  <span className="text-gray-500">{inv.tax_name || 'TPS'}{inv.tax_rate ? ` (${inv.tax_rate}%)` : ''}</span>
                  <span className="font-medium text-gray-900">{fmt(taxAmt)}</span>
                </div>
              )}
              {tax2Amt > 0 && (
                <div className="flex justify-between w-full text-sm">
                  <span className="text-gray-500">{inv.tax2_name || 'TVQ'}{inv.tax2_rate ? ` (${inv.tax2_rate}%)` : ''}</span>
                  <span className="font-medium text-gray-900">{fmt(tax2Amt)}</span>
                </div>
              )}
              <div className="flex justify-between w-full border-t border-gray-200 pt-2 mt-1">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-2xl font-black text-gray-900">{fmt(total)}</span>
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
                  Payé le {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
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
                  {paying ? 'Redirection en cours…' : `Payer ${fmt(total)}`}
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
                    <span>Paiement sécurisé par Stripe · Chiffré de bout en bout</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact footer */}
        {org && (
          <div className="text-center py-2 space-y-1 no-print">
            <p className="text-xs text-gray-400">Des questions ? Contactez {org.name}</p>
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
            {(!org.plan || org.plan === 'starter') && (
              <p className="text-xs text-gray-300 pt-1">
                Propulsé par <a href="https://gestivio.ca" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">Gestivio</a>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
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
