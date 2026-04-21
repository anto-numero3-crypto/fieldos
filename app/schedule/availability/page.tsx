'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../supabase'
import AppLayout from '@/components/AppLayout'
import UpgradePrompt from '@/components/UpgradePrompt'
import { usePlan } from '@/lib/hooks/usePlan'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtDate } from '@/lib/format'
import {
  Clock, Calendar, Settings, Globe, Copy, Check, ExternalLink,
  Trash2, Plus, Info, ChevronLeft, ChevronRight
} from 'lucide-react'

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 22; h++) {
  for (const m of [0, 30]) {
    const hh = h.toString().padStart(2, '0')
    const mm = m.toString().padStart(2, '0')
    TIME_OPTIONS.push(`${hh}:${mm}`)
  }
}
function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

interface DaySchedule {
  day_of_week: number
  is_available: boolean
  start_time: string
  end_time: string
}
interface Override {
  id?: string
  date: string
  is_available: boolean
  start_time?: string
  end_time?: string
  reason?: string
}
interface AvailSettings {
  timezone: string
  auto_accept: boolean
  advance_booking_days: number
  minimum_notice_hours: number
  slot_duration_minutes: number
  buffer_minutes: number
  booking_page_title: string
  booking_page_description: string
  booking_page_color: string
  confirmation_message: string
  cancellation_policy: string
}

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS_FR.map((_, i) => ({
  day_of_week: i,
  is_available: i >= 1 && i <= 5,
  start_time: '09:00',
  end_time: '17:00',
}))

const DEFAULT_SETTINGS: AvailSettings = {
  timezone: 'America/Toronto',
  auto_accept: false,
  advance_booking_days: 60,
  minimum_notice_hours: 24,
  slot_duration_minutes: 60,
  buffer_minutes: 15,
  booking_page_title: 'Réserver un rendez-vous',
  booking_page_description: '',
  booking_page_color: '#4f46e5',
  confirmation_message: '',
  cancellation_policy: '',
}

