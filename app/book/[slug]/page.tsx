'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../supabase'
import { ChevronLeft, ChevronRight, Clock, MapPin, Check, Calendar, AlertCircle } from 'lucide-react'
import { formatPrice, requiresQuote, type PricingType } from '@/lib/pricing'
import AddressAutocomplete from '@/components/AddressAutocomplete'

interface Service {
  id: string
  name: string
  description: string | null
  base_price: number
  price_max: number | null
  pricing_type: PricingType
  pricing_note: string | null
  duration_minutes: number
  category: string | null
}
interface OrgData {
  id: string
  name: string
  owner_user_id: string
  slug: string
  phone: string | null
  email: string | null
  logo_url: string | null
  plan?: string | null
}
interface AvailSettings {
  booking_page_title: string
  booking_page_description: string
  booking_page_color: string
  confirmation_message: string
  cancellation_policy: string
  auto_accept: boolean
  advance_booking_days: number
  minimum_notice_hours: number
  slot_duration_minutes: number
}

type Step = 'service' | 'date' | 'time' | 'info' | 'confirm' | 'done'

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_FR = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}
function fmtDateLong(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>()

  const [org, setOrg] = useState<OrgData | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [avSettings, setAvSettings] = useState<AvailSettings | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Step state
  const [step, setStep] = useState<Step>('service')

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')

  // Customer info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  // Custom request flow
  const [customOpen, setCustomOpen] = useState(false)
  const [customDesc, setCustomDesc] = useState('')
  const [customPreferredDate, setCustomPreferredDate] = useState('')
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  const [customAddress, setCustomAddress] = useState('')
  const [customSubmitting, setCustomSubmitting] = useState(false)
  const [customSubmitted, setCustomSubmitted] = useState(false)

  // Calendar state
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  // Available days (set by schedule)
  const [availableDays, setAvailableDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]))
  const [overrideDates, setOverrideDates] = useState<Record<string, boolean>>({})

  // Slots
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [bookingResult, setBookingResult] = useState<{ token: string; status: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const primaryColor = avSettings?.booking_page_color || '#4f46e5'

  // Load org + services + availability
  useEffect(() => {
    async function load() {
      // Fetch org + services + settings via server endpoint (bypasses RLS)
      const infoRes = await fetch(`/api/bookings/public-info?slug=${encodeURIComponent(slug)}`)
      if (!infoRes.ok) { setNotFound(true); setPageLoading(false); return }
      const info = await infoRes.json()
      if (!info.org) { setNotFound(true); setPageLoading(false); return }

      const orgData = info.org
      setOrg(orgData)
      setServices(info.services || [])
      if (info.settings) setAvSettings(info.settings)

      // Availability schedule + overrides can still use the anon client
      // (their RLS policies are permissive in add-booking-system.sql)
      const userId = String(orgData.owner_user_id)
      const [schedRes, overrideRes] = await Promise.all([
        supabase.from('availability_schedule').select('day_of_week, is_available').eq('user_id', userId),
        supabase.from('availability_overrides').select('date, is_available').eq('user_id', userId)
          .gte('date', today.toISOString().slice(0, 10)),
      ])

      if (schedRes.data && schedRes.data.length > 0) {
        const available = new Set(
          schedRes.data.filter((d) => d.is_available).map((d) => d.day_of_week)
        )
        setAvailableDays(available)
      }

      if (overrideRes.data) {
        const map: Record<string, boolean> = {}
        overrideRes.data.forEach((o) => { map[o.date] = o.is_available })
        setOverrideDates(map)
      }

      // If only 1 service, auto-select it
      if (info.services && info.services.length === 1) {
        setSelectedService(info.services[0])
        setStep('date')
      }

      setPageLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // Fetch time slots when date + service selected
  const fetchSlots = useCallback(async (date: string, duration: number) => {
    setSlotsLoading(true)
    try {
      const res = await fetch(`/api/bookings/slots?orgSlug=${slug}&date=${date}&duration=${duration}`)
      const data = await res.json()
      setSlots(data.slots || [])
    } catch {
      setSlots([])
    }
    setSlotsLoading(false)
  }, [slug])

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedTime('')
    setStep('time')
    fetchSlots(date, selectedService?.duration_minutes || avSettings?.slot_duration_minutes || 60)
  }

  // Calendar helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const isDateAvailable = (year: number, month: number, day: number): boolean => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dateObj = new Date(dateStr + 'T12:00:00')
    const todayStr = today.toISOString().slice(0, 10)

    // Past dates
    if (dateStr < todayStr) return false
    if (dateStr === todayStr && today.getHours() >= 22) return false

    // Too far in the future
    const maxDays = avSettings?.advance_booking_days ?? 60
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + maxDays)
    if (dateObj > maxDate) return false

    // Check override
    if (dateStr in overrideDates) return overrideDates[dateStr]

    // Check weekly schedule
    return availableDays.has(dateObj.getDay())
  }

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const validateInfo = () => {
    const errs: Record<string, string> = {}
    if (!firstName.trim()) errs.firstName = 'Ce champ est obligatoire'
    if (!lastName.trim()) errs.lastName = 'Ce champ est obligatoire'
    if (!email.trim()) errs.email = 'Ce champ est obligatoire'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errs.email = 'Adresse courriel invalide'
    if (phone.trim()) {
      const digits = phone.replace(/\D/g, '')
      if (digits.length < 10 || digits.length > 15) errs.phone = 'Numéro de téléphone invalide'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validateInfo() || !org || !selectedService || !selectedDate || !selectedTime) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgSlug: slug,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          servicePrice: selectedService.base_price,
          serviceDuration: selectedService.duration_minutes,
          customerName: `${firstName} ${lastName}`.trim(),
          customerEmail: email,
          customerPhone: phone || null,
          customerAddress: address || null,
          date: selectedDate,
          time: selectedTime,
          notes: notes || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setBookingResult(data.booking)
        setStep('done')
      } else {
        alert(data.error || 'Une erreur est survenue. Veuillez réessayer.')
      }
    } catch {
      alert('Une erreur est survenue. Veuillez réessayer.')
    }
    setSubmitting(false)
  }

  const stepIndex: Record<Step, number> = { service: 1, date: 2, time: 3, info: 4, confirm: 5, done: 6 }

  if (pageLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-5">
          <Calendar className="h-8 w-8 text-indigo-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Portail non configuré</h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-5">
          Ce portail de réservation n&apos;est pas encore configuré.
          Si vous êtes le propriétaire, connectez-vous et configurez votre lien dans{' '}
          <strong>Calendrier → Disponibilités</strong>.
        </p>
        <a
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Me connecter
        </a>
      </div>
    </div>
  )

  const stepsTotal = services.length > 1 ? 4 : 3

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ background: primaryColor }} className="px-4 py-6 text-white text-center shadow-sm">
        {org?.logo_url && (
          <img src={org.logo_url} alt={org.name} className="h-10 mx-auto mb-3 object-contain" />
        )}
        <h1 className="text-xl font-bold">{org?.name}</h1>
        {step !== 'done' && (
          <p className="text-white/80 text-sm mt-1">{avSettings?.booking_page_title || 'Réserver un rendez-vous'}</p>
        )}
      </div>

      {/* Progress bar */}
      {step !== 'done' && (
        <div className="bg-white border-b border-gray-100 px-4 py-2">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-1">
              {Array.from({ length: stepsTotal }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${i < stepIndex[step] - (services.length > 1 ? 0 : 1) ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  style={{ background: i < stepIndex[step] - (services.length > 1 ? 0 : 1) ? primaryColor : undefined }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Welcome message */}
        {step === 'service' && avSettings?.booking_page_description && (
          <p className="text-sm text-gray-600 text-center">{avSettings.booking_page_description}</p>
        )}

        {/* ── Step 1: Service Selection ── */}
        {step === 'service' && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">Choisissez un service</h2>
            {services.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucun service disponible pour le moment.</p>
            ) : (
              services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => { setSelectedService(svc); setStep('date') }}
                  className="w-full text-left rounded-2xl border-2 border-gray-100 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{svc.name}</p>
                      {svc.description && <p className="text-sm text-gray-500 mt-0.5">{svc.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3.5 w-3.5" /> {svc.duration_minutes} min
                        </span>
                        {svc.category && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{svc.category}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {svc.pricing_type === 'quote_required' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-xs font-semibold">
                          <AlertCircle className="h-3 w-3" /> Sur devis
                        </span>
                      ) : svc.pricing_type === 'free' ? (
                        <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-semibold">Gratuit</span>
                      ) : (
                        <span className="text-base font-bold text-gray-900">{formatPrice(svc)}</span>
                      )}
                      {svc.pricing_note && (
                        <p className="text-[11px] text-gray-400 mt-1 max-w-[160px]">{svc.pricing_note}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}

            {/* Custom request CTA */}
            <button
              type="button"
              onClick={() => setCustomOpen(true)}
              className="w-full text-left rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-4 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all"
            >
              <p className="font-semibold text-gray-900">Vous ne voyez pas ce dont vous avez besoin ?</p>
              <p className="text-sm text-gray-500 mt-0.5">Envoyez-nous une demande personnalisée →</p>
            </button>
          </div>
        )}

        {/* Custom request modal */}
        {customOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !customSubmitting && setCustomOpen(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {customSubmitted ? (
                <div className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Demande envoyée !</h3>
                  <p className="text-sm text-gray-500 mb-5">
                    Nous avons reçu votre demande et vous contacterons sous 24 heures pour discuter de vos besoins et vous fournir un devis.
                  </p>
                  <button
                    onClick={() => { setCustomOpen(false); setCustomSubmitted(false) }}
                    className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Demande personnalisée</h3>
                  <p className="text-sm text-gray-500 mb-4">Dites-nous ce dont vous avez besoin — nous vous contacterons sous 24 h.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Quel service souhaitez-vous ? *</label>
                      <textarea
                        rows={3}
                        value={customDesc}
                        onChange={(e) => setCustomDesc(e.target.value)}
                        placeholder="Décrivez vos besoins…"
                        className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date / période souhaitée (optionnel)</label>
                      <input
                        type="text"
                        value={customPreferredDate}
                        onChange={(e) => setCustomPreferredDate(e.target.value)}
                        placeholder="ex. Semaine du 15 mai, weekends uniquement…"
                        className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
                        <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)}
                          className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
                        <input type="tel" value={customPhone} onChange={(e) => setCustomPhone(e.target.value)}
                          className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                      <input type="email" value={customEmail} onChange={(e) => setCustomEmail(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Adresse (optionnel)</label>
                      <AddressAutocomplete value={customAddress} onChange={setCustomAddress} />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-5">
                    <button
                      type="button"
                      onClick={() => setCustomOpen(false)}
                      disabled={customSubmitting}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={customSubmitting || !customDesc.trim() || !customName.trim() || !customEmail.trim()}
                      onClick={async () => {
                        setCustomSubmitting(true)
                        try {
                          const res = await fetch('/api/bookings/custom-request', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              orgSlug: org?.slug || slug,
                              description: customDesc.trim(),
                              preferredDate: customPreferredDate.trim() || null,
                              customerName: customName.trim(),
                              customerEmail: customEmail.trim(),
                              customerPhone: customPhone.trim() || null,
                              customerAddress: customAddress.trim() || null,
                              serviceName: selectedService?.name || null,
                            }),
                          })
                          const data = await res.json()
                          if (data.success) setCustomSubmitted(true)
                          else alert(data.error || "Une erreur s'est produite. Veuillez réessayer.")
                        } catch {
                          alert("Une erreur s'est produite. Veuillez réessayer.")
                        }
                        setCustomSubmitting(false)
                      }}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {customSubmitting ? 'Envoi…' : 'Envoyer la demande'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Date Selection ── */}
        {step === 'date' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              {services.length > 1 && (
                <button onClick={() => { setStep('service'); setSelectedDate('') }}
                  className="text-gray-400 hover:text-gray-700 transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <h2 className="text-lg font-bold text-gray-900">Choisissez une date</h2>
            </div>
            {selectedService && (
              <div className="flex items-center gap-2 mb-4 rounded-xl bg-indigo-50 px-3 py-2 text-sm">
                <div className="h-2 w-2 rounded-full" style={{ background: primaryColor }} />
                <span className="font-medium text-indigo-700">{selectedService.name}</span>
                <span className="text-indigo-500">· {selectedService.duration_minutes} min</span>
              </div>
            )}

            {/* Calendar */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-gray-900">{MONTHS_FR[calMonth]} {calYear}</span>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="px-3 py-2">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {DAYS_FR.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: getDaysInMonth(calYear, calMonth) }, (_, i) => i + 1).map((day) => {
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const available = isDateAvailable(calYear, calMonth, day)
                    const isToday = dateStr === today.toISOString().slice(0, 10)
                    const isSelected = dateStr === selectedDate

                    return (
                      <button
                        key={day}
                        onClick={() => available && handleDateSelect(dateStr)}
                        disabled={!available}
                        className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium m-0.5 transition-all
                          ${isSelected ? 'text-white shadow-sm' : ''}
                          ${!isSelected && available ? 'hover:bg-indigo-50 hover:text-indigo-700 text-gray-700' : ''}
                          ${!available ? 'text-gray-300 cursor-not-allowed' : ''}
                          ${isToday && !isSelected ? 'font-bold text-indigo-600 underline underline-offset-2' : ''}
                        `}
                        style={isSelected ? { background: primaryColor } : undefined}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="px-4 pb-3 flex items-center gap-3 text-xs text-gray-400 border-t border-gray-50 pt-2">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" />Disponible</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-200" />Indisponible</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Time Slot Selection ── */}
        {step === 'time' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => { setStep('date'); setSelectedTime('') }} className="text-gray-400 hover:text-gray-700 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Choisissez un horaire</h2>
                <p className="text-sm text-gray-500">{fmtDateLong(selectedDate)}</p>
              </div>
            </div>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">Aucune disponibilité ce jour</p>
                <p className="text-sm text-gray-400">Choisissez une autre date.</p>
                <button onClick={() => setStep('date')} className="mt-4 text-sm font-semibold text-indigo-600 hover:underline">
                  ← Choisir une autre date
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => { setSelectedTime(slot); setStep('info') }}
                    className={`rounded-xl border-2 py-3 text-sm font-semibold transition-all
                      ${selectedTime === slot
                        ? 'text-white border-transparent shadow-sm'
                        : 'border-gray-100 bg-white text-gray-700 hover:border-indigo-200 hover:text-indigo-700'
                      }`}
                    style={selectedTime === slot ? { background: primaryColor, borderColor: primaryColor } : undefined}
                  >
                    {fmtTime(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Customer Info ── */}
        {step === 'info' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => { setStep('time') }} className="text-gray-400 hover:text-gray-700 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">Vos informations</h2>
            </div>

            {/* Booking summary */}
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 mb-5 text-sm">
              <div className="flex items-center gap-2 text-indigo-700 font-medium mb-1">{selectedService?.name}</div>
              <div className="flex items-center gap-4 text-indigo-500 text-xs">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {fmtDateLong(selectedDate)}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {fmtTime(selectedTime)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Prénom *</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    className={`block w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors ${errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500'}`} />
                  {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                    className={`block w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors ${errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500'}`} />
                  {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Adresse email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white focus:border-indigo-500'}`} />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Adresse (si applicable)</label>
                <AddressAutocomplete value={address} onChange={setAddress} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes / demandes spéciales</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations supplémentaires pour le prestataire…"
                  className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
              </div>

              <button
                onClick={() => { if (validateInfo()) setStep('confirm') }}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity mt-1"
                style={{ background: primaryColor }}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Confirm ── */}
        {step === 'confirm' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setStep('info')} className="text-gray-400 hover:text-gray-700 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-bold text-gray-900">Confirmer la réservation</h2>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4 mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Service</p>
                <p className="font-semibold text-gray-900">{selectedService?.name}</p>
                {selectedService && (
                  <p className="text-sm text-gray-500">
                    {requiresQuote(selectedService) ? 'Devis fourni après évaluation' : formatPrice(selectedService)}
                  </p>
                )}
              </div>
              <div className="border-t border-gray-50 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Date & heure</p>
                <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" /> {fmtDateLong(selectedDate)}
                </p>
                <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-400" /> {fmtTime(selectedTime)} ({selectedService?.duration_minutes || 60} min)
                </p>
              </div>
              <div className="border-t border-gray-50 pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Vos informations</p>
                <p className="font-semibold text-gray-900">{firstName} {lastName}</p>
                <p className="text-sm text-gray-500">{email}</p>
                {phone && <p className="text-sm text-gray-500">{phone}</p>}
                {address && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" /> {address}
                  </p>
                )}
              </div>
              {notes && (
                <div className="border-t border-gray-50 pt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-gray-600 italic">{notes}</p>
                </div>
              )}
            </div>

            {avSettings?.cancellation_policy && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 mb-4 text-xs text-gray-500">
                <p className="font-semibold text-gray-600 mb-0.5">Politique d'annulation</p>
                {avSettings.cancellation_policy}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
              style={{ background: primaryColor }}
            >
              {submitting ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Envoi en cours…</>
              ) : 'Confirmer ma réservation'}
            </button>
          </div>
        )}

        {/* ── Step 6: Done ── */}
        {step === 'done' && bookingResult && (
          <div className="text-center py-6">
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg"
              style={{ background: primaryColor }}
            >
              <Check className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {bookingResult.status === 'confirmed' ? 'Rendez-vous confirmé !' : 'Demande reçue !'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {bookingResult.status === 'confirmed'
                ? 'Votre rendez-vous est confirmé. Un email de confirmation vous a été envoyé.'
                : 'Votre demande a été envoyée. Vous recevrez une confirmation par email sous peu.'}
            </p>

            {avSettings?.confirmation_message && (
              <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 mb-5 text-sm text-green-700 text-left">
                {avSettings.confirmation_message}
              </div>
            )}

            {/* Booking summary */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 text-left mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service</span>
                <span className="font-medium text-gray-900">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900">{fmtDateLong(selectedDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Heure</span>
                <span className="font-medium text-gray-900">{fmtTime(selectedTime)}</span>
              </div>
            </div>

            {/* Add to calendar */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ajouter à votre calendrier</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {[
                  { label: 'Google Calendar', href: `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(selectedService?.name + ' chez ' + (org?.name || ''))}&dates=${selectedDate.replace(/-/g, '')}/${selectedDate.replace(/-/g, '')}&details=${encodeURIComponent(`Rendez-vous confirmé · ${fmtTime(selectedTime)}`)}&location=${encodeURIComponent(org?.name || '')}` },
                ].map((btn) => (
                  <a key={btn.label} href={btn.href} target="_blank" rel="noopener noreferrer"
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                    {btn.label}
                  </a>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Besoin d'annuler ?{' '}
              <a href={`/booking/cancel/${bookingResult.token}`} className="underline hover:text-gray-600">
                Annuler mon rendez-vous
              </a>
            </p>
          </div>
        )}
      </div>
      {(!org?.plan || org.plan === 'starter') && (
        <footer className="py-4 text-center text-xs text-gray-400">
          Propulsé par <a href="https://gestivio.ca" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">Gestivio</a>
        </footer>
      )}
    </div>
  )
}
