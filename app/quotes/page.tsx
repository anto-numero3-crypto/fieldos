'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/lib/hooks/usePagination'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import MobileFAB from '@/components/MobileFAB'
import { validateRequired, validateAmount } from '@/lib/validators'
import FieldError from '@/components/FieldError'
import EmptyState from '@/components/EmptyState'
import { SkeletonText, SkeletonListRow } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import ConvertQuoteModal from '@/components/ConvertQuoteModal'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtMoney, fmtDate } from '@/lib/format'
import { ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import {
  FileSignature, Plus, X, Search, User, Calendar, DollarSign,
  Trash2, Send, ChevronRight, Tag, CheckCircle, Briefcase,
} from 'lucide-react'

interface LineItem { id: string; description: string; qty: number; unit_price: number }
interface Quote {
  id: string; title: string; status: string; total: number; valid_until: string | null
  created_at: string; quote_number: string | null
  customer_id?: string | null
  notes?: string | null
  customers: { name: string; email?: string | null } | null
}
interface Customer { id: string; name: string }

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Brouillon', cls: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  sent:      { label: 'Envoyé',    cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  viewed:    { label: 'Vu',        cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  approved:  { label: 'Accepté',   cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  accepted:  { label: 'Accepté',   cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  converted: { label: 'Converti',  cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  rejected:  { label: 'Refusé',    cls: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
  expired:   { label: 'Expiré',    cls: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100' },
}

// Statuses where conversion + acceptance buttons are visible
const CONVERTIBLE = new Set(['sent', 'viewed', 'approved', 'accepted'])
const ACCEPTABLE  = new Set(['sent', 'viewed'])

const newItem = (): LineItem => ({ id: Date.now().toString(), description: '', qty: 1, unit_price: 0 })

export default function QuotesPage() {
  const [user, setUser]     = useState<{ id: string } | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)

  // Form
  const [title, setTitle]         = useState('')
  const [customerId, setCustId]   = useState('')
  const [touched, setTouched]     = useState<Record<string, boolean>>({})
  const confirm = useConfirm()
  const { lang, t } = useLanguage()
  const tStatus = (k: string) => (t.status as Record<string, string>)[k] || k
  const fmt = (n: number) => fmtMoney(n, lang)
  const [convertingQuote, setConvertingQuote] = useState<Quote | null>(null)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  const acceptQuote = async (q: Quote) => {
    setAcceptingId(q.id)
    try {
      await supabase.from('quotes').update({ status: 'approved' }).eq('id', q.id)
      setQuotes((prev) => prev.map((p) => p.id === q.id ? { ...p, status: 'approved' } : p))
      // Fire-and-forget acceptance email
      if (q.customers?.email) {
        try {
          await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'quote',
              to: q.customers.email,
              customerName: q.customers.name,
              quoteTitle: q.title,
              amount: `$${q.total.toFixed(2)}`,
              subject: `Devis accepté — ${q.title || q.quote_number || ''}`,
              body: `Votre devis a été accepté. Nous vous contacterons sous peu pour planifier les travaux.`,
            }),
          })
        } catch { /* ignore */ }
      }
      toast.success(t.success.updated)
    } finally {
      setAcceptingId(null)
    }
  }
  const [validUntil, setValidUntil] = useState('')
  const [taxRate, setTaxRate]     = useState(0)
  const [notes, setNotes]         = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([newItem()])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      await Promise.all([fetchQuotes(data.user.id), fetchCustomers(data.user.id)])
      setPageLoading(false)
    }
    init()
  }, [])

  const fetchQuotes = async (_uid: string) => {
    const res = await fetch('/api/quotes', { cache: 'no-store' })
    const data = await res.json()
    setQuotes((data.quotes || []) as unknown as Quote[])
  }
  const fetchCustomers = async (uid: string) => {
    const { data } = await supabase.from('customers').select('id, name').eq('user_id', uid).order('name')
    setCustomers(data || [])
  }

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item))
  }
  const removeItem = (id: string) => setLineItems((prev) => prev.filter((i) => i.id !== id))

  const subtotal = lineItems.reduce((s, i) => s + i.qty * i.unit_price, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const errTitle = touched.title ? validateRequired(title) : ''
  const lineItemsValid = lineItems.every((it) => it.description.trim() && !validateAmount(it.unit_price) && Number(it.qty) > 0)
  const formInvalid = !!validateRequired(title) || !lineItemsValid

  const createQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ title: true })
    if (formInvalid) { toast.error(t.errors.required); return }
    setLoading(true)
    const { error } = await supabase.from('quotes').insert({
      user_id: user!.id,
      customer_id: customerId || null,
      title: title.trim(),
      status: 'draft',
      line_items: lineItems,
      subtotal, tax_rate: taxRate, tax_amount: taxAmount, total,
      valid_until: validUntil || null,
      notes: notes.trim() || null,
    })
    if (error) { toast.error(error.message) }
    else {
      toast.success(t.success.created)
      setTitle(''); setCustId(''); setValidUntil(''); setTaxRate(0); setNotes(''); setLineItems([newItem()])
      await fetchQuotes(user!.id)
      setPanelOpen(false)
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('quotes').update({ status }).eq('id', id)
    setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, status } : q))
  }

  const deleteQuote = async (id: string) => {
    const { confirmed } = await confirm({
      title: 'Supprimer ce devis ?',
      description: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
    })
    if (!confirmed) return
    await supabase.from('quotes').delete().eq('id', id)
    setQuotes((prev) => prev.filter((q) => q.id !== id))
  }

  const filtered = useMemo(() => quotes.filter((q) => {
    const matchFilter = filter === 'all' || q.status === filter
    const q2 = search.toLowerCase()
    const matchSearch = !q2 || q.title.toLowerCase().includes(q2) || (q.customers?.name || '').toLowerCase().includes(q2)
    return matchFilter && matchSearch
  }), [quotes, filter, search])

  const { page, setPage, range, pageSize, reset: resetPage } = usePagination(filtered.length)
  const paged = useMemo(() => filtered.slice(range.from, range.to), [filtered, range.from, range.to])
  useEffect(() => { resetPage() }, [filter, search, resetPage])

  const counts = Object.fromEntries(Object.keys(STATUS_CFG).map((k) => [k, quotes.filter((q) => q.status === k).length]))

  const AddButton = (
    <button onClick={() => setPanelOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all">
      <Plus className="h-4 w-4" /> Nouveau devis
    </button>
  )

  if (pageLoading) return (
    <AppLayout title="Devis">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-3">
        <SkeletonText className="h-10 w-64 mb-3" />
        {[...Array(3)].map((_, i) => <SkeletonListRow key={i} />)}
      </div>
    </AppLayout>
  )

  const totalValue    = quotes.reduce((s, q) => s + q.total, 0)
  const approvedValue = quotes.filter((q) => q.status === 'approved').reduce((s, q) => s + q.total, 0)
  const acceptRate    = quotes.length > 0 ? (quotes.filter((q) => q.status === 'approved').length / quotes.filter((q) => q.status !== 'draft').length) * 100 : 0

  return (
    <AppLayout title="Devis" actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total devis', value: quotes.length, icon: FileSignature, bg: 'bg-indigo-50', color: 'text-indigo-600' },
            { label: 'Valeur totale', value: fmt(totalValue), icon: DollarSign, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Approuvés', value: fmt(approvedValue), icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Taux d\'acceptation', value: `${isNaN(acceptRate) ? 0 : acceptRate.toFixed(0)}%`, icon: Tag, bg: 'bg-blue-50', color: 'text-blue-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${s.bg} mb-2`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
            {[{ key: 'all', label: 'Tous', count: quotes.length }, ...Object.entries(STATUS_CFG).map(([key, cfg]) => ({ key, label: cfg.label, count: counts[key] || 0 }))].map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={['flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all', filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}>
                {f.label} <span className={`h-4 min-w-4 inline-flex items-center justify-center rounded-full px-1 text-xs ${filter === f.key ? 'bg-gray-100 text-gray-600' : 'text-gray-400'}`}>{f.count}</span>
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher des devis..." value={search} onChange={(e) => setSearch(e.target.value)} className="block rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm w-56" />
          </div>
        </div>

        {quotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white">
            <EmptyState
              icon={ClipboardList}
              title="Aucun devis"
              description="Créez un devis pour un client."
              actions={[{ label: 'Créer un devis', onClick: () => setPanelOpen(true), variant: 'primary' }]}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead><tr className="bg-gray-50">{['Devis', 'Client', 'Total', 'Valide jusqu\'au', 'Statut', ''].map((c) => <th key={c} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {paged.map((q) => {
                    const scfg = STATUS_CFG[q.status]
                    return (
                      <tr key={q.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900">{q.title}</p>
                          {q.quote_number && <p className="text-xs text-gray-400">{q.quote_number}</p>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {q.customers ? <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-gray-300" />{q.customers.name}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap"><span className="text-sm font-semibold text-gray-900">{fmt(q.total)}</span></td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {q.valid_until ? fmtDate(q.valid_until, lang) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${scfg?.cls || ''}`}>{tStatus(q.status)}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {q.status === 'draft' && (
                              <button onClick={() => updateStatus(q.id, 'sent')} className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-50 transition-colors" title="Marquer comme envoyé">
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            {ACCEPTABLE.has(q.status) && (
                              <button
                                onClick={() => acceptQuote(q)}
                                disabled={acceptingId === q.id}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 px-2 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                                title="Accepter le devis"
                              >
                                <CheckCircle className="h-3.5 w-3.5" /> Accepter
                              </button>
                            )}
                            {CONVERTIBLE.has(q.status) && (
                              <button
                                onClick={() => setConvertingQuote(q)}
                                className="inline-flex items-center gap-1 rounded-lg bg-violet-50 hover:bg-violet-100 px-2 py-1.5 text-xs font-semibold text-violet-700"
                                title="Convertir en emploi"
                              >
                                <Briefcase className="h-3.5 w-3.5" /> Convertir
                              </button>
                            )}
                            <button onClick={() => deleteQuote(q.id)} className="rounded-lg p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden divide-y divide-gray-100">
              {filtered.map((q) => {
                const scfg = STATUS_CFG[q.status]
                return (
                  <div key={q.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{q.title}</p>
                        {q.customers && <p className="text-xs text-gray-400 flex items-center gap-1"><User className="h-3 w-3" />{q.customers.name}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${scfg?.cls || ''}`}>{tStatus(q.status)}</span>
                        <span className="text-sm font-bold text-gray-900">{fmt(q.total)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Create quote panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm fade-in" onClick={() => setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-white shadow-2xl slide-over flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div><h2 className="text-base font-semibold text-gray-900">Nouveau devis</h2><p className="text-xs text-gray-400 mt-0.5">Créez un devis professionnel avec des lignes d&apos;articles</p></div>
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={createQuote} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre <span className="text-red-500">*</span></label>
                <input type="text" placeholder="ex. Installation HVAC" value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                  required
                  className={`block w-full rounded-xl border ${errTitle ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'} px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                <FieldError message={errTitle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Client</label>
                  <select value={customerId} onChange={(e) => setCustId(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                    <option value="">Sélectionner un client</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Valide jusqu&apos;au</label>
                  <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Lignes d&apos;articles</label>
                  <button type="button" onClick={() => setLineItems([...lineItems, newItem()])} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> Ajouter une ligne
                  </button>
                </div>
                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={item.id} className="flex gap-2 items-start">
                      <input placeholder={`Item ${idx + 1}`} value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                      <input type="number" placeholder="Qty" value={item.qty} min={1} onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)} className="w-16 rounded-xl border border-gray-200 px-2 py-2 text-sm text-gray-900 text-center focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                      <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input type="number" placeholder="0.00" step="0.01" min="0" value={item.unit_price} onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)} className="block w-full rounded-xl border border-gray-200 pl-6 pr-2 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                      </div>
                      {lineItems.length > 1 && (
                        <button type="button" onClick={() => removeItem(item.id)} className="rounded-lg p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sous-total</span>
                  <span className="font-medium">{fmt(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Taux de taxe</span>
                  <div className="flex items-center gap-1.5">
                    <input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} min={0} max={100} step="0.5" className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm text-right text-gray-900 focus:border-indigo-500 focus:outline-none" />
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taxe</span>
                  <span className="font-medium">{fmt(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-indigo-600">{fmt(total)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea placeholder="Conditions, notes ou informations supplémentaires..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
              </div>

            </form>

            <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={() => setPanelOpen(false)} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={createQuote} disabled={loading || formInvalid} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                {loading ? 'Création en cours...' : 'Créer le devis'}
              </button>
            </div>
          </div>
        </>
      )}
      <MobileFAB onClick={() => setPanelOpen(true)} label="Nouveau devis" />
      <ConvertQuoteModal
        open={!!convertingQuote}
        quote={convertingQuote}
        onClose={() => setConvertingQuote(null)}
      />
    </AppLayout>
  )
}
