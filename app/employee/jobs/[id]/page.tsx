'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/app/supabase'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtDate } from '@/lib/format'
import { isModuleEnabled } from '@/lib/modules'
import {
  Wrench, LogOut, ArrowLeft, User, MapPin, Clock, Calendar,
  CheckCircle, FileText, StickyNote, Phone, ExternalLink,
  Loader2, Save, Play, Square, AlertTriangle, Pause,
} from 'lucide-react'

interface Job {
  id: string
  title: string
  description: string | null
  status: string
  scheduled_date: string | null
  start_time: string | null
  end_time: string | null
  service_address: string | null
  internal_notes: string | null
  customers: { name: string; phone: string | null; email: string | null } | null
}

interface TimeEntry {
  id: string
  job_id: string | null
  clocked_in_at: string
  clocked_out_at: string | null
  duration_minutes: number | null
  status?: string
  paused_duration_minutes?: number
  pause_started_at?: string | null
  jobs?: { id: string; title: string } | null
}

const STATUS_CFG: Record<string, { label: { fr: string; en: string }; cls: string }> = {
  scheduled:        { label: { fr: 'Planifie', en: 'Scheduled' },          cls: 'bg-blue-100 text-blue-800' },
  in_progress:      { label: { fr: 'En cours', en: 'In progress' },       cls: 'bg-green-100 text-green-800' },
  needs_completion: { label: { fr: 'A completer', en: 'Needs completion' }, cls: 'bg-orange-100 text-orange-800' },
  completed:        { label: { fr: 'Complete', en: 'Completed' },          cls: 'bg-gray-100 text-gray-600' },
  complete:         { label: { fr: 'Complete', en: 'Completed' },          cls: 'bg-gray-100 text-gray-600' },
  cancelled:        { label: { fr: 'Annule', en: 'Cancelled' },            cls: 'bg-gray-100 text-gray-400' },
}

function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h}h ${String(m).padStart(2, '0')}min ${String(s).padStart(2, '0')}s`
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${String(m).padStart(2, '0')}min`
}

function computeWorkedMs(entry: TimeEntry): number {
  const start = new Date(entry.clocked_in_at).getTime()
  const pausedMs = (entry.paused_duration_minutes || 0) * 60000
  if (entry.status === 'paused' && entry.pause_started_at) {
    // Frozen at pause moment
    const pauseAt = new Date(entry.pause_started_at).getTime()
    return (pauseAt - start) - pausedMs
  }
  // Active: live
  return (Date.now() - start) - pausedMs
}

