'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/lib/hooks/usePagination'
import Link from 'next/link'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import MobileFAB from '@/components/MobileFAB'
import { usePlan } from '@/lib/hooks/usePlan'
import { normalizePlan } from '@/lib/plan-limits'
import UpgradePrompt from '@/components/UpgradePrompt'
import { validateRequired } from '@/lib/validators'
import FieldError from '@/components/FieldError'
import EmptyState from '@/components/EmptyState'
import { SkeletonText, SkeletonCard } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtDate } from '@/lib/format'
import { getEffectiveJobStatus } from '@/lib/job-status'
import { JOB_COLORS } from '@/lib/status-colors'
import {
  Briefcase, Plus, X, Calendar, User, CheckCircle,
  Search, ChevronRight, MoreHorizontal, Trash2, Clock, Zap, Flag, Lock,
} from 'lucide-react'

interface Job {
  id: string; title: string; description: string | null; status: string
  priority: string | null; scheduled_date: string | null; created_at: string
  start_time: string | null; end_time: string | null
  is_multi_day: boolean | null; end_date: string | null; progress_percent: number | null
  customers: { name: string } | null
}
interface Customer { id: string; name: string }

function jobBadgeCls(status: string): string {
  const c = JOB_COLORS[status] || JOB_COLORS.scheduled
  const pulse = status === 'in_progress' || status === 'needs_completion' ? ' animate-pulse' : ''
  const opacity = status === 'cancelled' ? ' opacity-60' : ''
  return `${c.bg} ${c.text} ${c.darkBg} ${c.darkText}${pulse}${opacity}`
}
function getPriorityCfg(fr: boolean): Record<string, { label: string; cls: string; icon: string }> {
  return {
    low:    { label: fr ? 'Faible' : 'Low',      cls: 'text-gray-400', icon: '↓' },
    normal: { label: fr ? 'Normal' : 'Normal',   cls: 'text-blue-500', icon: '→' },
    high:   { label: fr ? 'Élevée' : 'High',     cls: 'text-amber-500', icon: '↑' },
    urgent: { label: fr ? 'Urgent' : 'Urgent',   cls: 'text-red-500',  icon: '⚡' },
  }
}

