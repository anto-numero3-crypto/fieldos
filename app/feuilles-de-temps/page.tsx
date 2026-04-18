'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import { useLanguage } from '@/lib/LanguageContext'
import { isModuleEnabled } from '@/lib/modules'
import {
  Clock, ChevronLeft, ChevronRight, Loader2, Lock, Users, DollarSign,
  CheckCircle, AlertCircle, Pause,
} from 'lucide-react'
import Link from 'next/link'

interface TimeEntry {
  id: string
  user_id: string
  team_member_id: string
  job_id: string | null
  clocked_in_at: string
  clocked_out_at: string | null
  duration_minutes: number | null
  notes: string | null
  billable: boolean
  status?: string
  paused_duration_minutes?: number
  pause_started_at?: string | null
  employee_name: string
  employee_color?: string | null
  hourly_rate: number | null
  jobs: { id: string; title: string; customers: { name: string } | null } | null
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  hourly_rate: number | null
}

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function fmtDateShort(d: Date, fr: boolean): string {
  return d.toLocaleDateString(fr ? 'fr-CA' : 'en-CA', { month: 'short', day: 'numeric' })
}

function fmtDateISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function fmtDuration(mins: number | null): string {
  if (!mins) return '-'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${String(m).padStart(2, '0')}min`
}

function computeLiveMinutes(entry: TimeEntry): number {
  const start = new Date(entry.clocked_in_at).getTime()
  const pausedMs = (entry.paused_duration_minutes || 0) * 60000
  if (entry.status === 'paused' && entry.pause_started_at) {
    const pauseAt = new Date(entry.pause_started_at).getTime()
    return Math.max(0, Math.round(((pauseAt - start) - pausedMs) / 60000))
  }
  return Math.max(0, Math.round(((Date.now() - start) - pausedMs) / 60000))
}

function LiveTimer({ entry }: { entry: TimeEntry }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (entry.status === 'paused') return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [entry.status])

  const start = new Date(entry.clocked_in_at).getTime()
  const pausedMs = (entry.paused_duration_minutes || 0) * 60000
  let workedMs: number
  if (entry.status === 'paused' && entry.pause_started_at) {
    const pauseAt = new Date(entry.pause_started_at).getTime()
    workedMs = (pauseAt - start) - pausedMs
  } else {
    workedMs = (now - start) - pausedMs
  }
  const totalSec = Math.max(0, Math.floor(workedMs / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  return (
    <span className="font-mono">
      {h}h {String(m).padStart(2, '0')}min {String(s).padStart(2, '0')}s
    </span>
  )
}

export default function TimesheetsPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const [loading, setLoading] = useState(true)
  const [moduleEnabled, setModuleEnabled] = useState(false)
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Check module access
  useEffect(() => {
    const check = async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return
      const { data: org } = await supabase
        .from('organizations')
        .select('plan, enabled_modules')
        .eq('owner_user_id', authData.user.id)
        .maybeSingle()
      if (org && isModuleEnabled(org.enabled_modules, org.plan, 'time_tracking')) {
        setModuleEnabled(true)
      }

      // Fetch employees for filter
      const { data: emps } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, hourly_rate')
        .eq('org_id', (await supabase.from('organizations').select('id').eq('owner_user_id', authData.user.id).single()).data?.id || '')
        .eq('status', 'active')
      if (emps) setEmployees(emps)

      setLoading(false)
    }
    check()
  }, [])

  const fetchEntries = useCallback(async () => {
    if (!moduleEnabled) return
    const from = fmtDateISO(weekStart)
    const to = fmtDateISO(addDays(weekStart, 6))
    const params = new URLSearchParams({ from, to })
    if (selectedEmployee !== 'all') params.set('employee_id', selectedEmployee)

    const res = await fetch(`/api/time/entries?${params}`)
    if (res.ok) {
      const data = await res.json()
      setEntries(data.entries || [])
    }
  }, [moduleEnabled, weekStart, selectedEmployee])

  // Fetch entries when week or employee changes
  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!moduleEnabled) return
    refreshRef.current = setInterval(fetchEntries, 30000)
    return () => { if (refreshRef.current) clearInterval(refreshRef.current) }
  }, [moduleEnabled, fetchEntries])

  const weekEnd = addDays(weekStart, 6)

  const totalHours = useMemo(() => {
    return entries.reduce((sum, e) => {
      if (e.clocked_out_at) return sum + (e.duration_minutes || 0)
      return sum + computeLiveMinutes(e)
    }, 0) / 60
  }, [entries])

  const completedCount = useMemo(() => {
    return entries.filter(e => e.clocked_out_at || e.status === 'completed').length
  }, [entries])

  const pendingCount = useMemo(() => {
    return entries.filter(e => !e.clocked_out_at && (e.status === 'active' || e.status === 'paused')).length
  }, [entries])

  const estimatedCost = useMemo(() => {
    return entries.reduce((sum, e) => {
      const mins = e.clocked_out_at ? (e.duration_minutes || 0) : computeLiveMinutes(e)
      const rate = e.hourly_rate || 0
      return sum + (mins / 60) * rate
    }, 0)
  }, [entries])

  // Group by employee, active/paused entries first
  const grouped = useMemo(() => {
    const map: Record<string, { name: string; color: string | null; entries: TimeEntry[] }> = {}
    for (const e of entries) {
      const key = e.employee_name || 'Unknown'
      if (!map[key]) map[key] = { name: key, color: e.employee_color || null, entries: [] }
      map[key].entries.push(e)
    }
    // Sort entries within each group: active/paused first
    for (const g of Object.values(map)) {
      g.entries.sort((a, b) => {
        const aActive = !a.clocked_out_at ? 0 : 1
        const bActive = !b.clocked_out_at ? 0 : 1
        if (aActive !== bActive) return aActive - bActive
        return new Date(b.clocked_in_at).getTime() - new Date(a.clocked_in_at).getTime()
      })
    }
    return Object.values(map)
  }, [entries])

  if (loading) {
    return (
      <AppLayout title={fr ? 'Feuilles de temps' : 'Timesheets'}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (!moduleEnabled) {
    return (
      <AppLayout title={fr ? 'Feuilles de temps' : 'Timesheets'}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {fr ? 'Module non active' : 'Module not enabled'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
            {fr
              ? 'Le suivi du temps necessite le plan Pro. Activez ce module dans vos parametres.'
              : 'Time tracking requires the Pro plan. Enable this module in your settings.'}
          </p>
          <Link
            href="/settings"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            {fr ? 'Parametres' : 'Settings'}
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={fr ? 'Feuilles de temps' : 'Timesheets'}>
      <div className="space-y-6">
        {/* Week picker + filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[200px] text-center">
              {fmtDateShort(weekStart, fr)} — {fmtDateShort(weekEnd, fr)}
            </span>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => setWeekStart(getMonday(new Date()))}
              className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              {fr ? 'Cette semaine' : 'This week'}
            </button>
          </div>

          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">{fr ? 'Tous les employes' : 'All employees'}</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              {fr ? 'Total heures' : 'Total hours'}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <CheckCircle className="w-4 h-4" />
              {fr ? 'Completees' : 'Completed'}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <AlertCircle className="w-4 h-4" />
              {fr ? 'En cours' : 'Pending'}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              {fr ? 'Cout estime' : 'Estimated cost'}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${estimatedCost.toFixed(2)}</p>
          </div>
        </div>

        {/* Entries table */}
        {entries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {fr ? 'Aucune entree de temps pour cette periode' : 'No time entries for this period'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.name} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  {group.color && (
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                  )}
                  <Users className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                  <span className="text-sm text-gray-500">({group.entries.length})</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">
                          {fr ? 'Date' : 'Date'}
                        </th>
                        <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">
                          {fr ? 'Intervention' : 'Job'}
                        </th>
                        <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">
                          {fr ? 'Debut' : 'Clock in'}
                        </th>
                        <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">
                          {fr ? 'Fin' : 'Clock out'}
                        </th>
                        <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">
                          {fr ? 'Duree' : 'Duration'}
                        </th>
                        <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">
                          {fr ? 'Statut' : 'Status'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.entries.map((entry) => {
                        const isActive = !entry.clocked_out_at && entry.status !== 'paused'
                        const isPaused = entry.status === 'paused'
                        const isLive = isActive || isPaused

                        return (
                          <tr key={entry.id} className={`border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${isLive ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                              {new Date(entry.clocked_in_at).toLocaleDateString(fr ? 'fr-CA' : 'en-CA')}
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                              {entry.jobs?.title || '-'}
                              {entry.jobs?.customers?.name && (
                                <span className="text-gray-400 text-xs ml-1">({entry.jobs.customers.name})</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                              {fmtTime(entry.clocked_in_at)}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                              {entry.clocked_out_at ? fmtTime(entry.clocked_out_at) : '-'}
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                              {isLive ? (
                                <LiveTimer entry={entry} />
                              ) : (
                                fmtDuration(entry.duration_minutes)
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isActive && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                  {fr ? 'En cours' : 'Active'}
                                </span>
                              )}
                              {isPaused && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                  {fr ? 'En pause' : 'Paused'}
                                </span>
                              )}
                              {!isLive && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                  {fr ? 'Complete' : 'Completed'}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