export default function EmployeeJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [empName, setEmpName] = useState('')

  // Time tracking state
  const [timeEnabled, setTimeEnabled] = useState(false)
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [clockLoading, setClockLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [clockOutNotes, setClockOutNotes] = useState('')
  const [showClockOutForm, setShowClockOutForm] = useState(false)
  const [completedDuration, setCompletedDuration] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { router.push('/login'); return }

      // Verify employee + check org modules
      const meRes = await fetch('/api/employees/me')
      if (!meRes.ok) { router.push('/dashboard'); return }
      const meData = await meRes.json()
      setEmpName(`${meData.employee.first_name} ${meData.employee.last_name}`)

      const org = meData.employee.organizations as { plan?: string; enabled_modules?: Record<string, boolean> } | null
      if (org && isModuleEnabled(org.enabled_modules || null, org.plan || null, 'time_tracking')) {
        setTimeEnabled(true)
        // Check active time entry
        const activeRes = await fetch('/api/time/active')
        if (activeRes.ok) {
          const activeData = await activeRes.json()
          if (activeData.entry) setActiveEntry(activeData.entry)
        }
      }

      // Load job via server-side API (bypasses RLS)
      const jobRes = await fetch(`/api/employees/my-jobs/${id}`)
      if (!jobRes.ok) { router.push('/employee'); return }
      const { job: jobData } = await jobRes.json()
      if (!jobData) { router.push('/employee'); return }
      setJob(jobData as Job)
      setNotes(jobData.internal_notes || '')
      setLoading(false)
    }
    init()
  }, [id, router])

  // Live timer
  useEffect(() => {
    if (activeEntry && activeEntry.job_id === id && !activeEntry.clocked_out_at) {
      if (activeEntry.status === 'paused') {
        // Frozen timer
        setElapsed(computeWorkedMs(activeEntry))
        if (timerRef.current) clearInterval(timerRef.current)
        return
      }
      // Active: tick every second
      const tick = () => setElapsed(computeWorkedMs(activeEntry))
      tick()
      timerRef.current = setInterval(tick, 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    } else {
      setElapsed(0)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeEntry, id])

  const clockIn = useCallback(async () => {
    setClockLoading(true)
    try {
      const res = await fetch('/api/time/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id }),
      })
      const data = await res.json()
      if (res.ok) {
        setActiveEntry(data.entry)
        setCompletedDuration(null)
      }
    } finally {
      setClockLoading(false)
    }
  }, [id])

  const pauseEntry = useCallback(async () => {
    if (!activeEntry) return
    setClockLoading(true)
    try {
      const res = await fetch('/api/time/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: activeEntry.id }),
      })
      const data = await res.json()
      if (res.ok) setActiveEntry(data.entry)
    } finally {
      setClockLoading(false)
    }
  }, [activeEntry])

  const resumeEntry = useCallback(async () => {
    if (!activeEntry) return
    setClockLoading(true)
    try {
      const res = await fetch('/api/time/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: activeEntry.id }),
      })
      const data = await res.json()
      if (res.ok) setActiveEntry(data.entry)
    } finally {
      setClockLoading(false)
    }
  }, [activeEntry])

  const clockOut = useCallback(async () => {
    if (!activeEntry) return
    setClockLoading(true)
    try {
      const res = await fetch('/api/time/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: activeEntry.id, notes: clockOutNotes || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        setCompletedDuration(data.entry.duration_minutes)
        setActiveEntry(null)
        setShowClockOutForm(false)
        setClockOutNotes('')
      }
    } finally {
      setClockLoading(false)
    }
  }, [activeEntry, clockOutNotes])

  const markComplete = async () => {
    if (!job) return
    const res = await fetch(`/api/employees/my-jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })
    if (res.ok) setJob({ ...job, status: 'completed' })
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    await fetch(`/api/employees/my-jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ internal_notes: notes || '' }),
    })
    setSavingNotes(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const gmapsUrl = job?.service_address
    ? `https://www.google.com/maps/search/${encodeURIComponent(job.service_address)}`
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (!job) return null

  const sc = STATUS_CFG[job.status] || STATUS_CFG.scheduled
  const isThisJob = activeEntry && activeEntry.job_id === id && !activeEntry.clocked_out_at
  const isActive = isThisJob && activeEntry?.status !== 'paused'
  const isPaused = isThisJob && activeEntry?.status === 'paused'
  const isClockedInElsewhere = activeEntry && activeEntry.job_id !== id && !activeEntry.clocked_out_at

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Gestivio</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">{empName}</span>
            <button onClick={logout} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <Link
          href="/employee"
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {fr ? 'Retour' : 'Back'}
        </Link>

        {/* Time tracking section */}
        {timeEnabled && (
          <div className="mb-4">
            {/* Active state */}
            {isActive && !showClockOutForm && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                        {fr ? 'En cours' : 'In progress'}
                      </p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-400 font-mono">
                        {formatElapsed(elapsed)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={pauseEntry}
                      disabled={clockLoading}
                      className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      <Pause className="w-4 h-4" />
                      {fr ? 'Pause' : 'Pause'}
                    </button>
                    <button
                      onClick={() => setShowClockOutForm(true)}
                      disabled={clockLoading}
                      className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <Square className="w-4 h-4" />
                      {fr ? 'Terminer' : 'Stop'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Paused state */}
            {isPaused && !showClockOutForm && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-300">
                        {fr ? 'En pause' : 'Paused'}
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-400 font-mono">
                        {formatElapsed(elapsed)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={resumeEntry}
                      disabled={clockLoading}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      {fr ? 'Reprendre' : 'Resume'}
                    </button>
                    <button
                      onClick={() => setShowClockOutForm(true)}
                      disabled={clockLoading}
                      className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <Square className="w-4 h-4" />
                      {fr ? 'Terminer' : 'Stop'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Clock out form */}
            {isThisJob && showClockOutForm && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                  <p className="font-semibold text-emerald-900 dark:text-emerald-300 font-mono">
                    {formatElapsed(elapsed)}
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
                    disabled={clockLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {clockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
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

            {isClockedInElsewhere && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  {fr ? 'Vous etes en cours sur une autre intervention' : 'You are clocked in to a different job'}
                </p>
              </div>
            )}

            {!activeEntry && !completedDuration && (
              <button
                onClick={clockIn}
                disabled={clockLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {clockLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                {fr ? "Debuter l'intervention" : 'Start job'}
              </button>
            )}

            {completedDuration !== null && (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {fr ? 'Duree' : 'Duration'}: {formatDuration(completedDuration)}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 space-y-5">
            {/* Title + status */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${sc.cls}`}>
                {sc.label[fr ? 'fr' : 'en']}
              </span>
            </div>

            {job.description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm">{job.description}</p>
            )}

            {/* Details */}
            <div className="space-y-3">
              {job.customers?.name && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{job.customers.name}</p>
                    {job.customers.phone && (
                      <a href={`tel:${job.customers.phone}`} className="text-sm text-indigo-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {job.customers.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {job.service_address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{job.service_address}</p>
                    {gmapsUrl && (
                      <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Google Maps
                      </a>
                    )}
                  </div>
                </div>
              )}

              {job.scheduled_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-900 dark:text-white">
                    {fmtDate(job.scheduled_date, lang as 'fr' | 'en')}
                  </p>
                </div>
              )}

              {(job.start_time || job.end_time) && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-900 dark:text-white">
                    {job.start_time?.slice(0, 5)}{job.end_time ? ` - ${job.end_time.slice(0, 5)}` : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <StickyNote className="w-4 h-4" />
                {fr ? 'Notes' : 'Notes'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder={fr ? 'Ajouter des notes...' : 'Add notes...'}
              />
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {fr ? 'Enregistrer' : 'Save'}
              </button>
            </div>

            {/* Complete action */}
            {job.status !== 'completed' && job.status !== 'complete' && job.status !== 'cancelled' && (
              <button
                onClick={markComplete}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all"
              >
                <CheckCircle className="w-5 h-5" />
                {fr ? 'Marquer comme complete' : 'Mark as completed'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
