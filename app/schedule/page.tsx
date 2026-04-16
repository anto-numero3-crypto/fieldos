'use client'

// Calendar redesign notes:
// - Week starts on Sunday (matches the old implementation / North American default).
// - Mobile (< 768px): Week view automatically falls back to Day view to stay legible.
//   Month view remains available on all sizes.
// - Day + Week use a time-grid (6h → 22h, 60px per hour, 1 min = 1px).
// - Month view is a classic 6-row grid with up to 3 job pills per cell.

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import { useLanguage } from '@/lib/LanguageContext'
import { getEffectiveJobStatus, JOB_STATUS_CONFIG } from '@/lib/job-status'
import { formatTime, formatTimeRange } from '@/lib/format-time'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'

// ---------- Types ----------

interface Job {
  id: string
  title: string
  status: string
  scheduled_date: string | null
  start_time: string | null
  end_time: string | null
  priority: string | null
  service_address: string | null
  is_multi_day: boolean | null
  end_date: string | null
  source: string | null
  customers: { name: string } | null
}

type View = 'day' | 'week' | 'month'

// ---------- Date helpers ----------

const DAYS_FR_LONG  = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const DAYS_EN_LONG  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_FR_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAYS_EN_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS_FR     = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
const MONTHS_EN     = ['January','February','March','April','May','June','July','August','September','October','November','December']

const HOUR_START = 6   // 6:00
const HOUR_END   = 22  // 22:00 (exclusive top boundary)
const HOUR_COUNT = HOUR_END - HOUR_START
const PX_PER_HOUR = 60
const GRID_HEIGHT = HOUR_COUNT * PX_PER_HOUR // 960px total
const TIME_AXIS_WIDTH = 60