export default function JobsPage() {
  const [user, setUser]       = useState<{ id: string } | null>(null)
  const [jobs, setJobs]       = useState<Job[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch]   = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [jobsThisMonth, setJobsThisMonth] = useState(0)
  const plan = usePlan()

  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const [title, setTitle]       = useState('')
  const [description, setDesc]  = useState('')
  const [customerId, setCustId] = useState('')
  const [scheduledDate, setDate] = useState('')
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [endDate, setEndDateVal] = useState('')
  const [progressPct, setProgressPct] = useState(0)
  const [status, setStatus]     = useState('scheduled')
  const [priority, setPriority] = useState('normal')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime]   = useState('')
  const [touched, setTouched]   = useState<Record<string, boolean>>({})
  const confirm = useConfirm()
  const { lang, t } = useLanguage()
  const fr = lang === 'fr'
  const tStatus = (k: string) => (t.status as Record<string, string>)[k] || k
  const PRIORITY_CFG = getPriorityCfg(fr)

  const errTitle = touched.title ? validateRequired(title) : ''
  const formInvalid = !!validateRequired(title)

  const isDemarrage = normalizePlan(plan.plan) === 'demarrage'

  const openAddJob = () => {
    if (isDemarrage && plan.limits.maxJobsPerMonth !== Infinity && jobsThisMonth >= plan.limits.maxJobsPerMonth) {
      toast.error(fr
        ? `Limite de ${plan.limits.maxJobsPerMonth} interventions ce mois-ci atteinte sur le forfait Démarrage. Passez à Pro pour un nombre illimité.`
        : `Démarrage plan limit of ${plan.limits.maxJobsPerMonth} jobs this month reached. Upgrade to Pro for unlimited.`)
      return
    }
    setPanelOpen(true)
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      await Promise.all([fetchJobs(data.user.id), fetchCustomers(data.user.id), fetchJobsThisMonth(data.user.id)])
      setPageLoading(false)
    }
    init()
  }, [])

  const fetchJobsThisMonth = async (uid: string) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { count } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .gte('created_at', startOfMonth)
    setJobsThisMonth(count || 0)
  }

  const fetchJobs = async (_uid: string) => {
    try {
      const res = await fetch('/api/jobs', { cache: 'no-store' })
      const data = await res.json()
      setJobs((data.jobs || []) as unknown as Job[])
    } catch (e) {
      console.error('[jobs] fetch failed:', e)
      setJobs([])
    }
  }
  const fetchCustomers = async (uid: string) => {
    const { data } = await supabase.from('customers').select('id, name').eq('user_id', uid).order('name')
    setCustomers(data || [])
  }

  const addJob = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ title: true })
    if (formInvalid) return
    // Re-check the monthly limit right before insert (defense-in-depth).
    if (isDemarrage && plan.limits.maxJobsPerMonth !== Infinity && jobsThisMonth >= plan.limits.maxJobsPerMonth) {
      toast.error(fr
        ? `Limite de ${plan.limits.maxJobsPerMonth} interventions ce mois-ci atteinte. Passez au forfait Pro.`
        : `Monthly job limit of ${plan.limits.maxJobsPerMonth} reached. Upgrade to Pro.`)
      return
    }
    // Demarrage plan cannot create multi-day jobs
    const effectiveIsMultiDay = isDemarrage ? false : isMultiDay
    setLoading(true)
    const { data: inserted, error } = await supabase.from('jobs').insert({
      user_id: user!.id, customer_id: customerId || null,
      title: title.trim(), description: description.trim() || null,
      scheduled_date: scheduledDate || null, status, priority,
      is_multi_day: effectiveIsMultiDay, end_date: effectiveIsMultiDay ? (endDate || null) : null,
      progress_percent: effectiveIsMultiDay ? Math.max(0, Math.min(100, progressPct)) : 0,
      start_time: startTime || null, end_time: endTime || null,
    }).select('id').single()
    if (error) { toast.error(error.message) }
    else {
      if (inserted?.id) {
        fetch('/api/integrations/google/sync-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: inserted.id, action: 'upsert' }),
        })
          .then(async (r) => console.log('[gcal sync insert]', r.status, await r.json().catch(() => null)))
          .catch((err) => console.error('[gcal sync insert] failed:', err))
      } else {
        console.warn('[gcal sync insert] insert succeeded but returned no id — RLS on implicit SELECT?')
      }
      toast.success(t.success.created)
      setTitle(''); setDesc(''); setCustId(''); setDate(''); setStatus('scheduled'); setPriority('normal'); setStartTime(''); setEndTime(''); setIsMultiDay(false); setEndDateVal(''); setProgressPct(0)
      await Promise.all([fetchJobs(user!.id), fetchJobsThisMonth(user!.id)])
      setPanelOpen(false)
    }
    setLoading(false)
  }

  const deleteJob = async (id: string) => {
    const { confirmed } = await confirm({
      title: fr ? 'Supprimer cette intervention ?' : 'Delete this job?',
      description: fr ? 'Cette action est irréversible.' : 'This cannot be undone.',
      confirmLabel: fr ? 'Supprimer' : 'Delete',
    })
    if (!confirmed) return
    fetch('/api/integrations/google/sync-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: id, action: 'delete' }),
    })
      .then(async (r) => console.log('[gcal sync delete]', r.status, await r.json().catch(() => null)))
      .catch((err) => console.error('[gcal sync delete] failed:', err))
    await supabase.from('jobs').delete().eq('id', id)
    setJobs((prev) => prev.filter((j) => j.id !== id))
    setMenuOpen(null)
  }

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from('jobs').update({ status: newStatus }).eq('id', id)
    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: newStatus } : j))
    setMenuOpen(null)
  }

  const filtered = useMemo(() => jobs.filter((j) => {
    const matchesFilter = activeFilter === 'all' || getEffectiveJobStatus(j) === activeFilter
    const q = search.toLowerCase()
    const matchesSearch = !q || j.title.toLowerCase().includes(q) ||
      (j.description || '').toLowerCase().includes(q) ||
      (j.customers?.name || '').toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  }), [jobs, activeFilter, search])

  const { page, setPage, range, pageSize, reset: resetPage } = usePagination(filtered.length)
  const paged = useMemo(() => filtered.slice(range.from, range.to), [filtered, range.from, range.to])
  useEffect(() => { resetPage() }, [activeFilter, search, resetPage])

  const countByStatus = (s: string) => jobs.filter((j) => getEffectiveJobStatus(j) === s).length

  const AddButton = (
    <button onClick={openAddJob} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all">
      <Plus className="h-4 w-4" /> {fr ? 'Nouvelle intervention' : 'New job'}
    </button>
  )

  if (pageLoading) return (
    <AppLayout title={fr ? 'Interventions' : 'Jobs'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-3">
        <SkeletonText className="h-10 w-64 mb-3" />
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} className="h-24" />)}
      </div>
    </AppLayout>
  )

  const statusFilters = [
    { key: 'all',              label: fr ? 'Toutes'        : 'All',                count: jobs.length,                          hex: null },
    { key: 'scheduled',        label: fr ? 'Planifiées'    : 'Scheduled',          count: countByStatus('scheduled'),           hex: JOB_COLORS.scheduled.hex },
    { key: 'in_progress',      label: fr ? 'En cours'       : 'In progress',       count: countByStatus('in_progress'),         hex: JOB_COLORS.in_progress.hex },
    { key: 'needs_completion', label: fr ? 'À compléter'    : 'Needs completion',  count: countByStatus('needs_completion'),    hex: JOB_COLORS.needs_completion.hex },
    { key: 'completed',        label: fr ? 'Complétées'     : 'Completed',         count: countByStatus('completed') + countByStatus('complete') + countByStatus('invoiced'), hex: JOB_COLORS.completed.hex },
    { key: 'cancelled',        label: fr ? 'Annulées'       : 'Cancelled',         count: countByStatus('cancelled'),           hex: JOB_COLORS.cancelled.hex },
  ]

  return (
    <AppLayout title={fr ? 'Interventions' : 'Jobs'} actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Usage bar — Démarrage plan only */}
        {isDemarrage && plan.limits.maxJobsPerMonth !== Infinity && (() => {
          const pct = Math.min(100, Math.round((jobsThisMonth / plan.limits.maxJobsPerMonth) * 100))
          const barCls = pct >= 92 ? 'bg-red-500' : pct >= 80 ? 'bg-orange-500' : 'bg-emerald-500'
          const txtCls = pct >= 92 ? 'text-red-700' : pct >= 80 ? 'text-orange-700' : 'text-gray-900'
          return (
            <div className="mb-4 rounded-xl border border-gray-100 bg-white px-4 py-3 space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className={`font-semibold ${txtCls}`}>
                  {jobsThisMonth} / {plan.limits.maxJobsPerMonth} {fr ? 'interventions ce mois' : 'jobs this month'}
                </span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500 flex-1 min-w-0 truncate">{fr ? 'Forfait Démarrage' : 'Démarrage plan'}</span>
                {pct >= 100 && (
                  <UpgradePrompt variant="inline" feature={fr ? 'Interventions illimitées' : 'Unlimited jobs'} requiredPlan="pro" />
                )}
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full ${barCls} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })()}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: fr ? 'Actives' : 'Active', value: countByStatus('scheduled') + countByStatus('in_progress'), icon: Briefcase, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: fr ? 'En cours' : 'In progress', value: countByStatus('in_progress'), icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
            { label: fr ? 'Terminées' : 'Completed', value: countByStatus('complete'), icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: fr ? 'Total' : 'Total', value: jobs.length, icon: Zap, bg: 'bg-violet-50', color: 'text-violet-600' },
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

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
            {statusFilters.map((f) => (
              <button key={f.key} onClick={() => setActiveFilter(f.key)}
                className={['flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all', activeFilter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}>
                {f.hex && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: f.hex }} />}
                {f.label}
                <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs ${activeFilter === f.key ? 'bg-gray-100 text-gray-600' : 'text-gray-400'}`}>{f.count}</span>
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={fr ? 'Rechercher…' : 'Search…'} value={search} onChange={(e) => setSearch(e.target.value)} className="block rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm w-64" />
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white">
            <EmptyState
              icon={Briefcase}
              title={fr ? 'Aucune intervention' : 'No jobs'}
              description={fr ? 'Créez votre première intervention ou attendez une réservation en ligne.' : 'Create your first job or wait for an online booking.'}
              actions={[{ label: fr ? 'Créer une intervention' : 'Create a job', onClick: openAddJob, variant: 'primary' }]}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <Search className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">{fr ? 'Aucun résultat pour vos filtres' : 'No results for your filters'}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    {(fr ? ['Intervention', 'Client', 'Priorité', 'Date', 'Statut', ''] : ['Job', 'Customer', 'Priority', 'Date', 'Status', '']).map((col) => (
                      <th key={col} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paged.map((job) => {
                    const effStatus = getEffectiveJobStatus(job)
                    const scls = jobBadgeCls(effStatus)
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
                          <span className={`flex items-center gap-1 text-sm font-medium ${pcfg.cls}`}><Flag className="h-3.5 w-3.5" />{pcfg.label}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.scheduled_date ? (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-gray-300" />
                              {job.is_multi_day && job.end_date
                                ? `${fmtDate(job.scheduled_date, lang)} — ${fmtDate(job.end_date, lang)}`
                                : fmtDate(job.scheduled_date, lang)}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                          {job.is_multi_day && effStatus === 'in_progress' && (
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-1 w-20 rounded-full bg-gray-200 overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: `${Math.max(0, Math.min(100, job.progress_percent ?? 0))}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{job.progress_percent ?? 0}%</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${scls || ''}`}>{tStatus(effStatus)}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/jobs/${job.id}`} className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><ChevronRight className="h-4 w-4" /></Link>
                            <div className="relative">
                              <button onClick={() => setMenuOpen(menuOpen === job.id ? null : job.id)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><MoreHorizontal className="h-4 w-4" /></button>
                              {menuOpen === job.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                                  <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-gray-100 bg-white shadow-lg py-1 slide-up">
                                    <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase">{fr ? 'Changer le statut' : 'Change status'}</p>
                                    {(['scheduled', 'in_progress', 'completed', 'cancelled'] as const).map((key) => (
                                      <button key={key} onClick={() => updateStatus(job.id, key)} className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${job.status === key ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}>
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: JOB_COLORS[key].hex }} />
                                        {tStatus(key)}
                                      </button>
                                    ))}
                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                      <button onClick={() => deleteJob(job.id)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /> {fr ? 'Supprimer' : 'Delete'}</button>
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

            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((job) => {
                const effStatus = getEffectiveJobStatus(job)
                const scls = jobBadgeCls(effStatus)
                const pcfg = PRIORITY_CFG[job.priority || 'normal']
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="block p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                        {job.customers && <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5"><User className="h-3 w-3" />{job.customers.name}</p>}
                        {job.scheduled_date && <p className="flex items-center gap-1 text-xs text-gray-400"><Calendar className="h-3 w-3" />{fmtDate(job.scheduled_date, lang)}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${scls || ''}`}>{tStatus(effStatus)}</span>
                        <span className={`text-xs font-medium ${pcfg.cls}`}>{pcfg.icon} {pcfg.label}</span>
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

      {panelOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm fade-in" onClick={() => setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl slide-over flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div><h2 className="text-base font-semibold text-gray-900">{fr ? 'Créer une intervention' : 'Create a job'}</h2><p className="text-xs text-gray-400 mt-0.5">{fr ? 'Nouveau bon de travail' : 'New work order'}</p></div>
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={addJob} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Titre' : 'Title'} <span className="text-red-500">*</span></label>
                <input type="text" placeholder={fr ? 'ex. Entretien climatisation' : 'e.g. AC maintenance'} value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                  required
                  className={`block w-full rounded-xl border ${errTitle ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                <FieldError message={errTitle} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Description' : 'Description'}</label>
                <textarea placeholder={fr ? 'Décrivez les travaux à effectuer…' : 'Describe the work to be done…'} value={description} onChange={(e) => setDesc(e.target.value)} rows={3} className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Client' : 'Customer'}</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select value={customerId} onChange={(e) => setCustId(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                    <option value="">{fr ? 'Aucun client sélectionné' : 'No customer selected'}</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Priorité' : 'Priority'}</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                    <option value="low">{fr ? 'Faible' : 'Low'}</option>
                    <option value="normal">{fr ? 'Normal' : 'Normal'}</option>
                    <option value="high">{fr ? 'Élevée' : 'High'}</option>
                    <option value="urgent">{fr ? 'Urgent' : 'Urgent'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Statut' : 'Status'}</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                    <option value="scheduled">{tStatus('scheduled')}</option>
                    <option value="in_progress">{tStatus('in_progress')}</option>
                    <option value="complete">{tStatus('complete')}</option>
                    <option value="cancelled">{tStatus('cancelled')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Date planifiée' : 'Scheduled date'}</label>
                <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="date" value={scheduledDate} onChange={(e) => setDate(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Heure début' : 'Start time'}</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Heure fin' : 'End time'}</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
              </div>

              {isDemarrage ? (
                <div
                  className="flex items-center gap-2 text-sm text-gray-400 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 cursor-not-allowed"
                  title={fr ? 'Disponible avec le plan Pro' : 'Available with the Pro plan'}
                >
                  <Lock className="h-3.5 w-3.5 text-gray-400" />
                  <span>{fr ? 'Intervention sur plusieurs jours' : 'Multi-day job'}</span>
                  <span className="text-xs text-gray-500 ml-auto">{fr ? 'Disponible avec Pro' : 'Available with Pro'}</span>
                </div>
              ) : (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={isMultiDay} onChange={(e) => setIsMultiDay(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  {fr ? 'Intervention sur plusieurs jours' : 'Multi-day job'}
                </label>
              )}
              {!isDemarrage && isMultiDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Date de fin' : 'End date'}</label>
                    <input type="date" value={endDate} min={scheduledDate || undefined} onChange={(e) => setEndDateVal(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Progression' : 'Progress'} — {progressPct}%</label>
                    <input type="range" min={0} max={100} value={progressPct} onChange={(e) => setProgressPct(parseInt(e.target.value, 10))} className="block w-full mt-3" />
                  </div>
                </div>
              )}

            </form>

            <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={() => setPanelOpen(false)} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">{fr ? 'Annuler' : 'Cancel'}</button>
              <button onClick={addJob} disabled={loading || formInvalid} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                {loading ? (fr ? 'Création…' : 'Creating…') : (fr ? 'Créer' : 'Create')}
              </button>
            </div>
          </div>
        </>
      )}
      <MobileFAB onClick={openAddJob} label={fr ? 'Nouvelle intervention' : 'New job'} />
    </AppLayout>
  )
}
