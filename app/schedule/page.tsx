'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Plus, Calendar, User, Clock, Briefcase,
} from 'lucide-react'

interface Job {
  id: string; title: string; status: string; scheduled_date: string | null
  start_time: string | null; end_time: string | null; priority: string | null
  customers: { name: string } | null
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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

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
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [jobs, setJobs]           = useState<Job[]>([])
  const [loading, setLoading]     = useState(true)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }

      const from = toISO(weekDays[0])
      const to   = toISO(addDays(weekDays[6], 1))

      const { data: j } = await supabase
        .from('jobs')
        .select('id, title, status, scheduled_date, start_time, end_time, priority, customers(name)')
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
      <Plus className="h-4 w-4" /> New Job
    </Link>
  )

  return (
    <AppLayout title="Schedule" actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Header controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">{monthLabel()}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">Today</button>
            <div className="flex items-center rounded-xl border border-gray-200 bg-white shadow-sm">
              <button onClick={prevWeek} className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-l-xl transition-colors"><ChevronLeft className="h-4 w-4" /></button>
              <div className="w-px h-4 bg-gray-200" />
              <button onClick={nextWeek} className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-r-xl transition-colors"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {/* Week view */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden mb-6">
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
              return (
                <div key={i} className={`border-r border-gray-50 last:border-0 p-2 space-y-1.5 ${isToday ? 'bg-indigo-50/40' : ''}`}>
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
                      className={`block rounded-lg border-l-2 px-2 py-1.5 text-xs transition-all hover:shadow-sm ${STATUS_COLOR[job.status] || 'bg-gray-50 border-gray-200 text-gray-600'}`}
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

        {/* Upcoming jobs list */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Upcoming Jobs (next 30 days)</h3>
            </div>
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No upcoming jobs scheduled</p>
                <Link href="/jobs" className="mt-2 text-xs font-medium text-indigo-600 hover:underline">Schedule a job →</Link>
              </div>
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
                                {new Date(job.scheduled_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
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
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Status Legend</h3>
            <div className="space-y-3">
              {[
                { status: 'scheduled',   label: 'Scheduled',   desc: 'Upcoming work orders' },
                { status: 'in_progress', label: 'In Progress', desc: 'Currently active jobs' },
                { status: 'complete',    label: 'Complete',    desc: 'Finished successfully' },
                { status: 'cancelled',   label: 'Cancelled',   desc: 'Cancelled or no-show' },
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
