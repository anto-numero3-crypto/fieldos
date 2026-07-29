'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../supabase'
import AppLayout from '@/components/AppLayout'
import { SkeletonText, SkeletonCard } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtMoney, fmtDate } from '@/lib/format'
import ConvertQuoteModal from '@/components/ConvertQuoteModal'
import { toast } from 'sonner'
import {
  ArrowLeft, FileSignature, User, CheckCircle, Clock,
  Send, Trash2, ExternalLink, Link2, Printer, Briefcase, Wallet,
} from 'lucide-react'
import Link from 'next/link'

interface LineItem { description: string; qty: number; unit_price: number }

interface Quote {
  id: string
  user_id: string
  token?: string | null
  quote_number?: string | null
  title: string
  status: string
  line_items: LineItem[]
  subtotal: number
  tax_rate?: number | null
  tax_amount?: number | null
  total: number
  valid_until: string | null
  notes?: string | null
  created_at: string
  sent_at?: string | null
  accepted_at?: string | null
  customer_id?: string | null
  deposit_required?: boolean | null
  deposit_amount?: number | null
  deposit_paid_at?: string | null
  customers: { id: string; name: string; email?: string; phone?: string; address?: string } | null
}

const CONVERTIBLE = new Set(['sent', 'viewed', 'approved', 'accepted'])
const ACCEPTABLE  = new Set(['sent', 'viewed'])

