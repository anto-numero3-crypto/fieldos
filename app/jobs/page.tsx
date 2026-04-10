'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import { useLanguage } from '@/lib/LanguageContext'
import { Briefcase, Plus, X, Calendar, User, AlertCircle, CheckCircle } from 'lucide-react'

interface Job {
  id: string; title: string; description: string | null; status: string
  scheduled_date: string | null; created_at: string; customers: { name: string } | null
}
interface Customer { id: string; name: string }

export default function JobsPage() {
  const { t } = useLanguage()
  const l = t.jobs

  const statusConfig: Record<string, { label: string; className: string }> = {
    scheduled: { label: l.scheduled, className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
    in_progress: { label: l.inProgress, className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
    complete: { label: l.complete, className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
    cancelled: { label: l.cancelled, className: 'bg-gray-50 text-gray-500 ring-1 ring-gray-100' },
  }

  const [user, setUser] = useState<{ id: string } | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [panelOpen, setPanelOpen] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [status, setStatus] = useState('scheduled')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

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

  const fetchJobs = async (userId: string) => {
    const { data } = await supabase.from('jobs').select('*, customers(name)').eq('user_id', userId).order('created_at', { ascending: false })
    setJobs(data || [])
  }
  const fetchCustomers = async (userId: string) => {
    const { data } = await supabase.from('customers').select('id, name').eq('user_id', userId)
    setCustomers(data || [])
  }

  const addJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setMessage({ text: l.errorRequired, type: 'error' }); return }
    setLoading(true); setMessage(null)
    const { error } = await supabase.from('jobs').insert({ user_id: user!.id, customer_id: customerId || null, title: title.trim(), description: description.trim() || null, scheduled_date: scheduledDate || null, status })
    if (error) { setMessage({ text: error.message, type: 'error' }) }
    else {
      setMessage({ text: l.successMsg, type: 'success' })
      setTitle(''); setDescription(''); setCustomerId(''); setScheduledDate(''); setStatus('scheduled')
      await fetchJobs(user!.id)
      setTimeout(() => { setPanelOpen(false); setMessage(null) }, 1200)
    }
    setLoading(false)
  }

  const filtered = activeFilter === 'all' ? jobs : jobs.filter(j => j.status === activeFilter)
  const countByStatus = (s: string) => jobs.filter(j => j.status === s).length

  const statusFilters = [
    { key: 'all', label: l.all },
    { key: 'scheduled', label: l.scheduled },
    { key: 'in_progress', label: l.inProgress },
    { key: 'complete', label: l.complete },
    { key: 'cancelled', label: l.cancelled },
  ]

  const AddButton = (
    <button onClick={() => { setPanelOpen(true); setMessage(null) }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all duration-150">
      <Plus className="h-4 w-4" />{l.newBtn}
    </button>
  )

  if (pageLoading) return (
    <AppLayout title={l.title}>
      <div className="flex h-full items-center justify-center p-12">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
          <span className="text-sm">{l.loading}</span>
        </div>
      </div>
    </AppLayout>
  )

  return (
    <AppLayout title={l.title} actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
          {statusFilters.map((f) => {
            const count = f.key === 'all' ? jobs.length : countByStatus(f.key)
            return (
              <button key={f.key} onClick={() => setActiveFilter(f.key)} className={['flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150', activeFilter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}>
                {f.label}
                <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs ${activeFilter === f.key ? 'bg-gray-100 text-gray-600' : 'text-gray-400'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50"><Briefcase className="h-7 w-7 text-violet-500" /></div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{l.noJobs}</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">{l.noJobsSub}</p>
            <button onClick={() => setPanelOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"><Plus className="h-4 w-4" />{l.createFirstBtn}</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <Briefcase className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">{l.noJobsStatus(statusConfig[activeFilter]?.label || activeFilter)}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    {[l.colJob, l.colCustomer, l.colScheduled, l.colStatus].map(col => (
                      <th key={col} className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((job) => {
                    const cfg = statusConfig[job.status]
                    return (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{job.title}</p>
                          {job.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{job.description}</p>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.customers ? <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-gray-300" />{job.customers.name}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.scheduled_date ? <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-300" />{new Date(job.scheduled_date).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg?.className || ''}`}>{cfg?.label || job.status}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((job) => {
                const cfg = statusConfig[job.status]
                return (
                  <div key={job.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{job.title}</p>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cfg?.className || ''}`}>{cfg?.label || job.status}</span>
                    </div>
                    {job.description && <p className="text-xs text-gray-400">{job.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {job.customers && <span className="flex items-center gap-1"><User className="h-3 w-3" />{job.customers.name}</span>}
                      {job.scheduled_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{job.scheduled_date}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {panelOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm fade-in" onClick={() => setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl slide-over flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div><h2 className="text-base font-semibold text-gray-900">{l.panelTitle}</h2><p className="text-xs text-gray-400 mt-0.5">{l.panelSub}</p></div>
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={addJob} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{l.labelTitle} <span className="text-red-500">*</span></label>
                <input type="text" placeholder={l.placeholderTitle} value={title} onChange={(e) => setTitle(e.target.value)} required className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{l.labelDesc}</label>
                <textarea placeholder={l.placeholderDesc} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{l.labelCustomer}</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                    <option value="">{l.noCustomerOption}</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{l.labelDate}</label>
                <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{l.labelStatus}</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                  <option value="scheduled">{l.scheduled}</option>
                  <option value="in_progress">{l.inProgress}</option>
                  <option value="complete">{l.complete}</option>
                  <option value="cancelled">{l.cancelled}</option>
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
              <button type="button" onClick={() => setPanelOpen(false)} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">{t.common.cancel}</button>
              <button onClick={addJob} disabled={loading} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                {loading ? l.creatingBtn : l.createBtn}
              </button>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}
