'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import {
  FileSignature, Plus, X, Search, User, Calendar, DollarSign,
  AlertCircle, CheckCircle, Trash2, Send, ChevronRight, Tag,
} from 'lucide-react'

interface LineItem { id: string; description: string; qty: number; unit_price: number }
interface Quote {
  id: string; title: string; status: string; total: number; valid_until: string | null
  created_at: string; quote_number: string | null
  customers: { name: string } | null
}
interface Customer { id: string; name: string }

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  draft:    { label: 'Draft',    cls: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  sent:     { label: 'Sent',     cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
  expired:  { label: 'Expired',  cls: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100' },
}

const fmt = (n: number) => `$${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Form
  const [title, setTitle]         = useState('')
  const [customerId, setCustId]   = useState('')
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

  const fetchQuotes = async (uid: string) => {
    const { data } = await supabase.from('quotes').select('id, title, status, total, valid_until, created_at, quote_number, customers(name)').eq('user_id', uid).order('created_at', { ascending: false })
    setQuotes((data || []) as unknown as Quote[])
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

  const createQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setMessage({ text: 'Title is required.', type: 'error' }); return }
    setLoading(true); setMessage(null)
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
    if (error) { setMessage({ text: error.message, type: 'error' }) }
    else {
      setMessage({ text: 'Quote created!', type: 'success' })
      setTitle(''); setCustId(''); setValidUntil(''); setTaxRate(0); setNotes(''); setLineItems([newItem()])
      await fetchQuotes(user!.id)
      setTimeout(() => { setPanelOpen(false); setMessage(null) }, 1000)
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('quotes').update({ status }).eq('id', id)
    setQuotes((prev) => prev.map((q) => q.id === id ? { ...q, status } : q))
  }

  const deleteQuote = async (id: string) => {
    if (!confirm('Delete this quote?')) return
    await supabase.from('quotes').delete().eq('id', id)
    setQuotes((prev) => prev.filter((q) => q.id !== id))
  }

  const filtered = quotes.filter((q) => {
    const matchFilter = filter === 'all' || q.status === filter
    const q2 = search.toLowerCase()
    const matchSearch = !q2 || q.title.toLowerCase().includes(q2) || (q.customers?.name || '').toLowerCase().includes(q2)
    return matchFilter && matchSearch
  })

  const counts = Object.fromEntries(Object.keys(STATUS_CFG).map((k) => [k, quotes.filter((q) => q.status === k).length]))

  const AddButton = (
    <button onClick={() => { setPanelOpen(true); setMessage(null) }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all">
      <Plus className="h-4 w-4" /> New Quote
    </button>
  )

  if (pageLoading) return (
    <AppLayout title="Quotes"><div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}</div></AppLayout>
  )

  const totalValue    = quotes.reduce((s, q) => s + q.total, 0)
  const approvedValue = quotes.filter((q) => q.status === 'approved').reduce((s, q) => s + q.total, 0)
  const acceptRate    = quotes.length > 0 ? (quotes.filter((q) => q.status === 'approved').length / quotes.filter((q) => q.status !== 'draft').length) * 100 : 0

  return (
    <AppLayout title="Quotes" actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Quotes', value: quotes.length, icon: FileSignature, bg: 'bg-indigo-50', color: 'text-indigo-600' },
            { label: 'Total Value', value: fmt(totalValue), icon: DollarSign, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Approved', value: fmt(approvedValue), icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Acceptance Rate', value: `${isNaN(acceptRate) ? 0 : acceptRate.toFixed(0)}%`, icon: Tag, bg: 'bg-blue-50', color: 'text-blue-600' },
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
            {[{ key: 'all', label: 'All', count: quotes.length }, ...Object.entries(STATUS_CFG).map(([key, cfg]) => ({ key, label: cfg.label, count: counts[key] || 0 }))].map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={['flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all', filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}>
                {f.label} <span className={`h-4 min-w-4 inline-flex items-center justify-center rounded-full px-1 text-xs ${filter === f.key ? 'bg-gray-100 text-gray-600' : 'text-gray-400'}`}>{f.count}</span>
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search quotes..." value={search} onChange={(e) => setSearch(e.target.value)} className="block rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm w-56" />
          </div>
        </div>

        {quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50"><FileSignature className="h-7 w-7 text-indigo-500" /></div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No quotes yet</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">Create professional quotes with line items and send them to customers for approval.</p>
            <button onClick={() => setPanelOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"><Plus className="h-4 w-4" /> Create first quote</button>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead><tr className="bg-gray-50">{['Quote', 'Customer', 'Total', 'Valid Until', 'Status', ''].map((c) => <th key={c} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((q) => {
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
                          {q.valid_until ? new Date(q.valid_until).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${scfg?.cls || ''}`}>{scfg?.label || q.status}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {q.status === 'draft' && (
                              <button onClick={() => updateStatus(q.id, 'sent')} className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-50 transition-colors" title="Mark as Sent">
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            {q.status === 'sent' && (
                              <button onClick={() => updateStatus(q.id, 'approved')} className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50 transition-colors" title="Mark as Approved">
                                <CheckCircle className="h-4 w-4" />
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
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${scfg?.cls || ''}`}>{scfg?.label}</span>
                        <span className="text-sm font-bold text-gray-900">{fmt(q.total)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create quote panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm fade-in" onClick={() => setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-white shadow-2xl slide-over flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div><h2 className="text-base font-semibold text-gray-900">New Quote</h2><p className="text-xs text-gray-400 mt-0.5">Build a professional quote with line items</p></div>
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={createQuote} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. HVAC Installation — Smith Residence" value={title} onChange={(e) => setTitle(e.target.value)} required className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer</label>
                  <select value={customerId} onChange={(e) => setCustId(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                    <option value="">Select customer</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Valid Until</label>
                  <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Line Items</label>
                  <button type="button" onClick={() => setLineItems([...lineItems, newItem()])} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add item
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
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{fmt(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Tax rate</span>
                  <div className="flex items-center gap-1.5">
                    <input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} min={0} max={100} step="0.5" className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm text-right text-gray-900 focus:border-indigo-500 focus:outline-none" />
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium">{fmt(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-indigo-600">{fmt(total)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea placeholder="Terms, notes, or additional information..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
              </div>

              {message && (
                <div className={`flex items-start gap-2.5 rounded-xl p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                  {message.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                  {message.text}
                </div>
              )}
            </form>

            <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={() => setPanelOpen(false)} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={createQuote} disabled={loading} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all">
                {loading ? 'Creating...' : 'Create Quote'}
              </button>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}