function toISO(d: Date): string {
  // Local-date ISO (avoids tz issues that come with toISOString)
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function startOfWeekSun(date: Date): Date {
  const d = new Date(date)
  const dow = d.getDay() // Sunday = 0
  d.setDate(d.getDate() - dow)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function minutesFromTime(t: string | null): number | null {
  if (!t) return null
  const [h, m] = t.slice(0, 5).split(':').map((x) => parseInt(x, 10))
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

// Duration in minutes (defaults to 60 if no end_time or if end is bogus).
function jobDuration(j: Job): number {
  const s = minutesFromTime(j.start_time)
  const e = minutesFromTime(j.end_time)
  if (s === null) return 60
  if (e === null || e <= s) return 60
  return e - s
}

// ---------- Component ----------

export default function SchedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  // -- View state (initialised from URL if present)
  const initialView = ((searchParams?.get('view') as View) || 'week')
  const initialDateParam = searchParams?.get('date')
  const initialDate = initialDateParam ? parseISO(initialDateParam) : new Date()

  const [view, setView] = useState<View>(['day', 'week', 'month'].includes(initialView) ? initialView : 'week')
  const [cursor, setCursor] = useState<Date>(initialDate)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState<Date>(new Date())
  const [isMobile, setIsMobile] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // -- Dark mode detection (inline hex from JOB_STATUS_CONFIG)
  useEffect(() => {
    const read = () => setIsDark(document.documentElement.classList.contains('dark'))
    read()
    const obs = new MutationObserver(read)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  // -- Mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // -- Current-time ticker (every 60s)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // -- Keep URL in sync (replace, no history push)
  useEffect(() => {
    const sp = new URLSearchParams()
    sp.set('view', view)
    sp.set('date', toISO(cursor))
    router.replace(`/schedule?${sp.toString()}`, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, cursor])

  // Effective view (mobile: collapse week → day)
  const effectiveView: View = isMobile && view === 'week' ? 'day' : view

  // -- Compute visible range for the current view
  const range = useMemo(() => {
    if (effectiveView === 'day') {
      const d = new Date(cursor); d.setHours(0, 0, 0, 0)
      return { from: d, to: d, days: [d] }
    }
    if (effectiveView === 'week') {
      const start = startOfWeekSun(cursor)
      const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
      return { from: start, to: days[6], days }
    }
    // month
    const som = startOfMonth(cursor)
    const eom = endOfMonth(cursor)
    const gridStart = startOfWeekSun(som)
    // 6 full weeks = 42 cells
    const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
    return { from: gridStart, to: days[41], som, eom, days }
  }, [cursor, effectiveView])

  // -- Fetch jobs for visible range (with a small buffer for multi-day)
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { window.location.href = '/login'; return }

      const fromISO = toISO(range.from)
      const toEnd = addDays(range.to, 1)
      const toStr = toISO(toEnd)

      const { data } = await supabase
        .from('jobs')
        .select('id, title, status, scheduled_date, start_time, end_time, priority, service_address, is_multi_day, end_date, source, customers(name)')
        .eq('user_id', auth.user.id)
        .gte('scheduled_date', fromISO)
        .lt('scheduled_date', toStr)
        .order('start_time', { ascending: true, nullsFirst: false })

      setJobs(((data || []) as unknown) as Job[])
      setLoading(false)
    }
    load()
  }, [range.from, range.to])

  // -- Navigation
  const goPrev = () => {
    if (effectiveView === 'day') setCursor((d) => addDays(d, -1))
    else if (effectiveView === 'week') setCursor((d) => addDays(d, -7))
    else setCursor((d) => addMonths(d, -1))
  }
  const goNext = () => {
    if (effectiveView === 'day') setCursor((d) => addDays(d, 1))
    else if (effectiveView === 'week') setCursor((d) => addDays(d, 7))
    else setCursor((d) => addMonths(d, 1))
  }
  const goToday = () => setCursor(new Date())

  // -- Header label
  const headerLabel = useMemo(() => {
    const d = cursor
    if (effectiveView === 'day') {
      const dow = (fr ? DAYS_FR_LONG : DAYS_EN_LONG)[d.getDay()]
      const month = (fr ? MONTHS_FR : MONTHS_EN)[d.getMonth()]
      if (fr) return `${dow} ${d.getDate()} ${month} ${d.getFullYear()}`
      return `${dow}, ${month} ${d.getDate()}, ${d.getFullYear()}`
    }
    if (effectiveView === 'week') {
      const days = range.days as Date[]
      const first = days[0], last = days[6]
      const monthL = fr ? MONTHS_FR : MONTHS_EN
      if (first.getMonth() === last.getMonth()) {
        return fr
          ? `${first.getDate()} — ${last.getDate()} ${monthL[first.getMonth()]} ${first.getFullYear()}`
          : `${monthL[first.getMonth()]} ${first.getDate()} — ${last.getDate()}, ${first.getFullYear()}`
      }
      return fr
        ? `${first.getDate()} ${monthL[first.getMonth()].slice(0,3)}. — ${last.getDate()} ${monthL[last.getMonth()].slice(0,3)}. ${last.getFullYear()}`
        : `${monthL[first.getMonth()].slice(0,3)} ${first.getDate()} — ${monthL[last.getMonth()].slice(0,3)} ${last.getDate()}, ${last.getFullYear()}`
    }
    const monthL = fr ? MONTHS_FR : MONTHS_EN
    const monthName = monthL[d.getMonth()]
    // Capitalise first letter for FR (months in MONTHS_FR are lowercase per French grammar)
    const cap = monthName.charAt(0).toUpperCase() + monthName.slice(1)
    return `${cap} ${d.getFullYear()}`
  }, [cursor, effectiveView, range.days, fr])

  // ---------- Render ----------

  const AddButton = (
    <Link
      href="/jobs"
      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
    >
      <Plus className="h-4 w-4" /> {fr ? 'Nouvelle intervention' : 'New job'}
    </Link>
  )

  return (
    <AppLayout title={fr ? 'Calendrier' : 'Schedule'} actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* ---------- Calendar toolbar ---------- */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {headerLabel}
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Prev / Today / Next */}
            <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
              <button
                onClick={goPrev}
                aria-label={fr ? 'Précédent' : 'Previous'}
                className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-l-xl transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
              <button
                onClick={goToday}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {fr ? "Aujourd'hui" : 'Today'}
              </button>
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
              <button
                onClick={goNext}
                aria-label={fr ? 'Suivant' : 'Next'}
                className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-r-xl transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* View switcher (segmented control) */}
            <div className="flex items-center gap-0.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-0.5">
              {(['day','week','month'] as View[]).map((v) => {
                const active = view === v
                const label = v === 'day' ? (fr ? 'Jour' : 'Day') : v === 'week' ? (fr ? 'Semaine' : 'Week') : (fr ? 'Mois' : 'Month')
                return (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all ${active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ---------- Grid ---------- */}
        {effectiveView === 'month' ? (
          <MonthView
            days={range.days as Date[]}
            currentMonth={cursor.getMonth()}
            jobs={jobs}
            fr={fr}
            isDark={isDark}
            onPickDay={(d) => { setCursor(d); setView('day') }}
          />
        ) : (
          <TimeGridView
            days={range.days as Date[]}
            jobs={jobs}
            loading={loading}
            fr={fr}
            lang={lang}
            isDark={isDark}
            now={now}
            router={router}
          />
        )}

        {/* ---------- Legend (below calendar) ---------- */}
        <div className="mt-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {fr ? 'Légende' : 'Legend'}
          </h3>
          <div className="flex flex-wrap gap-4">
            {(['scheduled','in_progress','needs_completion','completed'] as const).map((s) => {
              const cfg = JOB_STATUS_CONFIG[s]
              const bg = isDark ? cfg.darkBg : cfg.bg
              return (
                <div key={s} className="flex items-center gap-2">
                  <span
                    className="inline-block h-4 w-4 rounded border-l-[3px]"
                    style={{ backgroundColor: bg, borderLeftColor: cfg.border }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {fr ? cfg.labelFr : cfg.labelEn}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

// ============================================================================
// Time-grid view (Day + Week)
// ============================================================================

function TimeGridView(props: {
  days: Date[]
  jobs: Job[]
  loading: boolean
  fr: boolean
  lang: string
  isDark: boolean
  now: Date
  router: ReturnType<typeof useRouter>
}) {
  const { days, jobs, loading, fr, lang, isDark, now, router } = props
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const daysShort = fr ? DAYS_FR_SHORT : DAYS_EN_SHORT
  const isSingleDay = days.length === 1

  // Scroll to 7am on mount so the user sees the start of the workday without hunting.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = Math.max(0, (7 - HOUR_START) * PX_PER_HOUR - 8)
  }, [])

  // Today's index within the visible days (or -1)
  const todayIdx = days.findIndex((d) => sameDay(d, now))
  const nowMinutesFromTop =
    (now.getHours() - HOUR_START) * 60 + now.getMinutes()
  const nowVisible =
    todayIdx !== -1 && nowMinutesFromTop >= 0 && nowMinutesFromTop <= HOUR_COUNT * 60

  // Jobs grouped by day index
  const jobsByDay = useMemo(() => {
    const map: Job[][] = days.map(() => [])
    for (const j of jobs) {
      if (!j.scheduled_date) continue
      const idx = days.findIndex((d) => toISO(d) === j.scheduled_date!.slice(0, 10))
      if (idx >= 0) map[idx].push(j)
    }
    return map
  }, [days, jobs])

  const hasAnyJobs = jobs.length > 0

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {/* Sticky day-header row */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div style={{ width: TIME_AXIS_WIDTH }} className="shrink-0 border-r border-gray-100 dark:border-gray-800" />
        {days.map((d, i) => {
          const isToday = sameDay(d, now)
          return (
            <div
              key={i}
              className={`flex-1 min-w-0 p-3 text-center border-r border-gray-100 dark:border-gray-800 last:border-0 ${
                isToday ? 'bg-indigo-50/50 dark:bg-indigo-950/30 ring-inset ring-1 ring-indigo-200 dark:ring-indigo-800' : ''
              }`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wide ${
                isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {daysShort[d.getDay()]}
              </p>
              <p className={`text-lg font-bold mt-0.5 ${
                isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'
              }`}>
                {d.getDate()}
              </p>
            </div>
          )
        })}
      </div>

      {/* All-day row (for jobs without start_time) */}
      <AllDayRow
        days={days}
        jobsByDay={jobsByDay}
        fr={fr}
        isDark={isDark}
        onJobClick={(id) => router.push(`/jobs/${id}`)}
      />

      {/* Scrollable time grid */}
      <div
        ref={scrollRef}
        className="relative overflow-y-auto"
        style={{ maxHeight: '70vh' }}
      >
        <div className="flex relative" style={{ height: GRID_HEIGHT }}>
          {/* Time axis */}
          <div
            style={{ width: TIME_AXIS_WIDTH }}
            className="shrink-0 border-r border-gray-100 dark:border-gray-800 relative"
          >
            {Array.from({ length: HOUR_COUNT }, (_, i) => {
              const h = HOUR_START + i
              return (
                <div
                  key={h}
                  style={{ top: i * PX_PER_HOUR }}
                  className="absolute right-2 text-[10px] font-medium text-gray-400 dark:text-gray-500 -translate-y-1/2 pt-0"
                >
                  {/* First label sits flush with the top */}
                  <span className={i === 0 ? 'block pt-0' : ''}>
                    {formatTime(`${h.toString().padStart(2, '0')}:00:00`, lang)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Day columns */}
          {days.map((d, i) => {
            const isToday = sameDay(d, now)
            return (
              <div
                key={i}
                className="flex-1 min-w-0 border-r border-gray-100 dark:border-gray-800 last:border-0 relative"
              >
                {/* Hour stripes */}
                {Array.from({ length: HOUR_COUNT }, (_, h) => (
                  <div
                    key={h}
                    style={{ top: h * PX_PER_HOUR, height: PX_PER_HOUR }}
                    className={`absolute inset-x-0 border-t border-gray-100 dark:border-gray-800/80 ${
                      h % 2 === 0 ? 'bg-gray-50/60 dark:bg-gray-900/40' : ''
                    }`}
                  />
                ))}

                {/* Job blocks */}
                {jobsByDay[i]
                  .filter((j) => j.start_time)
                  .map((job) => {
                    const startMin = minutesFromTime(job.start_time) as number
                    const dur = jobDuration(job)
                    const top = Math.max(0, startMin - HOUR_START * 60)
                    const height = Math.max(30, dur)
                    const eff = getEffectiveJobStatus(job)
                    const cfg = JOB_STATUS_CONFIG[eff] || JOB_STATUS_CONFIG.scheduled
                    const bg = isDark ? cfg.darkBg : cfg.bg
                    const text = isDark ? cfg.darkText : cfg.text
                    return (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => router.push(`/jobs/${job.id}`)}
                        className={`absolute rounded-md px-1.5 py-1 text-left overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${cfg.pulse ? 'animate-pulse' : ''}`}
                        style={{
                          top,
                          height,
                          left: 2,
                          width: 'calc(100% - 4px)',
                          backgroundColor: bg,
                          borderLeft: `3px solid ${cfg.border}`,
                          color: text,
                        }}
                        title={job.title}
                      >
                        <p className="text-[11px] font-semibold truncate leading-tight">{job.title}</p>
                        {job.customers?.name && height >= 40 && (
                          <p className="text-[10px] opacity-80 truncate leading-tight">{job.customers.name}</p>
                        )}
                        {job.start_time && height >= 55 && (
                          <p className="text-[10px] opacity-70 truncate leading-tight">
                            {formatTimeRange(job.start_time, job.end_time, lang)}
                          </p>
                        )}
                      </button>
                    )
                  })}

                {/* Current-time solid dot segment (thicker line on today) */}
                {nowVisible && isToday && (
                  <div
                    className="absolute inset-x-0 h-[2px] bg-red-500 z-20"
                    style={{ top: nowMinutesFromTop }}
                  />
                )}
              </div>
            )
          })}

          {/* Full-width thin red line across all columns when today is in view */}
          {nowVisible && (
            <div
              className="absolute pointer-events-none z-10"
              style={{
                top: nowMinutesFromTop,
                left: TIME_AXIS_WIDTH,
                right: 0,
                height: 1,
                backgroundColor: 'rgba(239, 68, 68, 0.55)',
              }}
            />
          )}

          {/* Red dot on the time axis */}
          {nowVisible && (
            <div
              className="absolute z-30 rounded-full bg-red-500 shadow"
              style={{
                top: nowMinutesFromTop - 5,
                left: TIME_AXIS_WIDTH - 5,
                width: 10,
                height: 10,
              }}
            />
          )}

          {/* Empty state */}
          {!loading && !hasAnyJobs && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500 bg-white/80 dark:bg-gray-900/80 rounded-xl px-5 py-4 pointer-events-auto">
                <CalendarIcon className="h-6 w-6" />
                <p className="text-sm font-medium">
                  {isSingleDay
                    ? (fr ? 'Aucune intervention ce jour' : 'No jobs today')
                    : (fr ? 'Aucune intervention cette semaine' : 'No jobs this week')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// All-day row (jobs with no start_time get rendered here)
// ============================================================================

function AllDayRow(props: {
  days: Date[]
  jobsByDay: Job[][]
  fr: boolean
  isDark: boolean
  onJobClick: (id: string) => void
}) {
  const { days, jobsByDay, fr, isDark, onJobClick } = props

  // Only render the row if at least one visible day has an all-day job
  const hasAnyAllDay = jobsByDay.some((arr) => arr.some((j) => !j.start_time))
  if (!hasAnyAllDay) return null

  return (
    <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 min-h-[40px]">
      <div
        style={{ width: TIME_AXIS_WIDTH }}
        className="shrink-0 border-r border-gray-100 dark:border-gray-800 flex items-start justify-end pr-2 pt-1"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {fr ? 'Journée' : 'All-day'}
        </span>
      </div>
      {days.map((_, i) => {
        const allDayJobs = jobsByDay[i].filter((j) => !j.start_time)
        return (
          <div
            key={i}
            className="flex-1 min-w-0 border-r border-gray-100 dark:border-gray-800 last:border-0 p-1 space-y-1"
          >
            {allDayJobs.map((job) => {
              const eff = getEffectiveJobStatus(job)
              const cfg = JOB_STATUS_CONFIG[eff] || JOB_STATUS_CONFIG.scheduled
              const bg = isDark ? cfg.darkBg : cfg.bg
              const text = isDark ? cfg.darkText : cfg.text
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => onJobClick(job.id)}
                  className={`block w-full text-left rounded px-1.5 py-1 text-[11px] font-medium truncate hover:shadow-sm transition-shadow ${cfg.pulse ? 'animate-pulse' : ''}`}
                  style={{
                    backgroundColor: bg,
                    borderLeft: `3px solid ${cfg.border}`,
                    color: text,
                  }}
                  title={job.title}
                >
                  {job.title}
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Month view
// ============================================================================

function MonthView(props: {
  days: Date[]
  currentMonth: number
  jobs: Job[]
  fr: boolean
  isDark: boolean
  onPickDay: (d: Date) => void
}) {
  const { days, currentMonth, jobs, fr, isDark, onPickDay } = props
  const now = new Date()
  const daysShort = fr ? DAYS_FR_SHORT : DAYS_EN_SHORT

  // Group jobs by ISO date
  const jobsByDate = useMemo(() => {
    const m = new Map<string, Job[]>()
    for (const j of jobs) {
      if (!j.scheduled_date) continue
      const k = j.scheduled_date.slice(0, 10)
      const arr = m.get(k) || []
      arr.push(j)
      m.set(k, arr)
    }
    return m
  }, [jobs])

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="p-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 border-r border-gray-100 dark:border-gray-800 last:border-0">
            {daysShort[i]}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((d, i) => {
          const inMonth = d.getMonth() === currentMonth
          const isToday = sameDay(d, now)
          const key = toISO(d)
          const list = jobsByDate.get(key) || []
          const shown = list.slice(0, 3)
          const extra = list.length - shown.length
          const isSunday = d.getDay() === 0

          return (
            <button
              key={i}
              type="button"
              onClick={() => onPickDay(d)}
              className={`relative text-left min-h-[96px] border-r border-b border-gray-100 dark:border-gray-800 p-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                !inMonth ? 'bg-gray-50/40 dark:bg-gray-900/40' : ''
              } ${(i + 1) % 7 === 0 ? 'border-r-0' : ''} ${i >= 35 ? 'border-b-0' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-200 dark:ring-indigo-900'
                      : inMonth
                        ? 'text-gray-700 dark:text-gray-200'
                        : 'text-gray-300 dark:text-gray-600'
                  } ${isSunday && !isToday && inMonth ? 'text-red-500 dark:text-red-400' : ''}`}
                >
                  {d.getDate()}
                </span>
              </div>

              {/* Job pills */}
              <div className="mt-1 space-y-0.5">
                {shown.map((job) => {
                  const eff = getEffectiveJobStatus(job)
                  const cfg = JOB_STATUS_CONFIG[eff] || JOB_STATUS_CONFIG.scheduled
                  return (
                    <div
                      key={job.id}
                      className="flex items-center gap-1 text-[10px] leading-tight truncate"
                      style={{ color: isDark ? cfg.darkText : cfg.text }}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: cfg.dot }}
                      />
                      <span className="truncate font-medium">{job.title}</span>
                    </div>
                  )
                })}
                {extra > 0 && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    +{extra} {fr ? 'de plus' : 'more'}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {jobs.length === 0 && (
        <div className="py-6 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800">
          <CalendarIcon className="h-5 w-5" />
          <p className="text-sm">{fr ? 'Aucune intervention ce mois-ci' : 'No jobs this month'}</p>
        </div>
      )}
    </div>
  )
}
