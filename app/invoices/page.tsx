'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import {
  FileText,
  Plus,
  X,
  DollarSign,
  Calendar,
  User,
  Briefcase,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Clock,
} from 'lucide-react'

interface Invoice {
  id: string
  amount: number
  status: string
  due_date: string | null
  created_at: string
  customers: { name: string } | null
  jobs: { title: string } | null
}

interface Customer { id: string; name: string }
interface Job { id: string; title: string }

const statusConfig: Record<string, { label: string; className: string }> = {
  unpaid: { label: 'Unpaid', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  overdue: { label: 'Overdue', className: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
}

const statusFilters = ['all', 'unpaid', 'paid', 'overdue']

export default function InvoicesPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [panelOpen, setPanelOpen] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  // Form
  const [customerId, setCustomerId] = useState('')
  const [jobId, setJobId] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState('unpaid')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      await Promise.all([fetchInvoices(data.user.id), fetchCustomers(data.user.id), fetchJobs(data.user.id)])
      setPageLoading(false)
    }
    init()
  }, [])

  const fetchInvoices = async (userId: string) => {
    const { data } = await supabase
      .from('invoices')
      .select('*, customers(name), jobs(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setInvoices(data || [])
  }

  const fetchCustomers = async (userId: string) => {
    const { data } = await supabase.from('customers').select('id, name').eq('user_id', userId)
    setCustomers(data || [])
  }

  const fetchJobs = async (userId: string) => {
    const { data } = await supabase.from('jobs').select('id, title').eq('user_id', userId)
    setJobs(data || [])
  }

  const addInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId || !amount) { setMessage({ text: 'Customer and amount are required.', type: 'error' }); return }
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.from('invoices').insert({
      user_id: user!.id,
      customer_id: customerId,
      job_id: jobId || null,
      amount: parseFloat(amount),
      due_date: dueDate || null,
      status,
    })
    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      setMessage({ text: 'Invoice created!', type: 'success' })
      setCustomerId(''); setJobId(''); setAmount(''); setDueDate(''); setStatus('unpaid')
      await fetchInvoices(user!.id)
      setTimeout(() => { setPanelOpen(false); setMessage(null) }, 1200)
    }
    setLoading(false)
  }

  const filtered = activeFilter === 'all' ? invoices : invoices.filter(i => i.status === activeFilter)

  const totalAll = invoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
  const totalUnpaid = invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + parseFloat(String(i.amount)), 0)

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const countByStatus = (s: string) => invoices.filter(i => i.status === s).length

  const AddButton = (
    <button
      onClick={() => { setPanelOpen(true); setMessage(null) }}
      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all duration-150"
    >
      <Plus className="h-4 w-4" />
      New Invoice
    </button>
  )

  if (pageLoading) {
    return (
      <AppLayout title="Invoices">
        <div className="flex h-full items-center justify-center p-12">
          <div className="flex items-center gap-3 text-gray-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
            <span className="text-sm">Loading invoices...</span>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Invoices" actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          {[
            { label: 'Total Invoiced', value: fmt(totalAll), icon: DollarSign, bg: 'bg-indigo-50', color: 'text-indigo-600', count: invoices.length },
            { label: 'Paid', value: fmt(totalPaid), icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600', count: countByStatus('paid') },
            { label: 'Unpaid', value: fmt(totalUnpaid), icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600', count: countByStatus('unpaid') },
            { label: 'Overdue', value: fmt(totalOverdue), icon: AlertCircle, bg: 'bg-red-50', color: 'text-red-600', count: countByStatus('overdue') },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.bg}`}>
                  <card.icon className={`h-4.5 w-4.5 ${card.color}`} style={{width: '18px', height: '18px'}} />
                </div>
                <span className="text-xs text-gray-400">{card.count} invoices</span>
              </div>
              <p className="text-xs font-medium text-gray-400 mb-1">{card.label}</p>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
          {statusFilters.map((f) => {
            const count = f === 'all' ? invoices.length : countByStatus(f)
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={[
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                  activeFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                ].join(' ')}
              >
                {f === 'all' ? 'All' : statusConfig[f]?.label}
                <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs ${activeFilter === f ? 'bg-gray-100 text-gray-600' : 'text-gray-400'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Invoices list */}
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
              <FileText className="h-7 w-7 text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No invoices yet</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">Create your first invoice to start tracking your business revenue.</p>
            <button
              onClick={() => setPanelOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create your first invoice
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <FileText className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No {statusConfig[activeFilter]?.label.toLowerCase()} invoices</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((inv) => {
                    const cfg = statusConfig[inv.status]
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-gray-300" />
                            {inv.customers?.name || <span className="text-gray-300">—</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {inv.jobs ? (
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5 text-gray-300" />
                              {inv.jobs.title}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {fmt(parseFloat(String(inv.amount)))}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {inv.due_date ? (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-gray-300" />
                              {new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg?.className || ''}`}>
                            {cfg?.label || inv.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((inv) => {
                const cfg = statusConfig[inv.status]
                return (
                  <div key={inv.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-base font-bold text-gray-900">{fmt(parseFloat(String(inv.amount)))}</p>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cfg?.className || ''}`}>
                        {cfg?.label || inv.status}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-xs text-gray-400">
                      {inv.customers && <p className="flex items-center gap-1"><User className="h-3 w-3" />{inv.customers.name}</p>}
                      {inv.jobs && <p className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{inv.jobs.title}</p>}
                      {inv.due_date && <p className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due {inv.due_date}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Slide-over panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm fade-in" onClick={() => setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl slide-over flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Create Invoice</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the invoice details</p>
              </div>
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={addInvoice} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                    className="block w-full appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="">Select a customer</option>
                    {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Linked Job</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    className="block w-full appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="">No job linked</option>
                    {jobs.map((j) => (<option key={j.id} value={j.id}>{j.title}</option>))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="block w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              {message && (
                <div className={`flex items-start gap-2.5 rounded-xl p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                  {message.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                  {message.text}
                </div>
              )}
            </form>

            <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={() => setPanelOpen(false)} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={addInvoice} disabled={loading} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                {loading ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}
