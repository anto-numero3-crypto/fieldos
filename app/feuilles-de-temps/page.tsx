'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { useLanguage } from '@/lib/LanguageContext'
import { isModuleEnabled } from '@/lib/modules'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { fmtMoney, fmtDate, fmtTime } from '@/lib/format'
import { supabase } from '../supabase'
import Link from 'next/link'
import {
  Clock, ChevronLeft, ChevronRight, Loader2, Lock, Users, DollarSign,
  CheckCircle, AlertCircle, Pause, Search, Download, Calendar, Filter,
  ChevronDown, ChevronUp, Check, Briefcase, UserCircle, LayoutGrid,
  RefreshCw,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TimeEntry {
  id: string
  user_id: string
  job_id: string | null
  clocked_in_at: string
  clocked_out_at: string | null
  duration_minutes: number | null
  notes: string | null
  status: 'active' | 'paused' | 'completed' | 'approved'
  paused_duration_minutes: number | null
  pause_started_at: string | null
  employee_name: string
  employee_color?: string | null
  hourly_rate: number | null
  jobs: { id: string; title: string; customers: { name: string } | null } | null
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  color?: string | null
  hourly_rate: number | null
}

type ViewMode = 'job' | 'employee' | 'week'
type DateRange = 'week' | 'month' | 'custom'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const m = new Date(d)
  m.setDate(diff)
  m.setHours(0, 0, 0, 0)
  return m
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function fmtDateISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function fmtDateShort(d: Date, fr: boolean): string {
  return d.toLocaleDateString(fr ? 'fr-CA' : 'en-CA', { month: 'short', day: 'numeric' })
}

function fmtDuration(mins: number | null): string {
  if (!mins || mins <= 0) return '-'
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return `${h}h ${String(m).padStart(2, '0')}min`
}

function fmtDurationShort(mins: number): string {
  if (!mins || mins <= 0) return '-'
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

function computeLiveMinutes(entry: TimeEntry): number {
  const start = new Date(entry.clocked_in_at).getTime()
  const pausedMs = (entry.paused_duration_minutes || 0) * 60000
  if (entry.status === 'paused' && entry.pause_started_at) {
    const pauseAt = new Date(entry.pause_started_at).getTime()
    return Math.max(0, (pauseAt - start - pausedMs) / 60000)
  }
  return Math.max(0, (Date.now() - start - pausedMs) / 60000)
}

function entryMinutes(e: TimeEntry): number {
  if (e.clocked_out_at) return e.duration_minutes || 0
  return computeLiveMinutes(e)
}

function entryCost(e: TimeEntry): number {
  return (entryMinutes(e) / 60) * (e.hourly_rate || 0)
}

function dayLabel(d: Date, fr: boolean): string {
  return d.toLocaleDateString(fr ? 'fr-CA' : 'en-CA', { weekday: 'short', day: 'numeric', month: 'short' })
}

function dayOfWeek(iso: string): number {
  const d = new Date(iso)
  const day = d.getDay()
  return day === 0 ? 6 : day - 1 // Mon=0 ... Sun=6
}

function matchesSearch(entry: TimeEntry, q: string): boolean {
  if (!q) return true
  const lower = q.toLowerCase()
  return (
    (entry.employee_name || '').toLowerCase().includes(lower) ||
    (entry.jobs?.title || '').toLowerCase().includes(lower) ||
    (entry.jobs?.customers?.name || '').toLowerCase().includes(lower)
  )
}

function getMonthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function getMonthEnd(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

// ---------------------------------------------------------------------------
// LiveTimer — sub-component for active entries
// ---------------------------------------------------------------------------
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
    workedMs = pauseAt - start - pausedMs
  } else {
    workedMs = now - start - pausedMs
  }
  const totalSec = Math.max(0, Math.floor(workedMs / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return (
    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      {h}h {String(m).padStart(2, '0')}min {String(s).padStart(2, '0')}s
    </span>
  )
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------
function StatusBadge({ entry, fr }: { entry: TimeEntry; fr: boolean }) {
  const isActive = !entry.clocked_out_at && entry.status !== 'paused'
  const isPaused = entry.status === 'paused'
  const isApproved = entry.status === 'approved' || entry.status === 'completed'
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {fr ? 'En cours' : 'Active'}
      </span>
    )
  }
  if (isPaused) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        {fr ? 'En pause' : 'Paused'}
      </span>
    )
  }
  if (isApproved) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
        <CheckCircle className="h-3 w-3" />
        {fr ? 'Approuv\u00e9e' : 'Approved'}
      </span>
    )
  }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      {fr ? 'Compl\u00e9t\u00e9e' : 'Completed'}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Approve button (single entry)