function AvailabilityPageInner() {
  const { lang, t } = useLanguage()
  const fr = lang === 'fr'
  const DAYS = fr ? DAYS_FR : DAYS_EN
  const [userId, setUserId] = useState<string | null>(null)
  const [orgSlug, setOrgSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState<'button' | 'widget' | null>(null)

  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE)
  const [settings, setSettings] = useState<AvailSettings>(DEFAULT_SETTINGS)
  const [overrides, setOverrides] = useState<Override[]>([])

  // Override modal
  const [addingOverride, setAddingOverride] = useState(false)
  const [overrideDate, setOverrideDate] = useState('')
  const [overrideAvailable, setOverrideAvailable] = useState(false)
  const [overrideStart, setOverrideStart] = useState('09:00')
  const [overrideEnd, setOverrideEnd] = useState('17:00')
  const [overrideReason, setOverrideReason] = useState('')

  const load = useCallback(async (uid: string) => {
    const res = await fetch(`/api/availability?userId=${uid}`)
    const data = await res.json()

    // Postgres TIME columns serialize as HH:MM:SS — our <option> values are HH:MM,
    // so we must trim the seconds or the <select> falls back to the first option.
    const trimTime = (s: unknown) => (typeof s === 'string' ? s.slice(0, 5) : s)

    if (data.schedule?.length > 0) {
      const filled = DEFAULT_SCHEDULE.map((def) => {
        const found = data.schedule.find((s: DaySchedule) => s.day_of_week === def.day_of_week)
        if (!found) return def
        return {
          ...def,
          ...found,
          start_time: trimTime(found.start_time) as string,
          end_time: trimTime(found.end_time) as string,
        }
      })
      setSchedule(filled)
    }
    if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
    if (data.overrides) {
      setOverrides(
        data.overrides.map((o: Override) => ({
          ...o,
          start_time: trimTime(o.start_time) as string | undefined,
          end_time: trimTime(o.end_time) as string | undefined,
        }))
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      setUserId(data.user.id)
      // Resolve booking slug via service-role route (bypasses RLS, creates org if missing)
      try {
        const res = await fetch('/api/org/ensure-slug', { cache: 'no-store' })
        const j = await res.json()
        if (j?.slug) setOrgSlug(j.slug)
      } catch (e) {
        console.error('[availability] ensure-slug failed:', e)
      }
      await load(data.user.id)
    })
  }, [load])

  const save = async () => {
    if (!userId) return
    setSaving(true)
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          settings,
          schedule: schedule.map((s) => ({
            day_of_week: s.day_of_week,
            is_available: s.is_available,
            start_time: s.start_time,
            end_time: s.end_time,
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast.success(t.success.saved)
      } else {
        const firstErr = data?.debug && Object.values(data.debug)[0]
        toast.error(String(firstErr || data?.error || t.errors.saveError))
      }
    } catch {
      toast.error(t.errors.saveError)
    }
    setSaving(false)
  }

  const addOverride = async () => {
    if (!userId || !overrideDate) return
    const newOverride: Override = {
      date: overrideDate,
      is_available: overrideAvailable,
      start_time: overrideAvailable ? overrideStart : undefined,
      end_time: overrideAvailable ? overrideEnd : undefined,
      reason: overrideReason || undefined,
    }
    await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, overrides: [newOverride] }),
    })
    setOverrides((prev) => [...prev.filter((o) => o.date !== overrideDate), newOverride])
    setAddingOverride(false)
    setOverrideDate('')
    setOverrideReason('')
    toast.success(t.success.created)
  }

  const deleteOverride = async (date: string) => {
    if (!userId) return
    await fetch(`/api/availability?userId=${userId}&date=${date}`, { method: 'DELETE' })
    setOverrides((prev) => prev.filter((o) => o.date !== date))
    toast.success(t.success.deleted)
  }

  const bookingUrl = orgSlug ? `https://gestivio.ca/book/${orgSlug}` : null

  const copyLink = () => {
    if (!bookingUrl) return
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const setDay = (i: number, field: keyof DaySchedule, val: boolean | string) => {
    setSchedule((prev) => prev.map((d) => d.day_of_week === i ? { ...d, [field]: val } : d))
  }
  const setSetting = <K extends keyof AvailSettings>(k: K, v: AvailSettings[K]) =>
    setSettings((prev) => ({ ...prev, [k]: v }))

  if (loading) return (
    <AppLayout title={fr ? 'Disponibilités' : 'Availability'}>
      <div className="flex h-full items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
      </div>
    </AppLayout>
  )

  return (
    <AppLayout title={fr ? 'Disponibilités' : 'Availability'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{fr ? 'Disponibilités' : 'Availability'}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{fr ? 'Gérez vos horaires et paramètres de réservation' : 'Manage your hours and booking settings'}</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 shadow-sm transition-all"
          >
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
            {saving ? (fr ? 'Sauvegarde…' : 'Saving…') : (fr ? 'Sauvegarder' : 'Save')}
          </button>
        </div>

        {/* ── Section 1: Weekly Schedule ── */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <Clock className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{fr ? 'Horaires hebdomadaires' : 'Weekly schedule'}</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {schedule.map((day) => (
              <div
                key={day.day_of_week}
                className="flex flex-wrap md:flex-nowrap items-center gap-3 px-4 sm:px-5 py-3.5"
              >
                {/* Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={day.is_available}
                  aria-label={fr ? `Activer ${DAYS[day.day_of_week]}` : `Toggle ${DAYS[day.day_of_week]}`}
                  onClick={() => setDay(day.day_of_week, 'is_available', !day.is_available)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${day.is_available ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${day.is_available ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
                  />
                </button>

                {/* Day name */}
                <span
                  className={`text-sm font-medium truncate w-[90px] shrink-0 ${day.is_available ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}
                >
                  {DAYS[day.day_of_week]}
                </span>

                {/* Time controls */}
                {day.is_available ? (
                  <div className="flex items-center gap-2 ml-auto md:ml-0 w-full md:w-auto">
                    <select
                      value={day.start_time}
                      onChange={(e) => setDay(day.day_of_week, 'start_time', e.target.value)}
                      className="min-w-0 flex-1 md:flex-none md:w-[120px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
                    </select>
                    <span className="text-gray-400 text-sm shrink-0">—</span>
                    <select
                      value={day.end_time}
                      onChange={(e) => setDay(day.day_of_week, 'end_time', e.target.value)}
                      className="min-w-0 flex-1 md:flex-none md:w-[120px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {TIME_OPTIONS.filter((t) => t > day.start_time).map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
                    </select>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 dark:text-gray-500 italic ml-auto md:ml-0">{fr ? 'Indisponible' : 'Unavailable'}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 2: Booking Settings ── */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <Settings className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{fr ? 'Paramètres de réservation' : 'Booking settings'}</h2>
          </div>
          <div className="px-6 py-5 space-y-5">

            {/* Auto-accept */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{fr ? 'Acceptation automatique' : 'Auto-accept'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fr ? 'Les réservations sont confirmées automatiquement sans approbation manuelle' : 'Bookings are confirmed automatically without manual approval'}</p>
              </div>
              <button
                onClick={() => setSetting('auto_accept', !settings.auto_accept)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${settings.auto_accept ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${settings.auto_accept ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{fr ? 'Préavis minimum' : 'Minimum notice'}</label>
                <select value={settings.minimum_notice_hours} onChange={(e) => setSetting('minimum_notice_hours', Number(e.target.value))}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value={1}>{fr ? '1 heure' : '1 hour'}</option>
                  <option value={2}>{fr ? '2 heures' : '2 hours'}</option>
                  <option value={4}>{fr ? '4 heures' : '4 hours'}</option>
                  <option value={24}>{fr ? '24 heures' : '24 hours'}</option>
                  <option value={48}>{fr ? '48 heures' : '48 hours'}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{fr ? "Réservation max. à l'avance" : 'Max advance booking'}</label>
                <select value={settings.advance_booking_days} onChange={(e) => setSetting('advance_booking_days', Number(e.target.value))}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value={7}>{fr ? '1 semaine' : '1 week'}</option>
                  <option value={14}>{fr ? '2 semaines' : '2 weeks'}</option>
                  <option value={30}>{fr ? '1 mois' : '1 month'}</option>
                  <option value={60}>{fr ? '2 mois' : '2 months'}</option>
                  <option value={90}>{fr ? '3 mois' : '3 months'}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{fr ? 'Durée du créneau' : 'Slot duration'}</label>
                <select value={settings.slot_duration_minutes} onChange={(e) => setSetting('slot_duration_minutes', Number(e.target.value))}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>{fr ? '1 heure' : '1 hour'}</option>
                  <option value={90}>{fr ? '1h 30' : '1h 30'}</option>
                  <option value={120}>{fr ? '2 heures' : '2 hours'}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{fr ? 'Tampon entre rendez-vous' : 'Buffer between bookings'}</label>
                <select value={settings.buffer_minutes} onChange={(e) => setSetting('buffer_minutes', Number(e.target.value))}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value={0}>{fr ? 'Aucun' : 'None'}</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>{fr ? '1 heure' : '1 hour'}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{fr ? 'Fuseau horaire' : 'Timezone'}</label>
                <select value={settings.timezone} onChange={(e) => setSetting('timezone', e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="America/Toronto">America/Toronto (EST)</option>
                  <option value="America/Vancouver">America/Vancouver (PST)</option>
                  <option value="America/Chicago">America/Chicago (CST)</option>
                  <option value="America/Denver">America/Denver (MST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Date Overrides ── */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{fr ? 'Exceptions de dates' : 'Date overrides'}</h2>
            </div>
            <button
              onClick={() => setAddingOverride(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Plus className="h-4 w-4" /> {fr ? 'Ajouter' : 'Add'}
            </button>
          </div>

          {addingOverride && (
            <div className="px-6 py-4 bg-indigo-50/60 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Date</label>
                  <input type="date" value={overrideDate} onChange={(e) => setOverrideDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Type</label>
                  <select value={overrideAvailable ? '1' : '0'} onChange={(e) => setOverrideAvailable(e.target.value === '1')}
                    className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none">
                    <option value="0">{fr ? 'Indisponible' : 'Unavailable'}</option>
                    <option value="1">{fr ? 'Heures spéciales' : 'Special hours'}</option>
                  </select>
                </div>
                {overrideAvailable && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{fr ? 'Début' : 'Start'}</label>
                      <select value={overrideStart} onChange={(e) => setOverrideStart(e.target.value)}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none">
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{fr ? 'Fin' : 'End'}</label>
                      <select value={overrideEnd} onChange={(e) => setOverrideEnd(e.target.value)}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none">
                        {TIME_OPTIONS.filter((t) => t > overrideStart).map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{fr ? 'Raison (optionnel)' : 'Reason (optional)'}</label>
                <input type="text" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder={fr ? 'ex. Congé, Vacances, Événement spécial…' : 'e.g. Day off, Vacation, Special event…'}
                  className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={addOverride} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">{fr ? 'Ajouter' : 'Add'}</button>
                <button onClick={() => setAddingOverride(false)} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">{fr ? 'Annuler' : 'Cancel'}</button>
              </div>
            </div>
          )}

          {overrides.length === 0 && !addingOverride ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-500 flex flex-col items-center gap-2">
              <Info className="h-5 w-5 text-gray-300" />
              {fr ? 'Aucune exception. Ajoutez des congés ou des horaires spéciaux.' : 'No overrides. Add days off or special hours.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {overrides.map((o) => (
                <div key={o.date} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {fmtDate(o.date, lang)}
                    </span>
                    <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full ${o.is_available ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
                      {o.is_available ? `${fmtTime(o.start_time || '09:00')} – ${fmtTime(o.end_time || '17:00')}` : (fr ? 'Indisponible' : 'Unavailable')}
                    </span>
                    {o.reason && <span className="ml-1.5 text-xs text-gray-400">{o.reason}</span>}
                  </div>
                  <button onClick={() => deleteOverride(o.date)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 4: Booking Page Settings ── */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <Globe className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{fr ? 'Page de réservation' : 'Booking page'}</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{fr ? 'Titre de la page' : 'Page title'}</label>
              <input type="text" value={settings.booking_page_title}
                onChange={(e) => setSetting('booking_page_title', e.target.value)}
                className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{fr ? 'Message de bienvenue' : 'Welcome message'}</label>
              <textarea rows={2} value={settings.booking_page_description}
                onChange={(e) => setSetting('booking_page_description', e.target.value)}
                placeholder={fr ? 'Décrivez vos services ou donnez des instructions…' : 'Describe your services or provide instructions…'}
                className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{fr ? 'Couleur de marque' : 'Brand color'}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings.booking_page_color}
                    onChange={(e) => setSetting('booking_page_color', e.target.value)}
                    className="h-9 w-12 rounded-lg border border-gray-200 cursor-pointer" />
                  <input type="text" value={settings.booking_page_color}
                    onChange={(e) => setSetting('booking_page_color', e.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{fr ? 'Message de confirmation' : 'Confirmation message'}</label>
              <textarea rows={2} value={settings.confirmation_message}
                onChange={(e) => setSetting('confirmation_message', e.target.value)}
                placeholder={fr ? 'Message affiché après la réservation…' : 'Message shown after booking…'}
                className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{fr ? "Politique d'annulation" : 'Cancellation policy'}</label>
              <textarea rows={2} value={settings.cancellation_policy}
                onChange={(e) => setSetting('cancellation_policy', e.target.value)}
                placeholder={fr ? "ex. Annulation gratuite jusqu'à 24h avant le rendez-vous…" : 'e.g. Free cancellation up to 24h before the appointment…'}
                className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
            </div>
          </div>
        </div>

        {/* ── Section 5: Shareable Link ── */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <Globe className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{fr ? 'Lien de réservation partageable' : 'Shareable booking link'}</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            {bookingUrl ? (
              <>
                {/* Prominent, clean URL card */}
                <div className="rounded-xl border border-indigo-100 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/30 dark:to-gray-900 p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{fr ? 'Votre lien de réservation' : 'Your booking link'}</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-base font-semibold text-indigo-700 hover:text-indigo-800 truncate"
                    >
                      {bookingUrl}
                    </a>
                    <button
                      onClick={copyLink}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all border ${copied ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? (fr ? 'Copié !' : 'Copied!') : (fr ? 'Copier' : 'Copy')}
                    </button>
                    <a
                      href={bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      <ExternalLink className="h-4 w-4" /> {fr ? 'Ouvrir' : 'Open'}
                    </a>
                  </div>
                </div>

                {/* Embed option 1 — button */}
                {(() => {
                  const buttonSnippet = `<a href="${bookingUrl}" target="_blank" style="background:${settings.booking_page_color};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:15px;font-weight:600;display:inline-block">
  ${fr ? 'Réserver un rendez-vous' : 'Book an appointment'}
</a>`
                  const isCopied = copiedSnippet === 'button'
                  return (
                    <div>
                      <div className="flex items-baseline justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{fr ? 'Bouton de réservation' : 'Booking button'}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{fr ? 'Ajoutez un bouton de réservation à votre site web.' : 'Add a booking button to your website.'}</p>
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">{fr ? 'Copiez-collez ce code dans votre site :' : 'Copy and paste this code into your website:'}</p>
                      <div className="relative rounded-xl bg-gray-900 p-4 pr-14 text-xs font-mono text-green-300 overflow-x-auto whitespace-pre">
                        {buttonSnippet}
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(buttonSnippet)
                            setCopiedSnippet('button')
                            setTimeout(() => setCopiedSnippet((s) => (s === 'button' ? null : s)), 2000)
                          }}
                          className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${isCopied ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700'}`}
                        >
                          {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {isCopied ? (fr ? 'Copié' : 'Copied') : (fr ? 'Copier' : 'Copy')}
                        </button>
                      </div>
                    </div>
                  )
                })()}

                {/* Embed option 2 — widget */}
                {(() => {
                  const widgetSnippet = `<iframe src="${bookingUrl}/widget" width="100%" height="700" frameborder="0" style="border-radius:12px;border:1px solid #e5e7eb"></iframe>`
                  const isCopied = copiedSnippet === 'widget'
                  return (
                    <div>
                      <div className="flex items-baseline justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{fr ? 'Calendrier intégré (widget)' : 'Embedded calendar (widget)'}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{fr ? 'Intégrez le calendrier de réservation complet directement sur votre site web.' : 'Embed the full booking calendar directly on your website.'}</p>
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">{fr ? 'Copiez-collez ce code dans votre site :' : 'Copy and paste this code into your website:'}</p>
                      <div className="relative rounded-xl bg-gray-900 p-4 pr-14 text-xs font-mono text-green-300 overflow-x-auto whitespace-pre">
                        {widgetSnippet}
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(widgetSnippet)
                            setCopiedSnippet('widget')
                            setTimeout(() => setCopiedSnippet((s) => (s === 'widget' ? null : s)), 2000)
                          }}
                          className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${isCopied ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700'}`}
                        >
                          {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {isCopied ? (fr ? 'Copié' : 'Copied') : (fr ? 'Copier' : 'Copy')}
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                <Info className="h-4 w-4 shrink-0" />
                {fr ? 'Configurez le nom de votre entreprise dans les paramètres pour générer votre lien de réservation.' : 'Set up your company name in settings to generate your booking link.'}
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}

export default function AvailabilityPage() {
  const plan = usePlan()
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  if (!plan.loading && !plan.isFeatureAvailable('hasBookingPortal')) {
    return (
      <AppLayout title={fr ? 'Disponibilités' : 'Availability'}>
        <div className="p-6 sm:p-10">
          <UpgradePrompt
            variant="overlay"
            feature={fr ? 'Portail de réservation en ligne' : 'Online booking portal'}
            requiredPlan="pro"
            description={fr ? 'Laissez vos clients réserver en ligne 24/7 via votre propre lien de réservation — disponible dès le forfait Pro.' : 'Let your clients book online 24/7 via your own booking link — available from the Pro plan.'}
          />
        </div>
      </AppLayout>
    )
  }
  return <AvailabilityPageInner />
}
