'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import EmptyState from '@/components/EmptyState'
import Link from 'next/link'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtDate } from '@/lib/format'
import {
  ChevronLeft, ChevronRight, Plus, Calendar, User, Clock, Briefcase,
} from 'lucide-react'

interface Job {
  id: string; title: string; status: string; scheduled_date: string | null
  start_time: string | null; end_time: string | null; priority: string | null
  source?: string | null
  customers: { name: string } | null
}

// Naive HH:MM overlap test. duration in minutes.
function overlaps(aStart: string, aDuration: number, bStart: string, bDuration: number): boolean {
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const aS = toMin(aStart), aE = aS + aDuration
  const bS = toMin(bStart), bE = bS + bDuration
  return aS < bE && bS < aE
}
function durationOf(j: Job): number {
  if (j.start_time && j.end_time) {
    const [h1, m1] = j.start_time.split(':').map(Number)
    const [h2, m2] = j.end_time.split(':').map(Number)
    return Math.max(15, (h2 * 60 + m2) - (h1 * 60 + m1))
  }
  return 60
}

const STATUS_COLOR: Record<string, string> = {
  scheduled:   'bg-blue-50 border-blue-300 text-blue-700',
  in_progress: 'bg-amber-50 border-amber-300 text-amber-700',
  complete:    'bg-emerald-50 border-emerald-300 text-emerald-700',
  cancelled:   'bg-gray-50 border-gray-200 text-gray-400',
}
const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-blue-500', in_progress: 'bg-amber-500', complete: 'bg-emerald-500', cancelled: 'bg-gray-400',
}

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
const toISO = (d: Date) => d.toISOString().slice(0, 10)