// ---------------------------------------------------------------------------
function ApproveBtn({
  entryId,
  onApprove,
  fr,
}: {
  entryId: string
  onApprove: (ids: string[]) => void
  fr: boolean
}) {
  return (
    <button
      onClick={() => onApprove([entryId])}
      title={fr ? 'Approuver' : 'Approve'}
      className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 transition-colors"
    >
      <Check className="w-4 h-4" />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function TimesheetsPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const confirm = useConfirm()

  // State
  const [loading, setLoading] = useState(true)
  const [moduleEnabled, setModuleEnabled] = useState(false)
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [hasEmployees, setHasEmployees] = useState(true)
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [dateRange, setDateRange] = useState<DateRange>('week')
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('job')
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const [approving, setApproving] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Compute date boundaries
  const { from, to } = useMemo(() => {
    if (dateRange === 'month') {
      return { from: getMonthStart(weekStart), to: getMonthEnd(weekStart) }
    }
    return { from: weekStart, to: addDays(weekStart, 6) }
  }, [weekStart, dateRange])

  // Check module access
  useEffect(() => {
    const check = async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return
      const { data: org } = await supabase
        .from('organizations')
        .select('id, plan, enabled_modules')
        .eq('owner_user_id', authData.user.id)
        .maybeSingle()
      if (org && isModuleEnabled(org.enabled_modules, org.plan, 'time_tracking')) {
        setModuleEnabled(true)
      }
      if (org) {
        const { data: emps } = await supabase
          .from('employees')
          .select('id, first_name, last_name, color, hourly_rate')
          .eq('org_id', org.id)
          .eq('status', 'active')
        if (emps) {
          setEmployees(emps)
          setHasEmployees(emps.length > 0)
        } else {
          setHasEmployees(false)
        }
      }
      setLoading(false)
    }
    check()
  }, [])

  // Auto default to employee view on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setView('employee')
    }
  }, [])

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    if (!moduleEnabled) return
    const params = new URLSearchParams({
      from: fmtDateISO(from),
      to: fmtDateISO(to),
    })
    if (selectedEmployee !== 'all') params.set('employee_id', selectedEmployee)
    const res = await fetch(`/api/time/entries?${params}`)
    if (res.ok) {
      const data = await res.json()
      setEntries(data.entries || [])
      setLastRefresh(Date.now())
    }
  }, [moduleEnabled, from, to, selectedEmployee])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // 30s auto-refresh
  useEffect(() => {
    if (!moduleEnabled) return
    refreshRef.current = setInterval(fetchEntries, 30000)
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current)
    }
  }, [moduleEnabled, fetchEntries])

  // Filtered entries
  const filtered = useMemo(() => entries.filter(e => matchesSearch(e, search)), [entries, search])

  // KPI
  const totalHours = useMemo(() => filtered.reduce((s, e) => s + entryMinutes(e), 0) / 60, [filtered])
  const estimatedCost = useMemo(() => filtered.reduce((s, e) => s + entryCost(e), 0), [filtered])
  const pendingIds = useMemo(
    () => filtered.filter(e => e.clocked_out_at && e.status !== 'completed' && e.status !== 'approved').map(e => e.id),
    [filtered],
  )
  const approvedCount = useMemo(
    () => filtered.filter(e => e.status === 'completed' || e.status === 'approved').length,
    [filtered],
  )

  // Approve handler (optimistic)
  const handleApprove = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return
      setApproving(true)
      // optimistic
      setEntries(prev =>
        prev.map(e => (ids.includes(e.id) ? { ...e, status: 'approved' as const } : e)),
      )
      try {
        const res = await fetch('/api/time/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryIds: ids }),
        })
        if (!res.ok) throw new Error('approve failed')
      } catch {
        await fetchEntries() // revert on failure
      } finally {
        setApproving(false)
      }
    },
    [fetchEntries],
  )

  const handleBulkApprove = useCallback(async () => {
    if (!pendingIds.length) return
    const { confirmed } = await confirm({
      title: fr ? 'Approuver toutes les entrées ?' : 'Approve all entries?',
      description: fr
        ? `${pendingIds.length} entrée(s) seront marquées comme approuvées.`
        : `${pendingIds.length} entry(ies) will be marked as approved.`,
      confirmLabel: fr ? 'Approuver' : 'Approve',
    })
    if (!confirmed) return
    handleApprove(pendingIds)
  }, [pendingIds, confirm, fr, handleApprove])

  // CSV Export
  const exportCSV = useCallback(() => {
    const headers = [
      'Employé', 'Date', 'Client', 'Intervention', 'Début', 'Fin',
      'Durée (min)', 'Pauses (min)', 'Durée nette (min)', 'Taux/h', 'Coût', 'Statut',
    ]
    const rows = filtered.map(e => {
      const mins = entryMinutes(e)
      const pauseMins = e.paused_duration_minutes || 0
      const grossMins = e.clocked_out_at
        ? Math.round((new Date(e.clocked_out_at).getTime() - new Date(e.clocked_in_at).getTime()) / 60000)
        : Math.round(mins + pauseMins)
      return [
        e.employee_name,
        fmtDateISO(new Date(e.clocked_in_at)),
        e.jobs?.customers?.name || '',
        e.jobs?.title || '',
        new Date(e.clocked_in_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', hour12: false }),
        e.clocked_out_at
          ? new Date(e.clocked_out_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', hour12: false })
          : '',
        String(Math.round(grossMins)),
        String(Math.round(pauseMins)),
        String(Math.round(mins)),
        String(e.hourly_rate || 0),
        (entryCost(e)).toFixed(2),
        e.status,
      ]
    })
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feuilles-de-temps-${fmtDateISO(from)}-${fmtDateISO(to)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filtered, from, to])

  // Navigation helpers
  const navigate = useCallback(
    (dir: -1 | 1) => {
      if (dateRange === 'month') {
        const d = new Date(weekStart)
        d.setMonth(d.getMonth() + dir)
        setWeekStart(d)
      } else {
        setWeekStart(addDays(weekStart, dir * 7))
      }
    },
    [weekStart, dateRange],
  )

  const goToday = useCallback(() => {
    if (dateRange === 'month') {
      setWeekStart(getMonthStart(new Date()))
    } else {
      setWeekStart(getMonday(new Date()))
    }
  }, [dateRange])

  // Relative time indicator
  const RefreshIndicator = useMemo(() => {
    const secsAgo = Math.round((Date.now() - lastRefresh) / 1000)
    return (
      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
        {fr ? `Mis à jour il y a ${secsAgo}s` : `Updated ${secsAgo}s ago`}
      </span>
    )
  }, [lastRefresh, fr])

  // Grouped data — by job
  const groupedByJob = useMemo(() => {
    const map: Record<string, { jobId: string | null; title: string; customer: string; entries: TimeEntry[] }> = {}
    for (const e of filtered) {
      const key = e.job_id || '__none__'
      if (!map[key]) {
        map[key] = {
          jobId: e.job_id,
          title: e.jobs?.title || (fr ? 'Sans intervention' : 'No job'),
          customer: e.jobs?.customers?.name || '',
          entries: [],
        }
      }
      map[key].entries.push(e)
    }
    // Sort entries within each group: active first, then by date desc
    for (const g of Object.values(map)) {
      g.entries.sort((a, b) => {
        const aLive = !a.clocked_out_at ? 0 : 1
        const bLive = !b.clocked_out_at ? 0 : 1
        if (aLive !== bLive) return aLive - bLive
        return new Date(b.clocked_in_at).getTime() - new Date(a.clocked_in_at).getTime()
      })
    }
    // Sort groups: active first, then today, then date desc
    const groups = Object.values(map)
    const todayISO = fmtDateISO(new Date())
    groups.sort((a, b) => {
      const aHasActive = a.entries.some(e => !e.clocked_out_at) ? 0 : 1
      const bHasActive = b.entries.some(e => !e.clocked_out_at) ? 0 : 1
      if (aHasActive !== bHasActive) return aHasActive - bHasActive
      const aToday = a.entries.some(e => fmtDateISO(new Date(e.clocked_in_at)) === todayISO) ? 0 : 1
      const bToday = b.entries.some(e => fmtDateISO(new Date(e.clocked_in_at)) === todayISO) ? 0 : 1
      if (aToday !== bToday) return aToday - bToday
      const aLatest = Math.max(...a.entries.map(e => new Date(e.clocked_in_at).getTime()))
      const bLatest = Math.max(...b.entries.map(e => new Date(e.clocked_in_at).getTime()))
      return bLatest - aLatest
    })
    return groups
  }, [filtered, fr])

  // Grouped data — by employee
  const groupedByEmployee = useMemo(() => {
    const map: Record<string, { name: string; color: string | null; totalMins: number; cost: number; entries: TimeEntry[] }> = {}
    for (const e of filtered) {
      const key = e.employee_name || 'Unknown'
      if (!map[key]) map[key] = { name: key, color: e.employee_color || null, totalMins: 0, cost: 0, entries: [] }
      map[key].entries.push(e)
      map[key].totalMins += entryMinutes(e)
      map[key].cost += entryCost(e)
    }
    for (const g of Object.values(map)) {
      g.entries.sort((a, b) => new Date(b.clocked_in_at).getTime() - new Date(a.clocked_in_at).getTime())
    }
    return Object.values(map).sort((a, b) => b.totalMins - a.totalMins)
  }, [filtered])

  // Weekly grid data
  const weeklyGrid = useMemo(() => {
    if (dateRange !== 'week') return null
    const empMap: Record<string, { name: string; color: string | null; days: (TimeEntry[] | null)[]; totalMins: number }> = {}
    for (const e of filtered) {
      const key = e.employee_name || 'Unknown'
      if (!empMap[key]) {
        empMap[key] = { name: key, color: e.employee_color || null, days: Array(7).fill(null).map(() => null), totalMins: 0 }
      }
      const dow = dayOfWeek(e.clocked_in_at)
      if (!empMap[key].days[dow]) empMap[key].days[dow] = []
      empMap[key].days[dow]!.push(e)
      empMap[key].totalMins += entryMinutes(e)
    }
    return Object.values(empMap).sort((a, b) => b.totalMins - a.totalMins)
  }, [filtered, dateRange])

  // Weekly grid day totals
  const weekDayTotals = useMemo(() => {
    if (!weeklyGrid) return Array(7).fill(0) as number[]
    const totals = Array(7).fill(0) as number[]
    for (const emp of weeklyGrid) {
      for (let d = 0; d < 7; d++) {
        if (emp.days[d]) {
          totals[d] += emp.days[d]!.reduce((s, e) => s + entryMinutes(e), 0)
        }
      }
    }
    return totals
  }, [weeklyGrid])

  // ----- Loading -----
  if (loading) {
    return (
      <AppLayout title={fr ? 'Feuilles de temps' : 'Timesheets'}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse mt-2" />
            </div>
            <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="min-w-[160px] flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-2" />
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                  <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="p-4 space-y-3">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="h-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  // ----- Module gate -----
  if (!moduleEnabled) {
    return (
      <AppLayout title={fr ? 'Feuilles de temps' : 'Timesheets'}>
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center mb-5">
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {fr ? 'Module non activ\u00e9' : 'Module not enabled'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
            {fr
              ? 'Activez le suivi du temps dans Param\u00e8tres \u2192 Modules pour acc\u00e9der aux feuilles de temps.'
              : 'Enable time tracking in Settings \u2192 Modules to access timesheets.'}
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
          >
            {fr ? 'Param\u00e8tres \u2192 Modules' : 'Settings \u2192 Modules'}
          </Link>
        </div>
      </AppLayout>
    )
  }

  // ----- No employees -----
  if (!hasEmployees) {
    return (
      <AppLayout title={fr ? 'Feuilles de temps' : 'Timesheets'}>
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center mb-5">
            <Users className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {fr ? 'Aucun employ\u00e9' : 'No employees'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
            {fr
              ? 'Ajoutez des employ\u00e9s \u00e0 votre \u00e9quipe pour commencer \u00e0 suivre les heures.'
              : 'Add employees to your team to start tracking time.'}
          </p>
          <Link
            href="/equipe"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
          >
            {fr ? 'G\u00e9rer l\'\u00e9quipe' : 'Manage team'}
          </Link>
        </div>
      </AppLayout>
    )
  }

  // Day labels for weekly grid header
  const dayHeaders = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(from, i)
    return { label: d.toLocaleDateString(fr ? 'fr-CA' : 'en-CA', { weekday: 'short' }), date: d }
  })

  return (
    <AppLayout title={fr ? 'Feuilles de temps' : 'Timesheets'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
        {/* ---- HEADER ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {fr ? 'Feuilles de temps' : 'Timesheets'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {fr ? 'Suivez et approuvez les heures de votre \u00e9quipe' : 'Track and approve your team\'s hours'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              disabled={!filtered.length}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 h-11 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={fetchEntries}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 h-11 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
              title={fr ? 'Rafra\u00eechir' : 'Refresh'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ---- TOP BAR ---- */}
        <div className="flex flex-col gap-3">
          {/* Row 1: search + date range */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={fr ? 'Rechercher client, intervention, employ\u00e9...' : 'Search client, job, employee...'}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
              />
            </div>

            {/* Date navigation */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate(-1)}
                className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[180px] text-center">
                {fmtDateShort(from, fr)} — {fmtDateShort(to, fr)}
              </span>
              <button
                onClick={() => navigate(1)}
                className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={goToday}
                className="h-9 px-3.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors"
              >
                {fr ? 'Aujourd\'hui' : 'Today'}
              </button>
              {RefreshIndicator}
            </div>
          </div>

          {/* Row 2: range pills, employee filter, view toggle — collapsible on mobile */}
          <div className="md:hidden flex justify-end">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="inline-flex items-center gap-1.5 h-11 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Filter className="w-4 h-4" />
              {fr ? 'Filtres' : 'Filters'}
              {mobileFiltersOpen ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </button>
          </div>

          <div className={`flex-col md:flex md:flex-row items-start md:items-center justify-between gap-3 ${mobileFiltersOpen ? 'flex' : 'hidden md:flex'}`}>
            {/* Date range pills */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
              {([
                ['week', fr ? 'Cette semaine' : 'This week'],
                ['month', fr ? 'Ce mois' : 'This month'],
              ] as [DateRange, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setDateRange(key)
                    if (key === 'week') setWeekStart(getMonday(new Date()))
                    if (key === 'month') setWeekStart(getMonthStart(new Date()))
                  }}
                  className={`px-4 py-1.5 text-sm rounded-full font-semibold transition-all ${
                    dateRange === key
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Employee filter */}
              <select
                value={selectedEmployee}
                onChange={e => setSelectedEmployee(e.target.value)}
                className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="all">{fr ? 'Tous les employ\u00e9s' : 'All employees'}</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>

              {/* View toggle */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                {([
                  ['job', fr ? 'Par intervention' : 'By job', Briefcase],
                  ['employee', fr ? 'Par employ\u00e9' : 'By employee', UserCircle],
                  ['week', fr ? 'Par semaine' : 'Weekly', LayoutGrid],
                ] as [ViewMode, string, typeof Briefcase][]).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-full font-semibold transition-all ${
                      view === key
                        ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    } ${key === 'week' ? 'hidden md:inline-flex' : ''}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ---- SUMMARY STRIP ---- */}
        <div className="flex overflow-x-auto gap-3 pb-1 -mx-1 px-1 scrollbar-none">
          <SummaryCard
            icon={<Clock className="w-4 h-4" />}
            label={fr ? 'Total heures' : 'Total hours'}
            value={`${totalHours.toFixed(1)}h`}
          />
          <SummaryCard
            icon={<DollarSign className="w-4 h-4" />}
            label={fr ? 'Coût estimé' : 'Estimated cost'}
            value={fmtMoney(estimatedCost, lang)}
          />
          <SummaryCard
            icon={<AlertCircle className="w-4 h-4" />}
            label={fr ? 'À approuver' : 'Pending'}
            value={String(pendingIds.length)}
            action={
              pendingIds.length > 0 ? (
                <button
                  onClick={handleBulkApprove}
                  disabled={approving}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                >
                  {fr ? 'Tout approuver' : 'Approve all'}
                </button>
              ) : undefined
            }
          />
          <SummaryCard
            icon={<CheckCircle className="w-4 h-4" />}
            label={fr ? 'Approuvées' : 'Approved'}
            value={String(approvedCount)}
          />
        </div>

        {/* ---- CONTENT ---- */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40">
              <Calendar className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">
              {fr ? 'Aucune entr\u00e9e' : 'No entries'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
              {fr
                ? 'Les heures point\u00e9es par vos employ\u00e9s appara\u00eetront ici.'
                : 'Hours clocked by your employees will appear here.'}
            </p>
          </div>
        ) : view === 'job' ? (
          /* ---- VIEW: Par intervention ---- */
          <div className="space-y-4">
            {groupedByJob.map(group => {
              const groupMins = group.entries.reduce((s, e) => s + entryMinutes(e), 0)
              const groupCost = group.entries.reduce((s, e) => s + entryCost(e), 0)
              const groupPending = group.entries.filter(e => e.clocked_out_at && e.status !== 'completed' && e.status !== 'approved').map(e => e.id)
              return (
                <div
                  key={group.jobId || '__none__'}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                >
                  {/* Job card header */}
                  <div className="px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 shrink-0">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{group.title}</h3>
                      {group.customer && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{group.customer}</span>
                      )}
                      <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{group.entries.length}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {fmtDuration(groupMins)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {fmtMoney(groupCost, lang)}
                      </span>
                      {groupPending.length > 0 && (
                        <button
                          onClick={() => handleApprove(groupPending)}
                          disabled={approving}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          {fr ? 'Approuver tout' : 'Approve all'}
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Entries table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{fr ? 'Employ\u00e9' : 'Employee'}</th>
                          <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{fr ? 'D\u00e9but' : 'Start'}</th>
                          <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{fr ? 'Fin' : 'End'}</th>
                          <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{fr ? 'Dur\u00e9e' : 'Duration'}</th>
                          <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{fr ? 'Statut' : 'Status'}</th>
                          <th className="w-10 px-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {group.entries.map(entry => (
                          <EntryRow key={entry.id} entry={entry} fr={fr} onApprove={handleApprove} showEmployee />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile cards */}
                  <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-800">
                    {group.entries.map(entry => (
                      <EntryCard key={entry.id} entry={entry} fr={fr} lang={lang} onApprove={handleApprove} showEmployee />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : view === 'employee' ? (
          /* ---- VIEW: Par employé ---- */
          <div className="space-y-4">
            {groupedByEmployee.map(group => (
              <EmployeeGroup
                key={group.name}
                group={group}
                fr={fr}
                lang={lang}
                onApprove={handleApprove}
                approving={approving}
              />
            ))}
          </div>
        ) : (
          /* ---- VIEW: Par semaine (weekly grid) ---- */
          <div className="hidden md:block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {dateRange !== 'week' ? (
              <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
                {fr
                  ? 'La vue hebdomadaire n\'est disponible qu\'en mode "Cette semaine".'
                  : 'The weekly view is only available in "This week" mode.'}
              </div>
            ) : !weeklyGrid || weeklyGrid.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
                {fr ? 'Aucune donn\u00e9e pour cette semaine.' : 'No data for this week.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[160px]">
                        {fr ? 'Employ\u00e9' : 'Employee'}
                      </th>
                      {dayHeaders.map((dh, i) => (
                        <th key={i} className="text-center px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]">
                          <div>{dh.label}</div>
                          <div className="text-[11px] font-normal normal-case tracking-normal text-gray-400 dark:text-gray-500">{dh.date.getDate()}</div>
                        </th>
                      ))}
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider min-w-[80px]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyGrid.map(emp => (
                      <WeeklyRow key={emp.name} emp={emp} fr={fr} lang={lang} onApprove={handleApprove} />
                    ))}
                    {/* Totals row */}
                    <tr className="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 font-semibold">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Total</td>
                      {weekDayTotals.map((mins, i) => (
                        <td key={i} className="text-center px-3 py-3 text-gray-700 dark:text-gray-300">
                          {mins > 0 ? fmtDurationShort(mins) : '-'}
                        </td>
                      ))}
                      <td className="text-center px-4 py-3 text-gray-900 dark:text-white">
                        {fmtDurationShort(weekDayTotals.reduce((a, b) => a + b, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SummaryCard({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode
  label: string
  value: string
  action?: React.ReactNode
}) {
  return (
    <div className="min-w-[160px] flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium mb-1.5">
        {icon}
        {label}
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {action}
      </div>
    </div>
  )
}

function EntryRow({
  entry,
  fr,
  onApprove,
  showEmployee,
}: {
  entry: TimeEntry
  fr: boolean
  onApprove: (ids: string[]) => void
  showEmployee?: boolean
}) {
  const isLive = !entry.clocked_out_at
  const canApprove = entry.clocked_out_at && entry.status !== 'completed' && entry.status !== 'approved'
  return (
    <tr className={`border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 hidden md:table-row transition-colors ${isLive ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
      {showEmployee && (
        <td className="px-5 py-3 text-sm text-gray-900 dark:text-white">
          <div className="flex items-center gap-2">
            {entry.employee_color && (
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.employee_color }} />
            )}
            <span className="truncate font-medium">{entry.employee_name}</span>
          </div>
        </td>
      )}
      <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
        {new Date(entry.clocked_in_at).toLocaleDateString(fr ? 'fr-CA' : 'en-CA', { month: 'short', day: 'numeric' })}
      </td>
      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
        {fmtTime(entry.clocked_in_at, fr ? 'fr' : 'en')}
      </td>
      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
        {entry.clocked_out_at ? fmtTime(entry.clocked_out_at, fr ? 'fr' : 'en') : '-'}
      </td>
      <td className="px-5 py-3 text-gray-900 dark:text-white font-semibold text-sm">
        {isLive ? <LiveTimer entry={entry} /> : fmtDuration(entry.duration_minutes)}
      </td>
      <td className="px-5 py-3">
        <StatusBadge entry={entry} fr={fr} />
      </td>
      <td className="px-3 py-3">
        {canApprove && <ApproveBtn entryId={entry.id} onApprove={onApprove} fr={fr} />}
      </td>
    </tr>
  )
}

function EntryCard({
  entry,
  fr,
  lang,
  onApprove,
  showEmployee,
}: {
  entry: TimeEntry
  fr: boolean
  lang: string
  onApprove: (ids: string[]) => void
  showEmployee?: boolean
}) {
  const isLive = !entry.clocked_out_at
  const canApprove = entry.clocked_out_at && entry.status !== 'completed' && entry.status !== 'approved'
  return (
    <div className={`md:hidden px-5 py-3.5 ${isLive ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {showEmployee && entry.employee_color && (
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.employee_color }} />
          )}
          {showEmployee && <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{entry.employee_name}</span>}
          {!showEmployee && entry.jobs && (
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{entry.jobs.title}</span>
          )}
        </div>
        <StatusBadge entry={entry} fr={fr} />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {new Date(entry.clocked_in_at).toLocaleDateString(fr ? 'fr-CA' : 'en-CA', { month: 'short', day: 'numeric' })}
          {' '}
          {fmtTime(entry.clocked_in_at, fr ? 'fr' : 'en')}
          {entry.clocked_out_at ? ` \u2014 ${fmtTime(entry.clocked_out_at, fr ? 'fr' : 'en')}` : ''}
        </span>
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {isLive ? <LiveTimer entry={entry} /> : fmtDuration(entry.duration_minutes)}
          </span>
          {canApprove && <ApproveBtn entryId={entry.id} onApprove={onApprove} fr={fr} />}
        </div>
      </div>
    </div>
  )
}

function EmployeeGroup({
  group,
  fr,
  lang,
  onApprove,
  approving,
}: {
  group: { name: string; color: string | null; totalMins: number; cost: number; entries: TimeEntry[] }
  fr: boolean
  lang: string
  onApprove: (ids: string[]) => void
  approving: boolean
}) {
  const [open, setOpen] = useState(true)
  const pendingIds = group.entries.filter(e => e.clocked_out_at && e.status !== 'completed' && e.status !== 'approved').map(e => e.id)

  // Group entries by date
  const byDate = useMemo(() => {
    const map: Record<string, TimeEntry[]> = {}
    for (const e of group.entries) {
      const key = fmtDateISO(new Date(e.clocked_in_at))
      if (!map[key]) map[key] = []
      map[key].push(e)
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [group.entries])

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {group.color && (
            <span className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white dark:ring-gray-900" style={{ backgroundColor: group.color }} />
          )}
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{group.name}</h3>
          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{group.entries.length}</span>
        </div>
        <div className="flex items-center gap-3 text-sm shrink-0">
          <span className="font-semibold text-gray-900 dark:text-white">{fmtDuration(group.totalMins)}</span>
          <span className="text-gray-500 dark:text-gray-400">{fmtMoney(group.cost, lang === 'fr' ? 'fr' : 'en')}</span>
          {pendingIds.length > 0 && (
            <span
              role="button"
              onClick={e => {
                e.stopPropagation()
                onApprove(pendingIds)
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <Check className="w-3 h-3" />
              {fr ? 'Approuver tout' : 'Approve all'}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
          {byDate.map(([dateKey, dateEntries]) => (
            <div key={dateKey}>
              <div className="px-5 py-2 bg-gray-50/30 dark:bg-gray-800/20 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {fmtDate(dateKey, lang === 'fr' ? 'fr' : 'en', 'short')}
              </div>
              {/* Desktop table rows */}
              <table className="w-full text-sm hidden md:table">
                <tbody>
                  {dateEntries.map(entry => {
                    const isLive = !entry.clocked_out_at
                    const canApprove = entry.clocked_out_at && entry.status !== 'completed' && entry.status !== 'approved'
                    return (
                      <tr key={entry.id} className={`border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${isLive ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                        <td className="px-4 py-2 text-gray-900 dark:text-white w-1/3">
                          {entry.jobs?.title || (fr ? 'Sans intervention' : 'No job')}
                          {entry.jobs?.customers?.name && (
                            <span className="text-gray-400 text-xs ml-1">({entry.jobs.customers.name})</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300 font-mono text-xs">
                          {fmtTime(entry.clocked_in_at, fr ? 'fr' : 'en')}
                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300 font-mono text-xs">
                          {entry.clocked_out_at ? fmtTime(entry.clocked_out_at, fr ? 'fr' : 'en') : '-'}
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">
                          {isLive ? <LiveTimer entry={entry} /> : fmtDuration(entry.duration_minutes)}
                        </td>
                        <td className="px-4 py-2">
                          <StatusBadge entry={entry} fr={fr} />
                        </td>
                        <td className="px-2 py-2 w-10">
                          {canApprove && <ApproveBtn entryId={entry.id} onApprove={onApprove} fr={fr} />}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {/* Mobile cards */}
              <div className="md:hidden">
                {dateEntries.map(entry => (
                  <EntryCard key={entry.id} entry={entry} fr={fr} lang={lang} onApprove={onApprove} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WeeklyRow({
  emp,
  fr,
  lang,
  onApprove,
}: {
  emp: { name: string; color: string | null; days: (TimeEntry[] | null)[]; totalMins: number }
  fr: boolean
  lang: string
  onApprove: (ids: string[]) => void
}) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null)

  return (
    <>
      <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {emp.color && (
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: emp.color }} />
            )}
            <span className="font-medium text-gray-900 dark:text-white truncate">{emp.name}</span>
          </div>
        </td>
        {emp.days.map((dayEntries, i) => {
          if (!dayEntries || dayEntries.length === 0) {
            return <td key={i} className="text-center px-3 py-3 text-gray-300 dark:text-gray-600">-</td>
          }
          const mins = dayEntries.reduce((s, e) => s + entryMinutes(e), 0)
          const allApproved = dayEntries.every(e => e.status === 'completed' || e.status === 'approved')
          const hasActive = dayEntries.some(e => !e.clocked_out_at && e.status !== 'paused')
          const hasPending = dayEntries.some(e => e.clocked_out_at && e.status !== 'completed' && e.status !== 'approved')

          let cellColor = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
          if (hasActive) cellColor = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          else if (hasPending) cellColor = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'

          return (
            <td key={i} className="text-center px-1 py-2">
              <button
                onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${cellColor} hover:opacity-80 transition-opacity`}
              >
                {fmtDurationShort(mins)}
              </button>
            </td>
          )
        })}
        <td className="text-center px-4 py-3 font-semibold text-gray-900 dark:text-white">
          {fmtDurationShort(emp.totalMins)}
        </td>
      </tr>
      {expandedDay !== null && emp.days[expandedDay] && (
        <tr>
          <td colSpan={9} className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2">
            <table className="w-full text-xs">
              <tbody>
                {emp.days[expandedDay]!.map(entry => {
                  const isLive = !entry.clocked_out_at
                  const canApprove = entry.clocked_out_at && entry.status !== 'completed' && entry.status !== 'approved'
                  return (
                    <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                      <td className="py-1.5 text-gray-900 dark:text-white">
                        {entry.jobs?.title || (fr ? 'Sans intervention' : 'No job')}
                        {entry.jobs?.customers?.name && (
                          <span className="text-gray-400 ml-1">({entry.jobs.customers.name})</span>
                        )}
                      </td>
                      <td className="py-1.5 text-gray-500 font-mono">
                        {fmtTime(entry.clocked_in_at, fr ? 'fr' : 'en')} — {entry.clocked_out_at ? fmtTime(entry.clocked_out_at, fr ? 'fr' : 'en') : '...'}
                      </td>
                      <td className="py-1.5 font-medium text-gray-700 dark:text-gray-300">
                        {isLive ? <LiveTimer entry={entry} /> : fmtDuration(entry.duration_minutes)}
                      </td>
                      <td className="py-1.5">
                        <StatusBadge entry={entry} fr={fr} />
                      </td>
                      <td className="py-1.5 w-8">
                        {canApprove && <ApproveBtn entryId={entry.id} onApprove={onApprove} fr={fr} />}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  )
}
