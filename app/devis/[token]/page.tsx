'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Clock, FileSignature, Wallet, Printer, Loader2 } from 'lucide-react'
import { fmtMoney, fmtDate } from '@/lib/format'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

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
  tps_number: string | null
  tvq_number: string | null
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="fixed top-4 right-4 z-10"><LanguageToggle /></div>

      {/* Success banner */}
      {depositPaid && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/40 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
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
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/40 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              {fr ? 'Devis accepté — Merci !' : 'Quote accepted — Thank you!'}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
            <div>
              {org?.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={org.logo_url} alt={org.name || ''} className="h-10 mb-3" />
              )}
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{org?.name}</p>
              {org?.address && <p className="text-xs text-gray-500">{org.address}{org.city && `, ${org.city}`}{org.state && ` ${org.state}`}</p>}
              {org?.email && <p className="text-xs text-gray-500">{org.email}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">{fr ? 'Devis' : 'Quote'}</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white">{quote.quote_number || quote.id.slice(0, 8).toUpperCase()}</p>
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
            <div className="border-t border-gray-100 dark:border-gray-800 px-6 sm:px-8 py-5 bg-gray-50/50 dark:bg-gray-900/50">
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

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 hover:text-gray-600">
            <Printer className="h-3.5 w-3.5" /> {fr ? 'Imprimer' : 'Print'}
          </button>
          {quote.sent_at && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {fr ? 'Envoyé le' : 'Sent'} {fmtDate(quote.sent_at, lang)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
