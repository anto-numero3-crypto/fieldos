'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../supabase'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtDate } from '@/lib/format'
import { isModuleEnabled } from '@/lib/modules'
import {
  LogOut, Briefcase, MapPin, Clock, CheckCircle, ChevronRight,
  Calendar, Loader2, User, Square, Play, Pause,
} from 'lucide-react'
import GestivioLogo from '@/components/GestivioLogo'

interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  color: string
  organizations: { id: string; name: string; plan: string; enabled_modules?: Record<string, boolean> } | null
}

interface Job {
  id: string
  title: string
  description: string | null
  status: string
  scheduled_date: string | null
  start_time: string | null
  end_time: string | null
  service_address: string | null
  customers: { name: string; phone: string | null } | null
}

interface TimeEntry {
  id: string
  job_id: string | null
  clocked_in_at: string
  clocked_out_at: string | null
  status?: string
  paused_duration_minutes?: number
  pause_started_at?: string | null
  jobs?: { id: string; title: string; customers?: { name: string } | null } | null
}

const STATUS_BADGE: Record<string, string> = {
  scheduled:        'bg-blue-100 text-blue-800',
  in_progress:      'bg-green-100 text-green-800',
  needs_completion: 'bg-orange-100 text-orange-800',
  completed:        'bg-gray-100 text-gray-600',
  complete:         'bg-gray-100 text-gray-600',
  cancelled:        'bg-gray-100 text-gray-400',
}