export default function SchedulePage() {
  const { lang, t } = useLanguage()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [jobs, setJobs]           = useState<Job[]>([])
  const [loading, setLoading]     = useState(true)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null) // ISO date

  const handleDrop = async (newDate: string) => {
    setDropTarget(null)
    const id = draggingId
    setDraggingId(null)
    if (!id) return
    const job = jobs.find((j) => j.id === id)
    if (!job) return
    if (job.scheduled_date === newDate) return // no-op

    // Past-date guard
    const todayISO = new Date().toISOString().slice(0, 10)
    if (newDate < todayISO) {
      toast.error(t.errors.unknown)
      return
    }

    // Conflict check: same date + overlapping start_time × duration
    if (job.start_time) {
      const dur = durationOf(job)
      const conflict = jobs.find((other) =>
        other.id !== job.id &&
        other.scheduled_date === newDate &&
        other.status !== 'cancelled' &&
        other.start_time &&
        overlaps(job.start_time!, dur, other.start_time, durationOf(other))
      )
      if (conflict) {
        toast.error(t.errors.unknown)
        return
      }
    }

    // Optimistic update
    const prev = job.scheduled_date
    setJobs((js) => js.map((j) => j.id === id ? { ...j, scheduled_date: newDate } : j))

    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return
    const { error } = await supabase
      .from('jobs')
      .update({ scheduled_date: newDate })
      .eq('id', id)
      .eq('user_id', auth.user.id)

    if (error) {
      // Roll back
      setJobs((js) => js.map((j) => j.id === id ? { ...j, scheduled_date: prev } : j))
      toast.error(t.errors.saveError)
      return
    }

    // If the job came from a booking, also bump the booking's requested_date
    if (job.source === 'booking') {
      await supabase
        .from('booking_requests')
        .update({ requested_date: newDate })
        .eq('converted_to_job_id', job.id)
    }

    toast.success(t.success.updated)
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }

      const from = toISO(weekDays[0])
      const to   = toISO(addDays(weekDays[6], 1))

      const { data: j } = await supabase
        .from('jobs')
        .select('id, title, status, scheduled_date, start_time, end_time, priority, source, customers(name)')
        .eq('user_id', data.user.id)
        .gte('scheduled_date', from)
        .lt('scheduled_date', to)
        .order('start_time', { ascending: true, nullsFirst: false })

      setJobs((j || []) as unknown as Job[])
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  const prevWeek = () => setWeekStart((w) => addDays(w, -7))
  const nextWeek = () => setWeekStart((w) => addDays(w, 7))
  const goToday  = () => setWeekStart(startOfWeek(new Date()))

  const jobsForDay = (d: Date) => jobs.filter((j) => j.scheduled_date === toISO(d))
  const today = toISO(new Date())

  const monthLabel = () => {
    const start = weekDays[0]
    const end   = weekDays[6]
    if (start.getMonth() === end.getMonth()) {
      return `${MONTHS[start.getMonth()]} ${start.getFullYear()}`
    }
    return `${MONTHS[start.getMonth()].slice(0, 3)} – ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`
  }

  // Upcoming jobs (next 30 days, all)
  const [upcoming, setUpcoming] = useState<Job[]>([])
  useEffect(() => {
    const loadUpcoming = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      const from = today
      const to   = toISO(addDays(new Date(), 30))
      const { data } = await supabase
        .from('jobs')
        .select('id, title, status, scheduled_date, start_time, customers(name)')
        .eq('user_id', auth.user.id)
        .gte('scheduled_date', from)
        .lte('scheduled_date', to)
        .not('status', 'eq', 'cancelled')
        .order('scheduled_date')
        .limit(10)
      setUpcoming((data || []) as unknown as Job[])
    }
    loadUpcoming()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const AddButton = (
    <Link href="/jobs" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all">
      <Plus className="h-4 w-4" /> Nouvelle intervention
    </Link>
  )

  return (
    <AppLayout title="Calendrier" actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Header controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">{monthLabel()}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">Aujourd&apos;hui</button>
            <div className="flex items-center rounded-xl border border-gray-200 bg-white shadow-sm">
              <button onClick={prevWeek} className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-l-xl transition-colors"><ChevronLeft className="h-4 w-4" /></button>
              <div className="w-px h-4 bg-gray-200" />
              <button onClick={nextWeek} className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-r-xl transition-colors"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {/* Week view — horizontal scroll on narrow screens */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-x-auto mb-6">
          <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {weekDays.map((d, i) => {
              const isToday = toISO(d) === today
              return (
                <div key={i} className={`p-3 text-center border-r border-gray-50 last:border-0 ${isToday ? 'bg-indigo-50' : ''}`}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{DAYS[d.getDay()]}</p>
                  <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>{d.getDate()}</p>
                  {isToday && <div className="h-1 w-1 rounded-full bg-indigo-600 mx-auto mt-0.5" />}
                </div>
              )
            })}
          </div>

          {/* Job cells */}
          <div className="grid grid-cols-7 min-h-48">
            {weekDays.map((d, i) => {
              const dayJobs = jobsForDay(d)
              const isToday = toISO(d) === today
              const dateISO = toISO(d)
              const isPast = dateISO < today
              const isDropTarget = dropTarget === dateISO
              const dragging = !!draggingId
              const baseBg = isDropTarget
                ? (isPast ? 'bg-red-50 ring-2 ring-red-300' : 'bg-emerald-50 ring-2 ring-emerald-300')
                : (isToday ? 'bg-indigo-50/40' : '')
              return (
                <div
                  key={i}
                  className={`border-r border-gray-50 last:border-0 p-2 space-y-1.5 transition-colors ${baseBg} ${dragging ? 'min-h-[120px]' : ''}`}
                  onDragOver={(e) => {
                    if (!draggingId) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = isPast ? 'none' : 'move'
                    if (dropTarget !== dateISO) setDropTarget(dateISO)
                  }}
                  onDragLeave={(e) => {
                    // Only clear if we're leaving the cell (not entering a child)
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      if (dropTarget === dateISO) setDropTarget(null)
                    }
                  }}
                  onDrop={(e) => { e.preventDefault(); handleDrop(dateISO) }}
                >
                  {loading ? (
                    <div className="space-y-1">{[...Array(2)].map((_, j) => <div key={j} className="h-8 skeleton rounded-lg" />)}</div>
                  ) : dayJobs.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-300">—</p>
                    </div>
                  ) : dayJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      draggable
                      onDragStart={(e) => {
                        setDraggingId(job.id)
                        e.dataTransfer.effectAllowed = 'move'
                        e.dataTransfer.setData('text/plain', job.id)
                      }}
                      onDragEnd={() => { setDraggingId(null); setDropTarget(null) }}
                      title="Glisser-déposer pour reprogrammer"
                      className={`block rounded-lg border-l-2 px-2 py-1.5 text-xs transition-all hover:shadow-sm cursor-grab active:cursor-grabbing ${draggingId === job.id ? 'opacity-50' : ''} ${STATUS_COLOR[job.status] || 'bg-gray-50 border-gray-200 text-gray-600'}`}
                    >
                      <p className="font-semibold truncate">{job.title}</p>
                      {job.customers && <p className="text-xs opacity-70 truncate">{job.customers.name}</p>}
                      {job.start_time && <p className="text-xs opacity-70 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{job.start_time}</p>}
                    </Link>
                  ))}
                </div>
              )
            })}
          </div>
          </div>
        </div>

        {/* Upcoming jobs list */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Interventions à venir (30 prochains jours)</h3>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Aucun rendez-vous aujourd'hui"
                description="Votre journée est libre."
                actions={[{ label: 'Créer un emploi', href: '/jobs', variant: 'primary' }]}
              />
            ) : (
              <ul className="divide-y divide-gray-50">
                {upcoming.map((job) => {
                  const dot = STATUS_DOT[job.status] || 'bg-gray-400'
                  return (
                    <li key={job.id}>
                      <Link href={`/jobs/${job.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {job.customers && <span className="flex items-center gap-0.5"><User className="h-2.5 w-2.5" />{job.customers.name}</span>}
                            {job.scheduled_date && (
                              <span className="flex items-center gap-0.5">
                                <Calendar className="h-2.5 w-2.5" />
                                {fmtDate(job.scheduled_date, lang)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[job.status] || ''}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Legend */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Légende des statuts</h3>
            <div className="space-y-3">
              {[
                { status: 'scheduled',   label: 'Planifié',   desc: 'Bons de travail à venir' },
                { status: 'in_progress', label: 'En cours',   desc: 'Interventions actives' },
                { status: 'complete',    label: 'Terminé',    desc: 'Complétées avec succès' },
                { status: 'cancelled',   label: 'Annulé',     desc: 'Annulées ou absences' },
              ].map((s) => (
                <div key={s.status} className="flex items-center gap-3">
                  <div className={`h-8 w-8 shrink-0 rounded-lg border-l-2 ${STATUS_COLOR[s.status]}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.label}</p>
                    <p className="text-xs text-gray-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-indigo-50 p-4">
              <p className="text-xs text-indigo-700 font-medium mb-1">Pro Tip</p>
              <p className="text-xs text-indigo-600">Set scheduled dates and times when creating jobs to see them on the calendar view.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
