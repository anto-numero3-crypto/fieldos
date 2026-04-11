'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import {
  Briefcase, Plus, X, Calendar, User, AlertCircle, CheckCircle,
  Search, ChevronRight, MoreHorizontal, Trash2, Clock, Zap, Flag,
} from 'lucide-react'

interface Job {
  id: string; title: string; description: string | null; status: string
  priority: string | null; scheduled_date: string | null; created_at: string
  customers: { name: string } | null
}
interface Customer { id: string; name: string }

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  scheduled:   { label: 'Scheduled',   cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  complete:    { label: 'Complete',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-gray-50 text-gray-500 ring-1 ring-gray-100' },
}
const PRIORITY_CFG: Record<string, { label: string; cls: string; icon: string }> = {
  low:    { label: 'Low',    cls: 'text-gray-400', icon: '↓' },
  normal: { label: 'Normal', cls: 'text-blue-500', icon: '→' },
  high:   { label: 'High',   cls: 'text-amber-500', icon: '↑' },
  urgent: { label: 'Urgent', cls: 'text-red-500',  icon: '⚡' },
}

export default function JobsPage() {
  const [user, setUser]       = useState<{ id: string } | null>(null)
  const [jobs, setJobs]       = useState<Job[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch]   = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  // Form
  const [title, setTitle]       = useState('')
  const [description, setDesc]  = useState('')
  const [customerId, setCustId] = useState('')
  const [scheduledDate, setDate] = useState('')
  const [status, setStatus]     = useState('scheduled')
  const [priority, setPriority] = useState('normal')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime]   = useState('')

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      await Promise.all([fetchJobs(data.user.id), fetchCustomers(data.user.id)])
      setPageLoading(false)
    }
    init()
  }, [])

  const fetchJobs = async (uid: string) => {
    const { data } = await supabase.from('jobs').select('id, title, description, status, priority, scheduled_date, created_at, customers(name)').eq('user_id', uid).order('created_at', { ascending: false })
    setJobs((data || []) as unknown as Job[])
  }
  const fetchCustomers = async (uid: string) => {
    const { data } = await supabase.from('customers').select('id, name').eq('user_id', uid).order('name')
    setCustomers(data || [])
  }

  const addJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setMessage({ text: 'Job title is required.', type: 'error' }); return }
    setLoading(true); setMessage(null)
    const { error } = await supabase.from('jobs').insert({
      user_id: user!.id, customer_id: customerId || null,
      title: title.trim(), description: description.trim() || null,
      scheduled_date: scheduledDate || null, status, priority,
      start_time: startTime || null, end_time: endTime || null,
    })
    if (error) { setMessage({ text: error.message, type: 'error' }) }
    else {
      setMessage({ text: 'Job created!', type: 'success' })
      setTitle(''); setDesc(''); setCustId(''); setDate(''); setStatus('scheduled'); setPriority('normal'); setStartTime(''); setEndTime('')
      await fetchJobs(user!.id)
      setTimeout(() => { setPanelOpen(false); setMessage(null) }, 1000)
    }
    setLoading(false)
  }

  const deleteJob = async (id: string) => {
    if (!confirm('Delete this job?')) return
    await supabase.from('jobs').delete().eq('id', id)
    setJobs((prev) => prev.filter((j) => j.id !== id))
    setMenuOpen(null)
  }

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from('jobs').update({ status: newStatus }).eq('id', id)
    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: newStatus } : j))
    setMenuOpen(null)
  }

  const filtered = jobs.filter((j) => {
    const matchesFilter = activeFilter === 'all' || j.status === activeFilter
    const q = search.toLowerCase()
    const matchesSearch = !q || j.title.toLowerCase().includes(q) ||
      (j.description || '').toLowerCase().includes(q) ||
      (j.customers?.name || '').toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const countByStatus = (s: string) => jobs.filter((j) => j.status === s).length

  const AddButton = (
    <button onClick={() => { setPanelOpen(true); setMessage(null) }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all">
      <Plus className="h-4 w-4" /> New Job
    </button>
  )

  if (pageLoading) return (
    <AppLayout title="Jobs">
      <div className="p-6 space-y-3">
        <div className="h-10 w-64 skeleton rounded-xl" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
      </div>
    </AppLayout>
  )

  const statusFilters = [
    { key: 'all', label: 'All', count: jobs.length },
    { key: 'scheduled', label: 'Scheduled', count: countByStatus('scheduled') },
    { key: 'in_progress', label: 'In Progress', count: countByStatus('in_progress') },
    { key: 'complete', label: 'Complete', count: countByStatus('complete') },
    { key: 'cancelled', label: 'Cancelled', count: countByStatus('cancelled') },
  ]

  return (
    <AppLayout title="Jobs" actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Jobs', value: countByStatus('scheduled') + countByStatus('in_progress'), icon: Briefcase, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'In Progress', value: countByStatus('in_progress'), icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
            { label: 'Completed', value: countByStatus('complete'), icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Total Jobs', value: jobs.length, icon: Zap, bg: 'bg-violet-50', color: 'text-violet-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${s.bg} mb-2`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={['flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all', activeFilter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}
              >
                {f.label}
                <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs ${activeFilter === f.key ? 'bg-gray-100 text-gray-600' : 'text-gray-400'}`}>{f.count}</span>
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="block rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm w-64" />
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50"><Briefcase className="h-7 w-7 text-violet-500" /></div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No jobs yet</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">Create your first work order to start tracking field jobs.</p>
            <button onClick={() => setPanelOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              <Plus className="h-4 w-4" /> Create your first job
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <Search className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No jobs match your filters</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    {['Job', 'Customer', 'Priority', 'Scheduled', 'Status', ''].map((col) => (
                      <th key={col} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((job) => {
                    const scfg = STATUS_CFG[job.status]
                    const pcfg = PRIORITY_CFG[job.priority || 'normal']
                    return (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-5 py-4">
                          <Link href={`/jobs/${job.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors">{job.title}</Link>
                          {job.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{job.description}</p>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.customers ? <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-gray-300" />{job.customers.name}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`flex items-center gap-1 text-sm font-medium ${pcfg.cls}`}>
                            <Flag className="h-3.5 w-3.5" />{pcfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.scheduled_date ? (
                            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-300" />{new Date(job.scheduled_date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${scfg?.cls || ''}`}>{scfg?.label || job.status}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/jobs/${job.id}`} className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                            <div className="relative">
                              <button onClick={() => setMenuOpen(menuOpen === job.id ? null : job.id)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                              {menuOpen === job.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                                  <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-gray-100 bg-white shadow-lg py-1 slide-up">
                                    <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase">Set Status</p>
                                    {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                                      <button key={key} onClick={() => updateStatus(job.id, key)} className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${job.status === key ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}>
                                        <span className={`h-2 w-2 rounded-full ${key === 'scheduled' ? 'bg-blue-500' : key === 'in_progress' ? 'bg-amber-500' : key === 'complete' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                        {cfg.label}
                                      </button>
                                    ))}
                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                      <button onClick={() => deleteJob(job.id)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                        <Trash2 className="h-4 w-4" /> Delete
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((job) => {
                const scfg = STATUS_CFG[job.status]
                const pcfg = PRIORITY_CFG[job.priority || 'normal']
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="block p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                        {job.customers && <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5"><User className="h-3 w-3" />{job.customers.name}</p>}
                        {job.scheduled_date && <p className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="h-3 w-3" />{new Date(job.scheduled_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${scfg?.cls || ''}`}>{scfg?.label || job.status}</span>
                        <span className={`text-xs font-medium ${pcfg.cls}`}>{pcfg.icon} {pcfg.label}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add job panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm fade-in" onClick={() => setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl slide-over flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div><h2 className="text-base font-semibold text-gray-900">Create Job</h2><p className="text-xs text-gray-400 mt-0.5">Create a new work order</p></div>
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={addJob} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. HVAC Maintenance" value={title} onChange={(e) => setTitle(e.target.value)} required className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea placeholder="Describe the work to be done..." value={description} onChange={(e) => setDesc(e.target.value)} rows={3} className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select value={customerId} onChange={(e) => setCustId(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                    <option value="">No customer selected</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="complete">Complete</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Scheduled Date</label>
                <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="date" value={scheduledDate} onChange={(e) => setDate(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
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
              <button onClick={addJob} disabled={loading} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all">
                {loading ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}