const STATUS_CLS: Record<string, string> = {
  draft:     'bg-gray-50 text-gray-600 ring-1 ring-gray-100',
  sent:      'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  viewed:    'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  approved:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  accepted:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  converted: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
  rejected:  'bg-red-50 text-red-700 ring-1 ring-red-100',
  expired:   'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const confirm = useConfirm()
  const { lang, t } = useLanguage()
  const fr = lang === 'fr'
  const tStatus = (k: string) => (t.status as Record<string, string>)[k] || k
  const fmt = (n: number) => fmtMoney(n, lang)

  const [quote, setQuote] = useState<Quote | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [converting, setConverting] = useState(false)

  const fetchQuote = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quotes/${id}`, { cache: 'no-store' })
      const json = await res.json()
      const data = json.quote
      if (data) {
        if (!data.token) {
          const newToken = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/-/g, '')
          const { error: tokenErr } = await supabase.from('quotes').update({ token: newToken }).eq('id', data.id)
          if (!tokenErr) data.token = newToken
        }
        setQuote(data)
        if (data.user_id) {
          const { data: org } = await supabase.from('organizations').select('name').eq('owner_user_id', data.user_id).single()
          if (org?.name) setBusinessName(org.name)
        }
      }
    } catch (e) {
      console.error('[quote detail] fetch failed:', e)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { window.location.href = '/login'; return }
      await fetchQuote()
    }
    init()
  }, [fetchQuote])

  const sendQuoteEmail = async () => {
    if (!quote?.customers?.email) return
    setSending(true)
    try {
      const items = quote.line_items || []
      const sub = quote.subtotal ?? items.reduce((s, li) => s + li.qty * li.unit_price, 0)
      const taxAmt = quote.tax_amount ?? sub * ((quote.tax_rate || 0) / 100)

      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quote',
          to: quote.customers.email,
          customerName: quote.customers.name,
          quoteTitle: quote.title,
          quoteNumber: quote.quote_number || undefined,
          amount: fmt(quote.total),
          subtotal: items.length > 0 ? fmt(sub) : undefined,
          taxAmount: taxAmt > 0 ? fmt(taxAmt) : undefined,
          validUntil: quote.valid_until ? fmtDate(quote.valid_until, lang) : undefined,
          quoteLink: quote.token ? `${window.location.origin}/devis/${quote.token}` : undefined,
          lineItems: items.length > 0 ? items : undefined,
          businessName: businessName || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(t.success.sent)
        if (quote.status === 'draft') {
          await supabase.from('quotes').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id)
          fetchQuote()
        }
      } else { toast.error(data.error || t.errors.unknown) }
    } catch { toast.error(t.errors.unknown) }
    setSending(false)
  }

  const acceptQuote = async () => {
    if (!quote) return
    setAccepting(true)
    try {
      await supabase.from('quotes').update({ status: 'approved' }).eq('id', quote.id)
      if (quote.customers?.email) {
        try {
          await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'custom',
              to: quote.customers.email,
              customerName: quote.customers.name,
              subject: `Devis accepté — ${quote.title || quote.quote_number || ''}`,
              body: `Votre devis a été accepté. Nous vous contacterons sous peu pour planifier l’intervention.`,
            }),
          })
        } catch { /* ignore */ }
      }
      toast.success(t.success.updated)
      fetchQuote()
    } finally { setAccepting(false) }
  }

  const deleteQuote = async () => {
    const { confirmed } = await confirm({
      title: fr ? 'Supprimer ce devis ?' : 'Delete this quote?',
      description: fr ? 'Cette action est irréversible.' : 'This cannot be undone.',
      confirmLabel: fr ? 'Supprimer' : 'Delete',
    })
    if (!confirmed || !quote) return
    await supabase.from('quotes').delete().eq('id', quote.id)
    router.push('/quotes')
  }

  if (loading) return (
    <AppLayout title={fr ? 'Devis' : 'Quote'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        <SkeletonText className="h-6 w-48" />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <SkeletonCard className="h-96" />
          <SkeletonCard className="h-96" />
        </div>
      </div>
    </AppLayout>
  )

  if (!quote) return (
    <AppLayout title={fr ? 'Devis' : 'Quote'}>
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <FileSignature className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{fr ? 'Devis introuvable.' : 'Quote not found.'}</p>
        <Link href="/quotes" className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">{fr ? 'Retour aux devis' : 'Back to quotes'}</Link>
      </div>
    </AppLayout>
  )

  const items = quote.line_items || []
  const sub = quote.subtotal ?? items.reduce((s, li) => s + li.qty * li.unit_price, 0)
  const tax = quote.tax_amount ?? sub * ((quote.tax_rate || 0) / 100)

  return (
    <AppLayout title={quote.quote_number || (fr ? 'Devis' : 'Quote')}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/quotes" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
            <ArrowLeft className="h-4 w-4" /> {fr ? 'Devis' : 'Quotes'}
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{quote.quote_number || quote.id.slice(0, 8)}</span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ml-2 ${STATUS_CLS[quote.status] || ''}`}>
            {tStatus(quote.status)}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* ========== LEFT: Quote Preview ========== */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-8 py-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{businessName || (fr ? 'Votre entreprise' : 'Your business')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{quote.title}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{quote.quote_number || `DEV-${quote.id.slice(0, 8).toUpperCase()}`}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{fmtDate(quote.created_at, lang)}</p>
                  {quote.valid_until && (
                    <p className="text-sm mt-0.5 text-gray-400 dark:text-gray-500">{fr ? "Valide jusqu'au :" : 'Valid until:'} {fmtDate(quote.valid_until, lang)}</p>
                  )}
                </div>
              </div>

              {quote.customers && (
                <div className="mt-6 rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{fr ? 'Devis pour' : 'Quote for'}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{quote.customers.name}</p>
                  {quote.customers.email && <p className="text-sm text-gray-500 dark:text-gray-400">{quote.customers.email}</p>}
                  {quote.customers.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{quote.customers.phone}</p>}
                  {quote.customers.address && <p className="text-sm text-gray-500 dark:text-gray-400">{quote.customers.address}</p>}
                </div>
              )}
            </div>

            <div className="px-4 sm:px-8 py-6">
              {items.length > 0 ? (
                <>
                  <table className="w-full text-sm hidden sm:table">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="pb-3 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{fr ? 'Qté' : 'Qty'}</th>
                        <th className="pb-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{fr ? 'Prix unitaire' : 'Unit price'}</th>
                        <th className="pb-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {items.map((li, i) => (
                        <tr key={i}>
                          <td className="py-3 text-gray-900 dark:text-white">{li.description}</td>
                          <td className="py-3 text-center text-gray-500 dark:text-gray-400">{li.qty}</td>
                          <td className="py-3 text-right text-gray-500 dark:text-gray-400">{fmt(li.unit_price)}</td>
                          <td className="py-3 text-right font-medium text-gray-900 dark:text-white">{fmt(li.qty * li.unit_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="sm:hidden space-y-3">
                    {items.map((li, i) => (
                      <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{li.description}</p>
                        <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{li.qty} x {fmt(li.unit_price)}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{fmt(li.qty * li.unit_price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 max-w-xs ml-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{fr ? 'Sous-total' : 'Subtotal'}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{fmt(sub)}</span>
                    </div>
                    {tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">{fr ? 'Taxe' : 'Tax'} ({quote.tax_rate || 0}%)</span>
                        <span className="font-medium text-gray-900 dark:text-white">{fmt(tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{fmt(quote.total)}</span>
                    </div>
                    {quote.deposit_required && Number(quote.deposit_amount || 0) > 0 && (
                      <div className="mt-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 p-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-1">
                          <Wallet className="h-3.5 w-3.5" /> {fr ? 'Acompte requis' : 'Required deposit'}
                        </div>
                        <div className="flex justify-between text-base font-bold text-violet-900 dark:text-violet-200">
                          <span>{fmt(Number(quote.deposit_amount || 0))}</span>
                          {quote.deposit_paid_at && <span className="text-xs font-normal">{fr ? 'Payé' : 'Paid'}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center py-8">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{fr ? 'Montant du devis' : 'Quote amount'}</span>
                  <span className="text-3xl font-black text-gray-900 dark:text-white">{fmt(quote.total)}</span>
                </div>
              )}

              {quote.notes && (
                <div className="mt-6 rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Note</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{quote.notes}</p>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-8 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Printer className="h-4 w-4" /> {fr ? 'Imprimer' : 'Print'}
              </button>
            </div>
          </div>

          {/* ========== RIGHT: Action Panel ========== */}
          <div className="space-y-4">

            {/* Status timeline */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">{fr ? 'Progression' : 'Progress'}</p>
              <div className="space-y-3">
                {[
                  { key: 'created', label: fr ? 'Créé' : 'Created', date: quote.created_at, done: true },
                  { key: 'sent', label: fr ? 'Envoyé' : 'Sent', date: quote.sent_at, done: quote.status !== 'draft' },
                  { key: 'accepted', label: fr ? 'Accepté' : 'Accepted', date: quote.accepted_at, done: ['approved', 'accepted', 'converted'].includes(quote.status) },
                ].map((step, i, arr) => (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${step.done ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
                        {step.done ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      </div>
                      {i < arr.length - 1 && <div className={`w-0.5 h-6 mt-1 ${step.done ? 'bg-indigo-200 dark:bg-indigo-800' : 'bg-gray-100 dark:bg-gray-800'}`} />}
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-sm font-medium ${step.done ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{step.label}</p>
                      {step.done && step.date && <p className="text-xs text-gray-400 dark:text-gray-500">{fmtDate(step.date, lang, 'short')}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{fr ? 'Montant total' : 'Total amount'}</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white">{fmt(quote.total)}</p>
            </div>

            {/* Actions */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5 space-y-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{fr ? 'Actions' : 'Actions'}</p>

              {quote.customers?.email && (
                <button
                  onClick={sendQuoteEmail}
                  disabled={sending}
                  className="w-full flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-sm"
                >
                  {sending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Send className="h-4 w-4" />}
                  {quote.status === 'draft' ? (fr ? 'Envoyer le devis' : 'Send quote') : (fr ? 'Renvoyer le devis' : 'Resend quote')}
                </button>
              )}
              {!quote.customers?.email && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
                  {fr ? 'Ce client n\'a pas de courriel — ajoutez-en un pour pouvoir envoyer le devis.' : 'This customer has no email — add one to send the quote.'}
                </p>
              )}

              {ACCEPTABLE.has(quote.status) && (
                <button
                  onClick={acceptQuote}
                  disabled={accepting}
                  className="w-full flex items-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 px-3 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 disabled:opacity-60 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" /> {fr ? 'Marquer comme accepté' : 'Mark as accepted'}
                </button>
              )}

              {CONVERTIBLE.has(quote.status) && (
                <button
                  onClick={() => setConverting(true)}
                  className="w-full flex items-center gap-2 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 px-3 py-2.5 text-sm font-semibold text-violet-700 dark:text-violet-400 transition-colors"
                >
                  <Briefcase className="h-4 w-4" /> {fr ? 'Convertir en intervention' : 'Convert to job'}
                </button>
              )}

              {quote.token && (
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/devis/${quote.token}`
                    navigator.clipboard.writeText(url)
                    toast.success(t.success.copied)
                  }}
                  className="w-full flex items-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <Link2 className="h-4 w-4" /> {fr ? 'Copier le lien client' : 'Copy client link'}
                </button>
              )}

              {quote.token && (
                <a href={`/devis/${quote.token}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <ExternalLink className="h-4 w-4 text-gray-400 dark:text-gray-500" /> {fr ? 'Voir le devis client' : 'View client quote'}
                </a>
              )}

              <button onClick={deleteQuote} className="w-full flex items-center gap-2 rounded-xl border border-red-100 dark:border-red-900/50 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 className="h-4 w-4" /> {fr ? 'Supprimer' : 'Delete'}
              </button>
            </div>

            {/* Customer card */}
            {quote.customers && (
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{fr ? 'Client' : 'Customer'}</p>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                    {quote.customers.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{quote.customers.name}</p>
                    {quote.customers.email && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{quote.customers.email}</p>}
                    {quote.customers.phone && <p className="text-xs text-gray-400 dark:text-gray-500">{quote.customers.phone}</p>}
                  </div>
                </div>
                <Link href={`/customers/${quote.customers.id}`} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                  <User className="h-3 w-3" /> {fr ? 'Voir le profil' : 'View profile'} <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConvertQuoteModal
        open={converting}
        quote={quote}
        onClose={() => setConverting(false)}
      />
    </AppLayout>
  )
}
