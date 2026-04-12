'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { CheckCircle, Clock, AlertCircle, Download, CreditCard, Building2, Phone, Mail } from 'lucide-react'

interface LineItem { description: string; qty: number; unit_price: number; tax?: boolean }

interface PublicInvoice {
  id: string
  token: string
  invoice_number: string | null
  amount: number
  subtotal: number
  tax_rate: number
  tax_amount: number
  tax_name: string | null
  tax2_rate: number
  tax2_amount: number
  tax2_name: string | null
  discount: number
  status: string
  due_date: string | null
  created_at: string
  paid_at: string | null
  client_notes: string | null
  terms: string | null
  line_items: LineItem[] | null
  customers: { name: string; email: string | null; phone: string | null; address: string | null } | null
  organizations: {
    name: string | null
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
    tax_number: string | null
    stripe_connect_charges_enabled: boolean
  } | null
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const fmt = (n: number) =>
  `$${parseFloat(String(n)).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function PublicInvoiceContent() {
  const { token } = useParams<{ token: string }>()
  const searchParams = useSearchParams()

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [paying, setPaying] = useState(false)
  const justPaid = searchParams.get('paid') === 'true'

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id, token, invoice_number, amount, subtotal, tax_rate, tax_amount,
          tax_name, tax2_rate, tax2_amount, tax2_name, discount, status,
          due_date, created_at, paid_at, client_notes, terms, line_items,
          customers(name, email, phone, address),
          organizations!invoices_user_id_fkey(name, email, phone, address, city, state, zip, tax_number, stripe_connect_charges_enabled)
        `)
        .eq('token', token)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setInvoice(data as unknown as PublicInvoice)
        // Mark as viewed (fire-and-forget)
        if (data.status !== 'paid') {
          supabase.from('invoices').update({ viewed_at: new Date().toISOString() }).eq('token', token)
        }
      }
      setLoading(false)
    }
    load()
  }, [token])

  const handlePay = async () => {
    if (!invoice) return
    setPaying(true)
    try {
      const res = await fetch('/api/stripe/invoice-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id, returnPath: `/invoice/${token}` }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
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
        <h1 className="text-lg font-bold text-gray-900 mb-2">Facture introuvable</h1>
        <p className="text-sm text-gray-500">Ce lien est invalide ou a expiré. Contactez l'entreprise qui vous a envoyé cette facture.</p>
      </div>
    </div>
  )

  const inv = invoice!
  const org = inv.organizations
  const isPaid = inv.status === 'paid' || justPaid
  const isOverdue = inv.status === 'overdue' || (!isPaid && inv.due_date && new Date(inv.due_date) < new Date())

  const lineItems = inv.line_items || []
  const subtotal  = lineItems.length > 0
    ? lineItems.reduce((s, li) => s + li.qty * li.unit_price, 0)
    : inv.subtotal || inv.amount
  const taxAmt    = inv.tax_amount || (subtotal * (inv.tax_rate || 0) / 100)
  const tax2Amt   = inv.tax2_amount || (subtotal * (inv.tax2_rate || 0) / 100)
  const discount  = inv.discount || 0
  const total     = subtotal + taxAmt + tax2Amt - discount

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Payment success banner */}
        {isPaid && (
          <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 px-6 py-5 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-900">Paiement reçu — Merci !</h2>
              <p className="text-sm text-emerald-700 mt-0.5">
                Votre paiement a été traité avec succès.
                {inv.customers?.email && ` Un reçu a été envoyé à ${inv.customers.email}.`}
              </p>
            </div>
          </div>
        )}

        {/* Main invoice card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

          {/* Header */}
          <div className="px-6 py-6 sm:px-8 sm:py-8 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                {org?.name && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shrink-0">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{org.name}</p>
                      {org.city && <p className="text-xs text-gray-400">{org.city}, {org.state}</p>}
                    </div>
                  </div>
                )}
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900">FACTURE</h1>
                <p className="text-sm text-gray-400 mt-1">{inv.invoice_number || `INV-${inv.id.slice(0, 8).toUpperCase()}`}</p>
              </div>

              <div className="text-right shrink-0">
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold mb-3 ${isPaid ? 'bg-emerald-50 text-emerald-700' : isOverdue ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                  {isPaid ? <CheckCircle className="h-4 w-4" /> : isOverdue ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  {isPaid ? 'Payée' : isOverdue ? 'En retard' : 'En attente'}
                </div>
                <p className="text-xs text-gray-400">Date d&apos;émission</p>
                <p className="text-sm font-medium text-gray-900">{new Date(inv.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                {inv.due_date && (
                  <>
                    <p className="text-xs text-gray-400 mt-2">Date d&apos;échéance</p>
                    <p className={`text-sm font-medium ${isOverdue && !isPaid ? 'text-red-600' : 'text-gray-900'}`}>{new Date(inv.due_date).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bill To / Bill From */}
          <div className="px-6 sm:px-8 py-5 grid sm:grid-cols-2 gap-6 border-b border-gray-100 bg-gray-50">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Facturé à</p>
              <p className="font-semibold text-gray-900">{inv.customers?.name}</p>
              {inv.customers?.address && <p className="text-sm text-gray-500 mt-0.5">{inv.customers.address}</p>}
              {inv.customers?.email && <p className="text-sm text-gray-500">{inv.customers.email}</p>}
              {inv.customers?.phone && <p className="text-sm text-gray-500">{inv.customers.phone}</p>}
            </div>
            {org && (
              <div className="sm:text-right">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">De</p>
                <p className="font-semibold text-gray-900">{org.name}</p>
                {org.address && <p className="text-sm text-gray-500 mt-0.5">{org.address}</p>}
                {org.city && <p className="text-sm text-gray-500">{org.city}, {org.state} {org.zip}</p>}
                {org.email && <p className="text-sm text-gray-500">{org.email}</p>}
                {org.phone && <p className="text-sm text-gray-500">{org.phone}</p>}
                {org.tax_number && <p className="text-xs text-gray-400 mt-1">TPS/TVQ: {org.tax_number}</p>}
              </div>
            )}
          </div>

          {/* Line items */}
          {lineItems.length > 0 && (
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">Qté</th>
                    <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Prix unit.</th>
                    <th className="pb-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lineItems.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 text-gray-900">{item.description}</td>
                      <td className="py-3 text-right text-gray-600">{item.qty}</td>
                      <td className="py-3 text-right text-gray-600">{fmt(item.unit_price)}</td>
                      <td className="py-3 text-right font-medium text-gray-900">{fmt(item.qty * item.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
            <div className="flex flex-col items-end gap-2 max-w-xs ml-auto">
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
                  <span className="text-gray-500">{inv.tax_name || 'TPS'} ({inv.tax_rate || 0}%)</span>
                  <span className="font-medium text-gray-900">{fmt(taxAmt)}</span>
                </div>
              )}
              {tax2Amt > 0 && (
                <div className="flex justify-between w-full text-sm">
                  <span className="text-gray-500">{inv.tax2_name || 'TVQ'} ({inv.tax2_rate || 0}%)</span>
                  <span className="font-medium text-gray-900">{fmt(tax2Amt)}</span>
                </div>
              )}
              <div className="flex justify-between w-full border-t border-gray-200 pt-2 mt-1">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-xl font-black text-gray-900">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {inv.client_notes && (
            <div className="px-6 sm:px-8 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Notes</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{inv.client_notes}</p>
            </div>
          )}

          {/* Terms */}
          {inv.terms && (
            <div className="px-6 sm:px-8 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Conditions de paiement</p>
              <p className="text-sm text-gray-500">{inv.terms}</p>
            </div>
          )}

          {/* Payment section */}
          <div className="px-6 sm:px-8 py-6">
            {isPaid ? (
              <div className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <p className="text-sm font-semibold text-emerald-800">
                  Payé le {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Montant dû</p>
                  <p className="text-4xl font-black text-gray-900">{fmt(total)}</p>
                </div>

                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-lg shadow-indigo-200 active:scale-[0.99]"
                >
                  <CreditCard className="h-5 w-5" />
                  {paying ? 'Redirection...' : `Payer ${fmt(total)}`}
                </button>

                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                    Paiement sécurisé
                  </span>
                  <span>Visa · Mastercard · Amex · Interac</span>
                </div>

                <p className="text-center text-xs text-gray-400">
                  Propulsé par{' '}
                  <span className="font-semibold text-gray-500">Stripe</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contact footer */}
        {org && (
          <div className="mt-6 text-center space-y-1">
            <p className="text-xs text-gray-400">Des questions ? Contactez {org.name}</p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              {org.email && (
                <a href={`mailto:${org.email}`} className="flex items-center gap-1 hover:text-gray-600">
                  <Mail className="h-3.5 w-3.5" />{org.email}
                </a>
              )}
              {org.phone && (
                <a href={`tel:${org.phone}`} className="flex items-center gap-1 hover:text-gray-600">
                  <Phone className="h-3.5 w-3.5" />{org.phone}
                </a>
              )}
            </div>
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
