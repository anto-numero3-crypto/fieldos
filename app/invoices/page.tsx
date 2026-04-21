'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/lib/hooks/usePagination'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import MobileFAB from '@/components/MobileFAB'
import EmptyState from '@/components/EmptyState'
import { SkeletonText, SkeletonListRow } from '@/components/ui/skeleton'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtMoney, fmtDate } from '@/lib/format'
import { getInvoiceDisplayStatus, invoiceStatusLabel, INVOICE_STATUS_CLS } from '@/lib/invoice-status'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  FileText, Plus, DollarSign, Calendar, User, Clock, Search,
  AlertCircle, CheckCircle, Send, Eye, Printer, Download,
  Filter, ArrowUpDown, X,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Invoice {
  id: string
  amount: number
  status: string
  due_date: string | null
  paid_at: string | null
  created_at: string
  invoice_number?: string
  viewed_count?: number
  viewed_at?: string | null
  customers: { id: string; name: string; email?: string } | null
  jobs: { id: string; title: string } | null
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function InvoicesPage() {
  const { lang, t } = useLanguage()
  const fr = lang === 'fr'
  const l = t.invoices

  const [user, setUser] = useState<{ id: string } | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc')
  const [pageLoading, setPageLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkSending, setBulkSending] = useState(false)

  /* ---- Data fetch ---- */
  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices', { cache: 'no-store' })
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch {
      setInvoices([])
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      await fetchInvoices()
      setPageLoading(false)
    }
    init()
  }, [fetchInvoices])

  /* ---- KPI calculations ---- */
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const totalDue = invoices.filter((i) => {
    const s = getInvoiceDisplayStatus(i)
    return s === 'unpaid' || s === 'sent' || s === 'overdue'
  }).reduce((s, i) => s + parseFloat(String(i.amount)), 0)

  const totalOverdue = invoices.filter((i) => getInvoiceDisplayStatus(i) === 'overdue')
    .reduce((s, i) => s + parseFloat(String(i.amount)), 0)

  const thisMonth = invoices.filter((i) => new Date(i.created_at) >= startOfMonth)
    .reduce((s, i) => s + parseFloat(String(i.amount)), 0)

  const paidYTD = invoices.filter((i) => {
    const s = getInvoiceDisplayStatus(i)
    return s === 'paid' && i.paid_at && new Date(i.paid_at) >= startOfYear
  }).reduce((s, i) => s + parseFloat(String(i.amount)), 0)

  /* ---- Filter + Sort ---- */
  const filtered = useMemo(() => {
    let result = invoices

    // Status filter
    if (activeFilter !== 'all') {
      result = result.filter((i) => getInvoiceDisplayStatus(i) === activeFilter)
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((i) =>
        (i.invoice_number || '').toLowerCase().includes(q) ||
        (i.customers?.name || '').toLowerCase().includes(q) ||
        String(i.amount).includes(q)
      )
    }

    // Date filter
    if (dateFilter === 'month') {
      result = result.filter((i) => new Date(i.created_at) >= startOfMonth)
    } else if (dateFilter === '3months') {
      const d = new Date(); d.setMonth(d.getMonth() - 3)
      result = result.filter((i) => new Date(i.created_at) >= d)
    } else if (dateFilter === 'year') {
      result = result.filter((i) => new Date(i.created_at) >= startOfYear)
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'amount_desc') return parseFloat(String(b.amount)) - parseFloat(String(a.amount))
      return parseFloat(String(a.amount)) - parseFloat(String(b.amount))
    })

    return result
  }, [invoices, activeFilter, searchQuery, dateFilter, sortBy, startOfMonth, startOfYear])

  const { page, setPage, range, pageSize, reset: resetPage } = usePagination(filtered.length)
  const paged = useMemo(() => filtered.slice(range.from, range.to), [filtered, range.from, range.to])
  useEffect(() => { resetPage() }, [activeFilter, searchQuery, dateFilter, resetPage])

  const countByStatus = (s: string) => invoices.filter((i) => getInvoiceDisplayStatus(i) === s).length
  const fmt = (n: number) => fmtMoney(n, lang)

  /* ---- Bulk actions ---- */
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const selectAll = () => {
    if (selected.size === paged.length) setSelected(new Set())
    else setSelected(new Set(paged.map((i) => i.id)))
  }

  const bulkMarkPaid = async () => {
    if (selected.size === 0) return
    const ids = Array.from(selected)
    await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).in('id', ids)
    toast.success(fr ? `${ids.length} facture(s) marquée(s) payée(s)` : `${ids.length} invoice(s) marked as paid`)
    setSelected(new Set())
    fetchInvoices()
  }

  const exportCSV = () => {
    const rows = filtered.map((i) => ({
      number: i.invoice_number || '',
      customer: i.customers?.name || '',
      amount: i.amount,
      status: getInvoiceDisplayStatus(i),
      created: i.created_at,
      due: i.due_date || '',
    }))
    const header = 'Number,Customer,Amount,Status,Created,Due\n'
    const csv = header + rows.map((r) => `${r.number},${r.customer},${r.amount},${r.status},${r.created},${r.due}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ---- Status filters ---- */
  const statusFilters = [
    { key: 'all', label: fr ? 'Toutes' : 'All' },
    { key: 'draft', label: fr ? 'Brouillons' : 'Drafts' },
    { key: 'sent', label: fr ? 'Envoyées' : 'Sent' },
    { key: 'overdue', label: fr ? 'En retard' : 'Overdue' },
    { key: 'paid', label: fr ? 'Payées' : 'Paid' },
  ]

  const AddButton = (
    <Link href="/invoices/new" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 hover:shadow-md active:scale-[0.98] transition-all duration-150">
      <Plus className="h-4 w-4" />{l.newBtn}
    </Link>
  )

  /* ---- Loading ---- */
  if (pageLoading) return (
    <AppLayout title={l.title}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-3">
        <SkeletonText className="h-10 w-64 mb-3" />
        {[...Array(5)].map((_, i) => <SkeletonListRow key={i} />)}
      </div>
    </AppLayout>
  )

  return (
    <AppLayout title={l.title} actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Page header */}
        <div className="mb-6 border-b border-gray-100 dark:border-gray-800 pb-5">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{l.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fr ? 'Suivez vos factures et encaissements' : 'Track your invoices and payments'}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          {[
            { label: fr ? 'Total dû' : 'Total due', value: fmt(totalDue), icon: DollarSign, bg: 'bg-indigo-50 dark:bg-indigo-950/40', color: 'text-indigo-600 dark:text-indigo-400', sub: fr ? `${countByStatus('unpaid') + countByStatus('sent')} en attente` : `${countByStatus('unpaid') + countByStatus('sent')} pending`, accent: 'border-l-indigo-500' },
            { label: fr ? 'En retard' : 'Overdue', value: fmt(totalOverdue), icon: AlertCircle, bg: 'bg-red-50 dark:bg-red-950/40', color: 'text-red-600 dark:text-red-400', sub: fr ? `${countByStatus('overdue')} facture(s)` : `${countByStatus('overdue')} invoice(s)`, highlight: totalOverdue > 0, accent: 'border-l-red-500' },
            { label: fr ? 'Ce mois' : 'This month', value: fmt(thisMonth), icon: Calendar, bg: 'bg-blue-50 dark:bg-blue-950/40', color: 'text-blue-600 dark:text-blue-400', sub: fr ? 'facturé ce mois' : 'invoiced this month', accent: 'border-l-blue-500' },
            { label: fr ? 'Payé cette année' : 'Paid this year', value: fmt(paidYTD), icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-950/40', color: 'text-emerald-600 dark:text-emerald-400', sub: fr ? `${countByStatus('paid')} payée(s)` : `${countByStatus('paid')} paid`, accent: 'border-l-emerald-500' },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border border-l-4 ${card.accent} ${card.highlight ? 'border-red-200 dark:border-red-900 border-l-red-500 bg-red-50/30 dark:bg-red-950/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'} p-5 shadow-sm hover:shadow-md transition-all duration-200`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.bg}`}>
                  <card.icon className={card.color} style={{ width: '18px', height: '18px' }} />
                </div>
              </div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${card.highlight ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{card.value}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={fr ? 'Rechercher client, n° facture...' : 'Search customer, invoice #...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-2 text-base sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {statusFilters.map((f) => {
              const count = f.key === 'all' ? invoices.length : countByStatus(f.key)
              const dotColors: Record<string, string> = { draft: '#9ca3af', sent: '#2563eb', overdue: '#dc2626', paid: '#16a34a' }
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={[
                    'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150',
                    activeFilter === f.key
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-950'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200',
                  ].join(' ')}
                >
                  {f.key !== 'all' && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeFilter === f.key ? '#ffffff' : dotColors[f.key] || '#9ca3af' }} />}
                  {f.label}
                  <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${activeFilter === f.key ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{count}</span>
                </button>
              )
            })}
          </div>

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">{fr ? 'Toutes les dates' : 'All dates'}</option>
            <option value="month">{fr ? 'Ce mois' : 'This month'}</option>
            <option value="3months">{fr ? '3 derniers mois' : 'Last 3 months'}</option>
            <option value="year">{fr ? 'Cette année' : 'This year'}</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="date_desc">{fr ? 'Plus récentes' : 'Newest first'}</option>
            <option value="date_asc">{fr ? 'Plus anciennes' : 'Oldest first'}</option>
            <option value="amount_desc">{fr ? 'Montant (desc)' : 'Amount (high-low)'}</option>
            <option value="amount_asc">{fr ? 'Montant (asc)' : 'Amount (low-high)'}</option>
          </select>
        </div>

        {/* Bulk Actions - floating bar */}
        {selected.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-2xl bg-gray-900 dark:bg-gray-800 border border-gray-700 px-5 py-3 shadow-2xl slide-up">
            <span className="text-sm font-semibold text-white tabular-nums">{selected.size} {fr ? 'sélectionnée(s)' : 'selected'}</span>
            <div className="w-px h-5 bg-gray-600" />
            <button onClick={bulkMarkPaid} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors duration-150">
              <CheckCircle className="h-3.5 w-3.5" /> {fr ? 'Marquer payées' : 'Mark paid'}
            </button>
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-xl bg-gray-700 dark:bg-gray-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors duration-150">
              <Download className="h-3.5 w-3.5" /> {fr ? 'Exporter CSV' : 'Export CSV'}
            </button>
            <button onClick={() => setSelected(new Set())} className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors ml-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Invoice Table / List */}
        {invoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <EmptyState
              icon={FileText}
              title={l.noInvoices}
              description={l.noInvoicesSub}
              actions={[{ label: l.newBtn, href: '/invoices/new', variant: 'primary' }]}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-20 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 mb-4">
              <FileText className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{fr ? 'Aucune facture trouvée' : 'No invoices found'}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{fr ? 'Essayez de modifier vos filtres' : 'Try adjusting your filters'}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-800/60">
                    <th className="pl-6 py-3 w-10">
                      <input type="checkbox" checked={selected.size === paged.length && paged.length > 0} onChange={selectAll} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    </th>
                    {[fr ? 'Facture #' : 'Invoice #', l.colCustomer, l.colAmount, l.colDueDate, l.colStatus, fr ? 'Vues' : 'Views', ''].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {paged.map((inv, idx) => {
                    const displayStatus = getInvoiceDisplayStatus(inv)
                    const isOverdue = displayStatus === 'overdue'
                    return (
                      <tr key={inv.id} className={`hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors duration-100 group cursor-pointer ${idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''}`} onClick={() => window.location.href = `/invoices/${inv.id}`}>
                        <td className="pl-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selected.has(inv.id)} onChange={() => toggleSelect(inv.id)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold font-mono text-indigo-600 dark:text-indigo-400 group-hover:underline">{inv.invoice_number || `INV-${inv.id.slice(0, 4).toUpperCase()}`}</span>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{fmtDate(inv.created_at, lang, 'short')}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {inv.customers ? (
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/60 dark:to-blue-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                                {inv.customers.name[0]?.toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{inv.customers.name}</span>
                            </div>
                          ) : <span className="text-gray-300 dark:text-gray-600">--</span>}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">{fmt(parseFloat(String(inv.amount)))}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {inv.due_date ? (
                            <span className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                              {fmtDate(inv.due_date, lang, 'short')}
                            </span>
                          ) : <span className="text-gray-300">--</span>}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${INVOICE_STATUS_CLS[displayStatus] || ''}`}>
                            {invoiceStatusLabel(displayStatus, fr)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {(inv.viewed_count || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400" title={inv.viewed_at ? fmtDate(inv.viewed_at, lang, 'short') : ''}>
                              <Eye className="h-3.5 w-3.5" /> {inv.viewed_count}x
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {displayStatus !== 'paid' && inv.customers?.email && (
                              <button
                                onClick={async () => {
                                  const res = await fetch('/api/email', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ type: 'invoice', to: inv.customers?.email, customerName: inv.customers?.name, invoiceNumber: inv.invoice_number, amount: fmt(inv.amount) }),
                                  })
                                  if (res.ok) { toast.success(fr ? 'Envoyée' : 'Sent'); fetchInvoices() }
                                }}
                                className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                title={fr ? 'Envoyer' : 'Send'}
                              >
                                <Send className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button onClick={() => window.print()} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title={fr ? 'Imprimer' : 'Print'}>
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-800/50">
              {paged.map((inv) => {
                const displayStatus = getInvoiceDisplayStatus(inv)
                const isOverdue = displayStatus === 'overdue'
                const statusColors: Record<string, string> = { paid: '#16a34a', overdue: '#dc2626', sent: '#2563eb', unpaid: '#f59e0b', draft: '#9ca3af', cancelled: '#9ca3af' }
                return (
                  <Link key={inv.id} href={`/invoices/${inv.id}`} className="block p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 active:scale-[0.99] transition-all duration-150">
                    <div className="flex gap-3">
                      {/* Colored left accent */}
                      <div className="w-1 shrink-0 rounded-full self-stretch" style={{ backgroundColor: statusColors[displayStatus] || '#9ca3af' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-3">
                            {inv.customers && (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/60 dark:to-blue-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                                {inv.customers.name[0]?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold font-mono text-indigo-600 dark:text-indigo-400 mb-0.5">{inv.invoice_number || `INV-${inv.id.slice(0, 4).toUpperCase()}`}</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{inv.customers?.name || '--'}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold tabular-nums text-gray-900 dark:text-white">{fmt(parseFloat(String(inv.amount)))}</p>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold mt-0.5 ${INVOICE_STATUS_CLS[displayStatus] || ''}`}>
                              {invoiceStatusLabel(displayStatus, fr)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                          {inv.due_date && (
                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-semibold' : ''}`}>
                              <Calendar className="h-3 w-3" /> {fmtDate(inv.due_date, lang, 'short')}
                            </span>
                          )}
                          {(inv.viewed_count || 0) > 0 && (
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {inv.viewed_count}x</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
          </div>
        )}

        {/* Export CSV button at bottom */}
        {filtered.length > 0 && (
          <div className="flex justify-end mt-4">
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm transition-all duration-150">
              <Download className="h-3.5 w-3.5" /> {fr ? 'Exporter CSV' : 'Export CSV'}
            </button>
          </div>
        )}
      </div>

      <MobileFAB href="/invoices/new" label={l.newBtn} />
    </AppLayout>
  )
}