function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h}h ${String(m).padStart(2, '0')}min ${String(s).padStart(2, '0')}s`
}

function computeWorkedMs(entry: TimeEntry): number {
  const start = new Date(entry.clocked_in_at).getTime()
  const pausedMs = (entry.paused_duration_minutes || 0) * 60000
  if (entry.status === 'paused' && entry.pause_started_at) {
    const pauseAt = new Date(entry.pause_started_at).getTime()
    return (pauseAt - start) - pausedMs
  }
  return (Date.now() - start) - pausedMs
}

export default function EmployeeDashboard() {
  const router = useRouter()
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [todayJobs, setTodayJobs] = useState<Job[]>([])
  const [upcomingJobs, setUpcomingJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  // Time tracking
  const [timeEnabled, setTimeEnabled] = useState(false)
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [clockOutLoading, setClockOutLoading] = useState(false)
  const [clockOutNotes, setClockOutNotes] = useState('')
  const [showClockOutForm, setShowClockOutForm] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { router.push('/login'); return }

      // Check if user is an employee
      const meRes = await fetch('/api/employees/me')
      if (!meRes.ok) {
        router.push('/dashboard')
        return
      }

      const meData = await meRes.json()
      const emp = meData.employee as Employee
      setEmployee(emp)

      // Check time tracking module
      const org = emp.organizations
      if (org && isModuleEnabled(org.enabled_modules || null, org.plan || null, 'time_tracking')) {
        setTimeEnabled(true)
        const activeRes = await fetch('/api/time/active')
        if (activeRes.ok) {
          const activeData = await activeRes.json()
          if (activeData.entry) setActiveEntry(activeData.entry)
        }
      }

      // Fetch jobs
      const jobsRes = await fetch('/api/employees/my-jobs')
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json()
        setTodayJobs(jobsData.todayJobs || [])
        setUpcomingJobs(jobsData.upcomingJobs || [])
      }
      setLoading(false)
    }
    init()
  }, [router])

  // Live timer
  useEffect(() => {
    if (activeEntry && !activeEntry.clocked_out_at) {
      if (activeEntry.status === 'paused') {
        setElapsed(computeWorkedMs(activeEntry))
        if (timerRef.current) clearInterval(timerRef.current)
        return
      }
      const tick = () => setElapsed(computeWorkedMs(activeEntry))
      tick()
      timerRef.current = setInterval(tick, 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    } else {
      setElapsed(0)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeEntry])

  const pauseEntry = useCallback(async () => {
    if (!activeEntry) return
    setClockOutLoading(true)
    try {
      const res = await fetch('/api/time/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: activeEntry.id }),
      })
      const data = await res.json()
      if (res.ok) setActiveEntry(data.entry)
    } finally {
      setClockOutLoading(false)
    }
  }, [activeEntry])

  const resumeEntry = useCallback(async () => {
    if (!activeEntry) return
    setClockOutLoading(true)
    try {
      const res = await fetch('/api/time/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: activeEntry.id }),
      })
      const data = await res.json()
      if (res.ok) setActiveEntry(data.entry)
    } finally {
      setClockOutLoading(false)
    }
  }, [activeEntry])

  const clockOut = useCallback(async () => {
    if (!activeEntry) return
    setClockOutLoading(true)
    try {
      const res = await fetch('/api/time/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: activeEntry.id, notes: clockOutNotes || undefined }),
      })
      if (res.ok) {
        setActiveEntry(null)
        setShowClockOutForm(false)
        setClockOutNotes('')
      }
    } finally {
      setClockOutLoading(false)
    }
  }, [activeEntry, clockOutNotes])

  const markComplete = async (jobId: string) => {
    const res = await fetch(`/api/employees/my-jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })
    if (res.ok) {
      setTodayJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'completed' } : j))
      setUpcomingJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'completed' } : j))
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const statusLabel = (s: string) => {
    const map: Record<string, { fr: string; en: string }> = {
      scheduled: { fr: 'Planifi\u00e9e', en: 'Scheduled' },
      in_progress: { fr: 'En cours', en: 'In progress' },
      needs_completion: { fr: '\u00c0 compl\u00e9ter', en: 'Needs completion' },
      completed: { fr: 'Compl\u00e9t\u00e9e', en: 'Completed' },
      complete: { fr: 'Compl\u00e9t\u00e9e', en: 'Completed' },
      cancelled: { fr: 'Annul\u00e9e', en: 'Cancelled' },
    }
    return map[s]?.[fr ? 'fr' : 'en'] || s
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  const jobTitle = activeEntry?.jobs?.title || (fr ? 'Intervention' : 'Job')
  const isPaused = activeEntry?.status === 'paused'

  const JobCard = ({ job }: { job: Job }) => (
    <Link
      href={`/employee/jobs/${job.id}`}
      className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md active:scale-[0.99] transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{job.title}</h3>
          {job.customers?.name && (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
              <User className="w-3.5 h-3.5" /> {job.customers.name}
            </p>
          )}
          {job.service_address && (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" /> {job.service_address}
            </p>
          )}
          {(job.start_time || job.end_time) && (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              {job.start_time?.slice(0, 5)}{job.end_time ? ` - ${job.end_time.slice(0, 5)}` : ''}
            </p>
          )}
          {job.scheduled_date && (
            <p className="text-xs text-gray-400 mt-1">
              {fmtDate(job.scheduled_date, lang as 'fr' | 'en', 'short')}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[job.status] || 'bg-gray-100 text-gray-600'}`}>
            {statusLabel(job.status)}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      {job.status !== 'completed' && job.status !== 'complete' && job.status !== 'cancelled' && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); markComplete(job.id) }}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          {fr ? 'Marquer comme compl\u00e9t\u00e9e' : 'Mark as completed'}
        </button>
      )}
    </Link>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GestivioLogo />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
              {employee?.first_name} {employee?.last_name}
            </span>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              title={fr ? 'Deconnexion' : 'Log out'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Active time entry banner */}
        {timeEnabled && activeEntry && !activeEntry.clocked_out_at && !showClockOutForm && (
          <div className={`${isPaused ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'} border rounded-xl p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                <div>
                  <p className={`font-semibold ${isPaused ? 'text-amber-900 dark:text-amber-300' : 'text-emerald-900 dark:text-emerald-300'}`}>
                    {isPaused ? (fr ? 'En pause' : 'Paused') : (fr ? 'En cours' : 'In progress')} — {jobTitle}
                  </p>
                  <p className={`text-sm ${isPaused ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'} font-mono`}>
                    {formatElapsed(elapsed)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <button
                    onClick={resumeEntry}
                    disabled={clockOutLoading}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    {fr ? 'Reprendre' : 'Resume'}
                  </button>
                ) : (
                  <button
                    onClick={pauseEntry}
                    disabled={clockOutLoading}
                    className="flex items-center gap-2 bg-gray-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    <Pause className="w-4 h-4" />
                    {fr ? 'Pause' : 'Pause'}
                  </button>
                )}
                <button
                  onClick={() => setShowClockOutForm(true)}
                  className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  {fr ? 'Terminer' : 'Stop'}
                </button>
              </div>
            </div>
          </div>
        )}

        {timeEnabled && activeEntry && showClockOutForm && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
              <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                {jobTitle} — {formatElapsed(elapsed)}
              </p>
            </div>
            <textarea
              value={clockOutNotes}
              onChange={(e) => setClockOutNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder={fr ? 'Notes (optionnel)...' : 'Notes (optional)...'}
            />
            <div className="flex gap-2">
              <button
                onClick={clockOut}
                disabled={clockOutLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {clockOutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                {fr ? 'Confirmer' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowClockOutForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {fr ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {fr ? 'Bonjour' : 'Hello'} {employee?.first_name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {employee?.organizations?.name || ''}
          </p>
        </div>

        {/* Today's jobs */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {fr ? "Aujourd'hui" : 'Today'}
            </h2>
            <span className="text-sm text-gray-400">({todayJobs.length})</span>
          </div>

          {todayJobs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {fr ? "Aucune intervention assignee aujourd'hui" : 'No jobs assigned today'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </section>

        {/* Upcoming */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {fr ? '7 prochains jours' : 'Next 7 days'}
            </h2>
            <span className="text-sm text-gray-400">({upcomingJobs.length})</span>
          </div>

          {upcomingJobs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {fr ? 'Aucune intervention a venir' : 'No upcoming jobs'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
