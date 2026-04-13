'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../supabase'
import AppLayout from '@/components/AppLayout'
import UpgradePrompt from '@/components/UpgradePrompt'
import { usePlan } from '@/lib/hooks/usePlan'
import { toast } from 'sonner'
import {
  Clock, Calendar, Settings, Globe, Copy, Check, ExternalLink,
  Trash2, Plus, Info, ChevronLeft, ChevronRight
} from 'lucide-react'

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
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

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map((_, i) => ({
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

    if (data.schedule?.length > 0) {
      const filled = DEFAULT_SCHEDULE.map((def) => {
        const found = data.schedule.find((s: DaySchedule) => s.day_of_week === def.day_of_week)
        return found ? { ...def, ...found } : def
      })
      setSchedule(filled)
    }
    if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
    if (data.overrides) setOverrides(data.overrides)
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      setUserId(data.user.id)
      // Load org slug for booking URL — generate + save if missing
      const { data: org } = await supabase
        .from('organizations')
        .select('id, slug, name')
        .eq('owner_user_id', data.user.id)
        .single()

      let slug = org?.slug ?? null
      if (!slug && org?.id) {
        const base = (org.name || 'entreprise')
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 60) || 'entreprise'
        let candidate = base
        let n = 2
        while (n < 50) {
          const { data: clash } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', candidate)
            .maybeSingle()
          if (!clash || clash.id === org.id) break
          candidate = `${base}-${n++}`
        }
        const { error: slugErr } = await supabase
          .from('organizations')
          .update({ slug: candidate })
          .eq('id', org.id)
        if (!slugErr) slug = candidate
        else console.error('[availability] slug update failed:', slugErr)
      }
      setOrgSlug(slug)
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
        body: JSON.stringify({ userId, settings, schedule }),
      })
      if (res.ok) toast.success('Disponibilités sauvegardées')
      else toast.error('Erreur lors de la sauvegarde')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
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
    toast.success('Exception ajoutée')
  }

  const deleteOverride = async (date: string) => {
    if (!userId) return
    await fetch(`/api/availability?userId=${userId}&date=${date}`, { method: 'DELETE' })
    setOverrides((prev) => prev.filter((o) => o.date !== date))
    toast.success('Exception supprimée')
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
    <AppLayout title="Disponibilités">
      <div className="flex h-full items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
      </div>
    </AppLayout>
  )

  return (
    <AppLayout title="Disponibilités">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Disponibilités</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gérez vos horaires et paramètres de réservation</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 shadow-sm transition-all"
          >
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>

        {/* ── Section 1: Weekly Schedule ── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <Clock className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Horaires hebdomadaires</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {schedule.map((day) => (
              <div key={day.day_of_week} className="flex items-center gap-4 px-6 py-3.5">
                <div className="w-32 shrink-0">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <button
                      onClick={() => setDay(day.day_of_week, 'is_available', !day.is_available)}
                      className={`relative h-5 w-9 rounded-full transition-colors ${day.is_available ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${day.is_available ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                    <span className={`text-sm font-medium ${day.is_available ? 'text-gray-900' : 'text-gray-400'}`}>
                      {DAYS[day.day_of_week]}
                    </span>
                  </label>
                </div>
                {day.is_available ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={day.start_time}
                      onChange={(e) => setDay(day.day_of_week, 'start_time', e.target.value)}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
                    </select>
                    <span className="text-gray-400 text-sm">—</span>
                    <select
                      value={day.end_time}
                      onChange={(e) => setDay(day.day_of_week, 'end_time', e.target.value)}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {TIME_OPTIONS.filter((t) => t > day.start_time).map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
                    </select>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Indisponible</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 2: Booking Settings ── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <Settings className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Paramètres de réservation</h2>
          </div>
          <div className="px-6 py-5 space-y-5">

            {/* Auto-accept */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Acceptation automatique</p>
                <p className="text-xs text-gray-500 mt-0.5">Les réservations sont confirmées automatiquement sans approbation manuelle</p>
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
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Préavis minimum</label>
                <select value={settings.minimum_notice_hours} onChange={(e) => setSetting('minimum_notice_hours', Number(e.target.value))}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value={1}>1 heure</option>
                  <option value={2}>2 heures</option>
                  <option value={4}>4 heures</option>
                  <option value={24}>24 heures</option>
                  <option value={48}>48 heures</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Réservation max. à l'avance</label>
                <select value={settings.advance_booking_days} onChange={(e) => setSetting('advance_booking_days', Number(e.target.value))}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value={7}>1 semaine</option>
                  <option value={14}>2 semaines</option>
                  <option value={30}>1 mois</option>
                  <option value={60}>2 mois</option>
                  <option value={90}>3 mois</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Durée du créneau</label>
                <select value={settings.slot_duration_minutes} onChange={(e) => setSetting('slot_duration_minutes', Number(e.target.value))}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 heure</option>
                  <option value={90}>1h 30</option>
                  <option value={120}>2 heures</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Tampon entre rendez-vous</label>
                <select value={settings.buffer_minutes} onChange={(e) => setSetting('buffer_minutes', Number(e.target.value))}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value={0}>Aucun</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 heure</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Fuseau horaire</label>
                <select value={settings.timezone} onChange={(e) => setSetting('timezone', e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
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
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-semibold text-gray-900">Exceptions de dates</h2>
            </div>
            <button
              onClick={() => setAddingOverride(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Plus className="h-4 w-4" /> Ajouter
            </button>
          </div>

          {addingOverride && (
            <div className="px-6 py-4 bg-indigo-50/60 border-b border-indigo-100">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                  <input type="date" value={overrideDate} onChange={(e) => setOverrideDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="block w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={overrideAvailable ? '1' : '0'} onChange={(e) => setOverrideAvailable(e.target.value === '1')}
                    className="block w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none">
                    <option value="0">Indisponible</option>
                    <option value="1">Heures spéciales</option>
                  </select>
                </div>
                {overrideAvailable && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Début</label>
                      <select value={overrideStart} onChange={(e) => setOverrideStart(e.target.value)}
                        className="block w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none">
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fin</label>
                      <select value={overrideEnd} onChange={(e) => setOverrideEnd(e.target.value)}
                        className="block w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none">
                        {TIME_OPTIONS.filter((t) => t > overrideStart).map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Raison (optionnel)</label>
                <input type="text" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="ex. Congé, Vacances, Événement spécial…"
                  className="block w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={addOverride} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">Ajouter</button>
                <button onClick={() => setAddingOverride(false)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
              </div>
            </div>
          )}

          {overrides.length === 0 && !addingOverride ? (
            <div className="px-6 py-8 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
              <Info className="h-5 w-5 text-gray-300" />
              Aucune exception. Ajoutez des congés ou des horaires spéciaux.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {overrides.map((o) => (
                <div key={o.date} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(o.date + 'T12:00:00').toLocaleDateString('fr-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                    <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full ${o.is_available ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
                      {o.is_available ? `${fmtTime(o.start_time || '09:00')} – ${fmtTime(o.end_time || '17:00')}` : 'Indisponible'}
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
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <Globe className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Page de réservation</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Titre de la page</label>
              <input type="text" value={settings.booking_page_title}
                onChange={(e) => setSetting('booking_page_title', e.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Message de bienvenue</label>
              <textarea rows={2} value={settings.booking_page_description}
                onChange={(e) => setSetting('booking_page_description', e.target.value)}
                placeholder="Décrivez vos services ou donnez des instructions…"
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Couleur de marque</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings.booking_page_color}
                    onChange={(e) => setSetting('booking_page_color', e.target.value)}
                    className="h-9 w-12 rounded-lg border border-gray-200 cursor-pointer" />
                  <input type="text" value={settings.booking_page_color}
                    onChange={(e) => setSetting('booking_page_color', e.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Message de confirmation</label>
              <textarea rows={2} value={settings.confirmation_message}
                onChange={(e) => setSetting('confirmation_message', e.target.value)}
                placeholder="Message affiché après la réservation…"
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Politique d'annulation</label>
              <textarea rows={2} value={settings.cancellation_policy}
                onChange={(e) => setSetting('cancellation_policy', e.target.value)}
                placeholder="ex. Annulation gratuite jusqu'à 24h avant le rendez-vous…"
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
            </div>
          </div>
        </div>

        {/* ── Section 5: Shareable Link ── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <Globe className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Lien de réservation partageable</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            {bookingUrl ? (
              <>
                {/* Prominent, clean URL card */}
                <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Votre lien de réservation</p>
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
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all border ${copied ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copié !' : 'Copier'}
                    </button>
                    <a
                      href={bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      <ExternalLink className="h-4 w-4" /> Ouvrir
                    </a>
                  </div>
                </div>

                {/* Embed option 1 — button */}
                {(() => {
                  const buttonSnippet = `<a href="${bookingUrl}" target="_blank" style="background:${settings.booking_page_color};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:15px;font-weight:600;display:inline-block">
  Réserver un rendez-vous
</a>`
                  const isCopied = copiedSnippet === 'button'
                  return (
                    <div>
                      <div className="flex items-baseline justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900">Bouton de réservation</p>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Ajoutez un bouton de réservation à votre site web.</p>
                      <p className="text-[11px] font-medium text-gray-500 mb-1.5">Copiez-collez ce code dans votre site :</p>
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
                          {isCopied ? 'Copié' : 'Copier'}
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
                        <p className="text-sm font-semibold text-gray-900">Calendrier intégré (widget)</p>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Intégrez le calendrier de réservation complet directement sur votre site web.</p>
                      <p className="text-[11px] font-medium text-gray-500 mb-1.5">Copiez-collez ce code dans votre site :</p>
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
                          {isCopied ? 'Copié' : 'Copier'}
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                <Info className="h-4 w-4 shrink-0" />
                Configurez le nom de votre entreprise dans les paramètres pour générer votre lien de réservation.
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
  if (!plan.loading && !plan.isFeatureAvailable('hasBookingPortal')) {
    return (
      <AppLayout title="Disponibilités">
        <div className="p-6 sm:p-10">
          <UpgradePrompt
            variant="overlay"
            feature="Portail de réservation en ligne"
            requiredPlan="pro"
            description="Laissez vos clients réserver en ligne 24/7 via votre propre lien de réservation — disponible dès le forfait Pro."
          />
        </div>
      </AppLayout>
    )
  }
  return <AvailabilityPageInner />
}
