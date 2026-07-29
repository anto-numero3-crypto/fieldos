'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  Trash2, Send, ChevronRight, Tag, CheckCircle, Briefcase, Link2, Wallet,
} from 'lucide-react'
import { computeDepositAmount } from '@/lib/deposit-math'

interface LineItem { id: string; description: string; qty: number; unit_price: number }
interface Quote {
  id: string; title: string; status: string; total: number; valid_until: string | null
  created_at: string; quote_number: string | null
  customer_id?: string | null
  notes?: string | null
  token?: string | null
  line_items?: LineItem[] | null
  subtotal?: number | null
  tax_rate?: number | null
  tax_amount?: number | null
  deposit_required?: boolean | null
  deposit_amount?: number | null
  deposit_paid_at?: string | null
  customers: { name: string; email?: string | null } | null
}
interface Customer { id: string; name: string }

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

// Statuses where conversion + acceptance buttons are visible
const CONVERTIBLE = new Set(['sent', 'viewed', 'approved', 'accepted'])
const ACCEPTABLE  = new Set(['sent', 'viewed'])

const newItem = (): LineItem => ({ id: Date.now().toString(), description: '', qty: 1, unit_price: 0 })

export default function QuotesPage() {
  const router = useRouter()
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
  const [newCustomerMode, setNewCustomerMode] = useState(false)
  const [newCustName, setNewCustName]   = useState('')
  const [newCustEmail, setNewCustEmail] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const confirm = useConfirm()
  const { lang, t } = useLanguage()
  const fr = lang === 'fr'
  const tStatus = (k: string) => (t.status as Record<string, string>)[k] || k
  const fmt = (n: number) => fmtMoney(n, lang)
  const [convertingQuote, setConvertingQuote] = useState<Quote | null>(null)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('')

  const sendQuote = async (q: Quote) => {
    if (!q.customers?.email) { toast.error(fr ? "Ce client n'a pas de courriel." : 'This customer has no email.'); return }
    setSendingId(q.id)
    try {
      let token = q.token
      if (!token) {
        token = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/-/g, '')
        const { error: tokenErr } = await supabase.from('quotes').update({ token }).eq('id', q.id)
        if (tokenErr) { toast.error(tokenErr.message); return }
      }
      const items = q.line_items || []
      const sub = q.subtotal ?? items.reduce((s, li) => s + li.qty * li.unit_price, 0)
      const taxAmt = q.tax_amount ?? sub * ((q.tax_rate || 0) / 100)
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quote',
          to: q.customers.email,
          customerName: q.customers.name,
          quoteTitle: q.title,
          quoteNumber: q.quote_number || undefined,
          amount: fmt(q.total),
          subtotal: items.length > 0 ? fmt(sub) : undefined,
          taxAmount: taxAmt > 0 ? fmt(taxAmt) : undefined,
          validUntil: q.valid_until ? fmtDate(q.valid_until, lang) : undefined,
          quoteLink: `${window.location.origin}/devis/${token}`,
          lineItems: items.length > 0 ? items : undefined,
          businessName: businessName || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        const patch: Record<string, unknown> = { token }
        if (q.status === 'draft') { patch.status = 'sent'; patch.sent_at = new Date().toISOString() }
        await supabase.from('quotes').update(patch).eq('id', q.id)
        setQuotes((prev) => prev.map((p) => p.id === q.id ? { ...p, ...patch } as Quote : p))
        toast.success(t.success.sent)
      } else {
        toast.error(data.error || t.errors.unknown)
      }
    } catch {
      toast.error(t.errors.unknown)
    } finally {
      setSendingId(null)
    }
  }

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
              type: 'custom',
              to: q.customers.email,
              customerName: q.customers.name,
              subject: `Devis accepté — ${q.title || q.quote_number || ''}`,
              body: `Votre devis a \u00e9t\u00e9 accept\u00e9. Nous vous contacterons sous peu pour planifier l\u2019intervention.`,
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
  // Deposit fields
  const [depositRequired, setDepositRequired] = useState(false)
  const [depositType, setDepositType] = useState<'percentage' | 'fixed'>('percentage')
  const [depositValue, setDepositValue] = useState<number>(30)
  const [depositTaxesIncluded, setDepositTaxesIncluded] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      await Promise.all([fetchQuotes(data.user.id), fetchCustomers(data.user.id)])
      const { data: org } = await supabase.from('organizations').select('name').eq('owner_user_id', data.user.id).single()
      if (org?.name) setBusinessName(org.name)
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

  const createInlineCustomer = async () => {
    if (!newCustName.trim() || !user) { toast.error(t.errors.required); return }
    setCreatingCustomer(true)
    const { data, error } = await supabase.from('customers').insert({
      user_id: user.id,
      name: newCustName.trim(),
      email: newCustEmail.trim() || null,
      phone: newCustPhone.trim() || null,
    }).select('id, name').single()
    setCreatingCustomer(false)
    if (error) { toast.error(error.message); return }
    if (data) {
      setCustomers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setCustId(data.id)
    }
    toast.success(t.success.created)
    setNewCustomerMode(false)
    setNewCustName(''); setNewCustEmail(''); setNewCustPhone('')
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
    const depositAmount = computeDepositAmount(
      { required: depositRequired, type: depositType, value: depositValue, taxesIncluded: depositTaxesIncluded },
      { subtotal, taxAmount, tax2Amount: 0, total },
    )
    const { error } = await supabase.from('quotes').insert({
      user_id: user!.id,
      customer_id: customerId || null,
      title: title.trim(),
      status: 'draft',
      line_items: lineItems,
      subtotal, tax_rate: taxRate, tax_amount: taxAmount, total,
      valid_until: validUntil || null,
      notes: notes.trim() || null,
      deposit_required: depositRequired,
      deposit_type: depositRequired ? depositType : null,
      deposit_value: depositRequired ? depositValue : null,
      deposit_taxes_included: depositTaxesIncluded,
      deposit_amount: depositRequired ? depositAmount : null,
    })
    if (error) { toast.error(error.message) }
    else {
      toast.success(t.success.created)
      setTitle(''); setCustId(''); setValidUntil(''); setTaxRate(0); setNotes(''); setLineItems([newItem()])
      setDepositRequired(false); setDepositType('percentage'); setDepositValue(30); setDepositTaxesIncluded(false)
      setNewCustomerMode(false); setNewCustName(''); setNewCustEmail(''); setNewCustPhone('')
      await fetchQuotes(user!.id)
      setPanelOpen(false)
    }
    setLoading(false)
  }

  const deleteQuote = async (id: string) => {
    const { confirmed } = await confirm({
      title: fr ? 'Supprimer ce devis ?' : 'Delete this quote?',
      description: fr ? 'Cette action est irréversible.' : 'This cannot be undone.',
      confirmLabel: fr ? 'Supprimer' : 'Delete',
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

  const counts = Object.fromEntries(Object.keys(STATUS_CLS).map((k) => [k, quotes.filter((q) => q.status === k).length]))

  const AddButton = (
    <button onClick={() => setPanelOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all">
      <Plus className="h-4 w-4" /> {fr ? 'Nouveau devis' : 'New quote'}
    </button>
  )

  if (pageLoading) return (
    <AppLayout title={fr ? 'Devis' : 'Quotes'}>
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
    <AppLayout title={fr ? 'Devis' : 'Quotes'} actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: fr ? 'Total devis' : 'Total quotes', value: quotes.length, icon: FileSignature, bg: 'bg-indigo-50', color: 'text-indigo-600' },
            { label: fr ? 'Valeur totale' : 'Total value', value: fmt(totalValue), icon: DollarSign, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: fr ? 'Approuvés' : 'Approved', value: fmt(approvedValue), icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: fr ? "Taux d'acceptation" : 'Accept rate', value: `${isNaN(acceptRate) ? 0 : acceptRate.toFixed(0)}%`, icon: Tag, bg: 'bg-blue-50', color: 'text-blue-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${s.bg} mb-2`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex-wrap">
            {[{ key: 'all', label: fr ? 'Tous' : 'All', count: quotes.length }, ...Object.keys(STATUS_CLS).map((key) => ({ key, label: tStatus(key), count: counts[key] || 0 }))].map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={['flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all', filter === f.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'].join(' ')}>
                {f.label} <span className={`h-4 min-w-4 inline-flex items-center justify-center rounded-full px-1 text-xs ${filter === f.key ? 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300' : 'text-gray-400'}`}>{f.count}</span>
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={fr ? 'Rechercher des devis...' : 'Search quotes...'} value={search} onChange={(e) => setSearch(e.target.value)} className="block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm w-56" />
          </div>
        </div>

        {quotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <EmptyState
              icon={ClipboardList}
              title={fr ? 'Aucun devis' : 'No quotes'}
              description={fr ? 'Créez un devis pour un client.' : 'Create a quote for a customer.'}
              actions={[{ label: fr ? 'Créer un devis' : 'Create quote', onClick: () => setPanelOpen(true), variant: 'primary' }]}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead><tr className="bg-gray-50 dark:bg-gray-800/50">{(fr ? ['Devis', 'Client', 'Total', "Valide jusqu'au", 'Statut', ''] : ['Quote', 'Customer', 'Total', 'Valid until', 'Status', '']).map((c) => <th key={c} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{c}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {paged.map((q) => {
                    const scls = STATUS_CLS[q.status]
                    return (
                      <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer" onClick={() => router.push(`/quotes/${q.id}`)}>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{q.title}</p>
                          {q.quote_number && <p className="text-xs text-gray-400">{q.quote_number}</p>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {q.customers ? <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-gray-300" />{q.customers.name}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap"><span className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(q.total)}</span></td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {q.valid_until ? fmtDate(q.valid_until, lang) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${scls || ''}`}>{tStatus(q.status)}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {q.token && q.status !== 'draft' && (
                              <button
                                onClick={async () => {
                                  const url = `${window.location.origin}/devis/${q.token}`
                                  try { await navigator.clipboard.writeText(url); toast.success(fr ? 'Lien copié' : 'Link copied') } catch { toast.error('Clipboard unavailable') }
                                }}
                                className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                title={fr ? 'Copier le lien client' : 'Copy customer link'}
                              >
                                <Link2 className="h-4 w-4" />
                              </button>
                            )}
                            {['draft', 'sent', 'viewed'].includes(q.status) && q.customers?.email && (
                              <button
                                onClick={() => sendQuote(q)}
                                disabled={sendingId === q.id}
                                className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-50 disabled:opacity-60 transition-colors"
                                title={q.status === 'draft' ? (fr ? 'Envoyer le devis' : 'Send quote') : (fr ? 'Renvoyer le devis' : 'Resend quote')}
                              >
                                {sendingId === q.id ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" /> : <Send className="h-4 w-4" />}
                              </button>
                            )}
                            {q.deposit_required && q.deposit_paid_at && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300" title={fr ? 'Acompte versé' : 'Deposit paid'}>
                                <Wallet className="h-3 w-3" /> {fr ? 'Acompte' : 'Deposit'}
                              </span>
                            )}
                            {ACCEPTABLE.has(q.status) && (
                              <button
                                onClick={() => acceptQuote(q)}
                                disabled={acceptingId === q.id}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 px-2 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                                title={fr ? 'Accepter le devis' : 'Accept quote'}
                              >
                                <CheckCircle className="h-3.5 w-3.5" /> {fr ? 'Accepter' : 'Accept'}
                              </button>
                            )}
                            {CONVERTIBLE.has(q.status) && (
                              <button
                                onClick={() => setConvertingQuote(q)}
                                className="inline-flex items-center gap-1 rounded-lg bg-violet-50 hover:bg-violet-100 px-2 py-1.5 text-xs font-semibold text-violet-700"
                                title={fr ? 'Convertir en intervention' : 'Convert to job'}
                              >
                                <Briefcase className="h-3.5 w-3.5" /> {fr ? 'Convertir' : 'Convert'}
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
                const scls = STATUS_CLS[q.status]
                return (
                  <Link key={q.id} href={`/quotes/${q.id}`} className="block p-4 active:bg-gray-50 dark:active:bg-gray-800/50">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{q.title}</p>
                        {q.customers && <p className="text-xs text-gray-400 flex items-center gap-1"><User className="h-3 w-3" />{q.customers.name}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${scls || ''}`}>{tStatus(q.status)}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{fmt(q.total)}</span>
                      </div>
                    </div>
                  </Link>
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
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl slide-over flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
              <div><h2 className="text-base font-semibold text-gray-900 dark:text-white">{fr ? 'Nouveau devis' : 'New quote'}</h2><p className="text-xs text-gray-400 mt-0.5">{fr ? "Créez un devis professionnel avec des lignes d'articles" : 'Create a professional quote with line items'}</p></div>
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={createQuote} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{fr ? 'Titre' : 'Title'} <span className="text-red-500">*</span></label>
                <input type="text" placeholder={fr ? 'ex. Installation HVAC' : 'e.g. HVAC installation'} value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                  required
                  className={`block w-full rounded-xl border ${errTitle ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'} px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                <FieldError message={errTitle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{fr ? 'Client' : 'Customer'}</label>
                    {!newCustomerMode && (
                      <button type="button" onClick={() => setNewCustomerMode(true)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        <Plus className="h-3 w-3" /> {fr ? 'Nouveau client' : 'New customer'}
                      </button>
                    )}
                  </div>
                  {!newCustomerMode && (
                    <select value={customerId} onChange={(e) => setCustId(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                      <option value="">{fr ? 'Sélectionner un client' : 'Select a customer'}</option>
                      {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{fr ? "Valide jusqu'au" : 'Valid until'}</label>
                  <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
              </div>

              {newCustomerMode && (
                <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">{fr ? 'Nouveau client' : 'New customer'}</p>
                    <button type="button" onClick={() => setNewCustomerMode(false)} className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <input type="text" placeholder={fr ? 'Nom *' : 'Name *'} value={newCustName} onChange={(e) => setNewCustName(e.target.value)} className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="email" placeholder={fr ? 'Courriel' : 'Email'} value={newCustEmail} onChange={(e) => setNewCustEmail(e.target.value)} className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                    <input type="tel" placeholder={fr ? 'Téléphone' : 'Phone'} value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <button type="button" onClick={createInlineCustomer} disabled={creatingCustomer || !newCustName.trim()} className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                    {creatingCustomer ? (fr ? 'Création...' : 'Creating...') : (fr ? 'Créer et sélectionner' : 'Create and select')}
                  </button>
                </div>
              )}

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">{fr ? "Lignes d'articles" : 'Line items'}</label>
                  <button type="button" onClick={() => setLineItems([...lineItems, newItem()])} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> {fr ? 'Ajouter une ligne' : 'Add a line'}
                  </button>
                </div>
                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={item.id} className="flex gap-2 items-start">
                      <input placeholder={fr ? `Article ${idx + 1}` : `Item ${idx + 1}`} value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                      <input type="number" placeholder={fr ? 'Qté' : 'Qty'} value={item.qty} min={1} onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)} className="w-16 rounded-xl border border-gray-200 px-2 py-2 text-sm text-gray-900 text-center focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
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
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{fr ? 'Sous-total' : 'Subtotal'}</span>
                  <span className="font-medium">{fmt(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{fr ? 'Taux de taxe' : 'Tax rate'}</span>
                  <div className="flex items-center gap-1.5">
                    <input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} min={0} max={100} step="0.5" className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm text-right text-gray-900 focus:border-indigo-500 focus:outline-none" />
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{fr ? 'Taxe' : 'Tax'}</span>
                  <span className="font-medium">{fmt(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-2">
                  <span>{fr ? 'Total' : 'Total'}</span>
                  <span className="text-indigo-600">{fmt(total)}</span>
                </div>
              </div>

              {/* Deposit */}
              <div className="rounded-xl border border-violet-100 dark:border-violet-950/50 bg-violet-50/30 dark:bg-violet-950/10 p-4 space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depositRequired}
                    onChange={(e) => setDepositRequired(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                      <Wallet className="h-4 w-4 text-violet-600" />
                      {fr ? 'Demander un acompte' : 'Require a deposit'}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fr
                        ? 'Le client paiera un acompte en acceptant le devis. Le reste sera facturé à la fin du travail.'
                        : 'The customer pays a deposit when accepting the quote. The balance is billed when work is done.'}
                    </p>
                  </div>
                </label>

                {depositRequired && (
                  <div className="pl-7 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-0.5">
                        <button
                          type="button"
                          onClick={() => setDepositType('percentage')}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${depositType === 'percentage' ? 'bg-violet-600 text-white' : 'text-gray-500'}`}
                        >%</button>
                        <button
                          type="button"
                          onClick={() => setDepositType('fixed')}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${depositType === 'fixed' ? 'bg-violet-600 text-white' : 'text-gray-500'}`}
                        >$</button>
                      </div>
                      <div className="relative flex-1 max-w-[120px]">
                        {depositType === 'fixed' && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        )}
                        <input
                          type="number"
                          min={0}
                          max={depositType === 'percentage' ? 100 : undefined}
                          step={depositType === 'percentage' ? 1 : 0.01}
                          value={depositValue}
                          onChange={(e) => setDepositValue(parseFloat(e.target.value) || 0)}
                          className={`block w-full rounded-lg border border-gray-200 dark:border-gray-700 ${depositType === 'fixed' ? 'pl-6' : 'pl-3'} pr-2 py-1.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                        />
                        {depositType === 'percentage' && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-auto">
                        = {fmt(computeDepositAmount(
                          { required: depositRequired, type: depositType, value: depositValue, taxesIncluded: depositTaxesIncluded },
                          { subtotal, taxAmount, tax2Amount: 0, total },
                        ))}
                      </span>
                    </div>

                    {depositType === 'percentage' && (
                      <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={depositTaxesIncluded}
                          onChange={(e) => setDepositTaxesIncluded(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                        {fr ? 'Calculer le pourcentage sur le total (taxes incluses)' : 'Apply percentage to total (taxes included)'}
                      </label>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{fr ? 'Notes' : 'Notes'}</label>
                <textarea placeholder={fr ? 'Conditions, notes ou informations supplémentaires...' : 'Terms, notes, or additional information...'} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
              </div>

            </form>

            <div className="flex items-center gap-3 border-t border-gray-100 dark:border-gray-800 px-6 py-4">
              <button type="button" onClick={() => setPanelOpen(false)} className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{fr ? 'Annuler' : 'Cancel'}</button>
              <button onClick={createQuote} disabled={loading || formInvalid} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                {loading ? (fr ? 'Création en cours...' : 'Creating...') : (fr ? 'Créer le devis' : 'Create quote')}
              </button>
            </div>
          </div>
        </>
      )}
      <MobileFAB onClick={() => setPanelOpen(true)} label={fr ? 'Nouveau devis' : 'New quote'} />
      <ConvertQuoteModal
        open={!!convertingQuote}
        quote={convertingQuote}
        onClose={() => setConvertingQuote(null)}
      />
    </AppLayout>
  )
}
