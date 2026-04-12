'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../supabase'
import { formatPrice, requiresQuote, type PricingType } from '@/lib/pricing'
import {
  Send, Phone, CheckCircle, Sparkles, Clock, DollarSign,
  Calendar, ChevronRight, User, Mail, MapPin, ArrowRight,
} from 'lucide-react'

interface Org {
  id: string
  slug: string | null
  name: string
  phone: string | null
  email: string | null
  ai_agent_name: string | null
  owner_user_id: string
}
interface Service {
  id: string
  name: string
  description: string | null
  base_price: number
  price_max: number | null
  pricing_type: PricingType
  pricing_note: string | null
  duration_minutes: number
}
interface Message {
  role: 'assistant' | 'user'
  content: string
  buttons?: { label: string; value: string; action: string }[]
  ts: number
}
interface BookingState {
  serviceId:   string | null
  serviceName: string | null
  date:        string | null
  time:        string | null
  name:        string | null
  email:       string | null
  phone:       string | null
  address:     string | null
}

const EMPTY_STATE: BookingState = {
  serviceId: null, serviceName: null, date: null, time: null,
  name: null, email: null, phone: null, address: null,
}

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

function parseDateFromText(text: string): string | null {
  const today = new Date()
  const lower = text.toLowerCase()

  if (/aujourd'?hui|today/.test(lower)) return today.toISOString().slice(0, 10)
  if (/demain|tomorrow/.test(lower)) {
    const d = new Date(today); d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  }
  // "next Monday" etc.
  const days: Record<string, number> = { lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 }
  for (const [name, dayNum] of Object.entries(days)) {
    if (lower.includes(name)) {
      const d = new Date(today)
      const diff = (dayNum - d.getDay() + 7) % 7 || 7
      d.setDate(d.getDate() + diff)
      return d.toISOString().slice(0, 10)
    }
  }
  // YYYY-MM-DD format
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/)
  if (isoMatch) return isoMatch[1]
  // "December 15" or "15 décembre"
  const months: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    janvier: 1, février: 2, mars: 3, avril: 4, mai: 5, juin: 6,
    juillet: 7, août: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12,
  }
  for (const [name, num] of Object.entries(months)) {
    const re = new RegExp(`(\\d{1,2})\\s+${name}|${name}\\s+(\\d{1,2})`, 'i')
    const m = text.match(re)
    if (m) {
      const day = parseInt(m[1] || m[2])
      const year = new Date().getFullYear()
      return `${year}-${String(num).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  return null
}

function BookingPageInner() {
  const searchParams = useSearchParams()

  const [org, setOrg]             = useState<Org | null>(null)
  const [services, setServices]   = useState<Service[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [notFound, setNotFound]   = useState(false)

  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [thinking, setThinking]   = useState(false)
  const [bookingState, setBookingState] = useState<BookingState>(EMPTY_STATE)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]           = useState(false)
  const [bookingToken, setBookingToken] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load org and services
  useEffect(() => {
    async function load() {
      const bizParam = searchParams.get('biz')
      if (!bizParam) { setNotFound(true); setPageLoading(false); return }

      // Fetch via server endpoint (bypasses RLS on services)
      const infoRes = await fetch(`/api/bookings/public-info?slug=${encodeURIComponent(bizParam)}`)
      if (!infoRes.ok) { setNotFound(true); setPageLoading(false); return }
      const info = await infoRes.json()
      if (!info.org) { setNotFound(true); setPageLoading(false); return }

      const orgData = info.org
      setOrg(orgData)

      const svcs = info.services || []
      setServices(svcs)
      setPageLoading(false)

      // Initial greeting
      const agentName = orgData.ai_agent_name || 'Alex'
      const hasServices = svcs.length > 0

      const greetMsg: Message = {
        role: 'assistant',
        content: hasServices
          ? `Bonjour ! Je suis ${agentName}, votre assistant de réservation pour **${orgData.name}**. 😊\n\nQuel service souhaitez-vous réserver aujourd'hui ?`
          : `Bonjour ! Je suis ${agentName}, votre assistant pour **${orgData.name}**. Nous n'avons pas encore configuré notre catalogue de services en ligne. Veuillez nous contacter directement au ${orgData.phone || 'numéro affiché sur notre site'}.`,
        buttons: hasServices ? svcs.map((s: Service) => ({
          label: `${s.name} — ${formatPrice(s)}`,
          value: s.id,
          action: 'select_service',
        })) : [],
        ts: Date.now(),
      }
      setMessages([greetMsg])
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const fetchSlots = useCallback(async (date: string, duration: number, orgSlug: string) => {
    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/bookings/slots?orgSlug=${orgSlug}&date=${date}&duration=${duration}`)
      const data = await res.json()
      const slots = data.slots || []
      setAvailableSlots(slots)
      return slots as string[]
    } catch {
      setAvailableSlots([])
      return [] as string[]
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  const addMsg = (msg: Message) => setMessages((prev) => [...prev, msg])

  const handleServiceSelect = useCallback(async (serviceId: string) => {
    if (!org) return
    const svc = services.find((s) => s.id === serviceId)
    if (!svc) return

    const newState = { ...bookingState, serviceId: svc.id, serviceName: svc.name }
    setBookingState(newState)

    addMsg({ role: 'user', content: svc.name, ts: Date.now() })
    addMsg({
      role: 'assistant',
      content: requiresQuote(svc)
        ? `**${svc.name}** nécessite une évaluation pour un prix précis. 🔍\n\nJe peux vous réserver une visite d'évaluation gratuite${svc.pricing_note ? ` — ${svc.pricing_note}` : ''}. Quelle date vous conviendrait ?`
        : `Excellent choix ! **${svc.name}** (${svc.duration_minutes} min, ${formatPrice(svc)}). 📅\n\nQuelle date vous conviendrait ?`,
      ts: Date.now(),
    })
  }, [org, services, bookingState])

  const handleTimeSelect = useCallback(async (time: string) => {
    const newState = { ...bookingState, time }
    setBookingState(newState)
    setAvailableSlots([])
    addMsg({ role: 'user', content: fmtTime(time), ts: Date.now() })
    addMsg({
      role: 'assistant',
      content: `Parfait, **${fmtTime(time)}** c'est noté ! 👍\n\nPour confirmer votre réservation, j'ai besoin de quelques informations.\n\nComment vous appelez-vous ? (Prénom et nom)`,
      ts: Date.now(),
    })
  }, [bookingState])

  const handleConfirmBooking = useCallback(async () => {
    if (!org || !bookingState.serviceId || !bookingState.date || !bookingState.time || !bookingState.name || !bookingState.email) return
    setSubmitting(true)

    try {
      const svc = services.find((s) => s.id === bookingState.serviceId)
      const res = await fetch('/api/bookings/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgSlug: org.slug || org.id,
          serviceId: bookingState.serviceId,
          serviceName: bookingState.serviceName,
          servicePrice: svc?.base_price || null,
          serviceDuration: svc?.duration_minutes || 60,
          customerName: bookingState.name,
          customerEmail: bookingState.email,
          customerPhone: bookingState.phone || null,
          customerAddress: bookingState.address || null,
          date: bookingState.date,
          time: bookingState.time,
          notes: null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setBookingToken(data.booking.token)
        setDone(true)
        addMsg({
          role: 'assistant',
          content: `✅ **Votre réservation est confirmée !**\n\nUn email de confirmation a été envoyé à **${bookingState.email}**.\n\n${data.booking.status === 'pending' ? "L'entreprise confirmera votre rendez-vous sous peu." : "Vous êtes prêt(e) !"}`,
          ts: Date.now(),
        })
      } else {
        addMsg({ role: 'assistant', content: `Désolé, une erreur est survenue : ${data.error || 'Veuillez réessayer ou nous appeler.'}`, ts: Date.now() })
      }
    } catch {
      addMsg({ role: 'assistant', content: 'Désolé, une erreur est survenue. Veuillez nous appeler directement.', ts: Date.now() })
    }
    setSubmitting(false)
  }, [org, bookingState, services])

  const send = useCallback(async (text?: string) => {
    const content = (text || input).trim()
    if (!content || thinking || done) return
    setInput('')

    addMsg({ role: 'user', content, ts: Date.now() })
    setThinking(true)

    // Check if message contains a date
    const dateFromText = parseDateFromText(content)
    let nextState = { ...bookingState }
    let nextSlots = availableSlots

    if (dateFromText && !nextState.date && nextState.serviceId) {
      nextState.date = dateFromText
      setBookingState(nextState)

      // Fetch real slots immediately
      const svc = services.find((s) => s.id === nextState.serviceId)
      const duration = svc?.duration_minutes || 60
      const orgIdentifier = org?.slug || org?.id || ''
      nextSlots = await fetchSlots(dateFromText, duration, orgIdentifier)
    }

    try {
      const res = await fetch('/api/ai/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          businessName: org?.name,
          agentName: org?.ai_agent_name || 'Alex',
          services,
          bookingState: nextState,
          availableSlots: nextSlots,
          history: messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()

      // Apply extracted data
      if (data.extractedData) {
        const upd = { ...nextState }
        const ed = data.extractedData as Record<string, string>
        if (ed.date && !upd.date) upd.date = ed.date
        if (ed.name && !upd.name) upd.name = ed.name
        if (ed.email && !upd.email) upd.email = ed.email
        if (ed.phone && !upd.phone) upd.phone = ed.phone
        if (ed.address && !upd.address) upd.address = ed.address
        setBookingState(upd)
        nextState = upd

        // If date just set and have service → fetch slots
        if (ed.date && nextState.serviceId && nextSlots.length === 0) {
          const svc = services.find((s) => s.id === nextState.serviceId)
          const orgIdentifier = org?.slug || org?.id || ''
          nextSlots = await fetchSlots(ed.date, svc?.duration_minutes || 60, orgIdentifier)
        }
      }

      // Handle BOOKING_READY
      if (data.bookingReady) {
        const br = data.bookingReady
        const finalState: BookingState = {
          serviceId: br.serviceId || nextState.serviceId,
          serviceName: br.serviceName || nextState.serviceName,
          date: br.date || nextState.date,
          time: br.time || nextState.time,
          name: br.name || nextState.name,
          email: br.email || nextState.email,
          phone: br.phone || nextState.phone,
          address: br.address || nextState.address,
        }
        setBookingState(finalState)

        const svc = services.find((s) => s.id === finalState.serviceId)
        const dateFormatted = finalState.date
          ? new Date(finalState.date + 'T12:00:00').toLocaleDateString('fr-CA', { weekday: 'long', month: 'long', day: 'numeric' })
          : '—'

        addMsg({
          role: 'assistant',
          content: `Voici le résumé de votre réservation :\n\n📅 **${svc?.name || finalState.serviceName}** le ${dateFormatted} à ${finalState.time ? fmtTime(finalState.time) : '—'}\n👤 ${finalState.name}\n📧 ${finalState.email}${finalState.phone ? `\n📞 ${finalState.phone}` : ''}${finalState.address ? `\n📍 ${finalState.address}` : ''}${svc ? `\n💰 ${requiresQuote(svc) ? 'Devis après évaluation' : formatPrice(svc)}` : ''}\n\nConfirmez-vous cette réservation ?`,
          buttons: [
            { label: '✅ Oui, confirmer', value: 'confirm', action: 'confirm_booking' },
            { label: '✏️ Modifier', value: 'edit', action: 'edit_booking' },
          ],
          ts: Date.now(),
        })
        setThinking(false)
        return
      }

      // Build reply message, possibly with slot buttons
      const replyMsg: Message = { role: 'assistant', content: data.reply, ts: Date.now() }

      // If slots are available and time not yet selected → attach slot buttons
      if (nextSlots.length > 0 && !nextState.time) {
        replyMsg.buttons = nextSlots.map(s => ({
          label: fmtTime(s),
          value: s,
          action: 'select_time',
        }))
      }

      addMsg(replyMsg)
    } catch {
      addMsg({ role: 'assistant', content: "Je rencontre une difficulté. Veuillez réessayer.", ts: Date.now() })
    }

    setThinking(false)
  }, [input, thinking, done, org, services, bookingState, availableSlots, messages, fetchSlots])

  const handleButtonClick = useCallback(async (action: string, value: string) => {
    if (action === 'select_service') {
      await handleServiceSelect(value)
    } else if (action === 'select_time') {
      await handleTimeSelect(value)
    } else if (action === 'confirm_booking') {
      await handleConfirmBooking()
    } else if (action === 'edit_booking') {
      setBookingState(EMPTY_STATE)
      setAvailableSlots([])
      addMsg({ role: 'user', content: 'Je voudrais modifier ma réservation', ts: Date.now() })
      addMsg({
        role: 'assistant',
        content: 'Bien sûr ! Recommençons. Quel service souhaitez-vous réserver ?',
        buttons: services.map(s => ({
          label: `${s.name} — ${formatPrice(s)}`,
          value: s.id,
          action: 'select_service',
        })),
        ts: Date.now(),
      })
    }
  }, [handleServiceSelect, handleTimeSelect, handleConfirmBooking, services])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // ── Render ──

  if (pageLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
    </div>
  )

  if (notFound || !org) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 mb-4">
        <Sparkles className="h-8 w-8 text-indigo-600" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Portail de réservation introuvable</h1>
      <p className="text-sm text-gray-500">Ce lien est invalide ou désactivé.</p>
    </div>
  )

  const agentName = org.ai_agent_name || 'Alex'

  const progressFields = [
    !!bookingState.serviceName,
    !!bookingState.date,
    !!bookingState.time,
    !!bookingState.name,
    !!bookingState.email,
  ]
  const progressPct = Math.round((progressFields.filter(Boolean).length / 5) * 100)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur-md shrink-0">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{org.name}</p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-gray-400">{agentName} · Disponible 24/7</p>
            </div>
          </div>
          {/* Mini progress */}
          {progressPct > 0 && !done && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-xs text-gray-400">{progressPct}%</span>
            </div>
          )}
          {org.phone && (
            <a href={`tel:${org.phone}`}
              className="shrink-0 flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              <Phone className="h-3.5 w-3.5" /> {org.phone}
            </a>
          )}
        </div>

        {/* Context bar — shows collected info */}
        {(bookingState.serviceName || bookingState.date) && !done && (
          <div className="border-t border-gray-50 bg-indigo-50/60 px-4 py-1.5 flex items-center gap-3 text-xs text-indigo-600 overflow-x-auto mx-auto max-w-2xl">
            {bookingState.serviceName && (
              <span className="flex items-center gap-1 shrink-0"><ChevronRight className="h-3 w-3" />{bookingState.serviceName}</span>
            )}
            {bookingState.date && (
              <span className="flex items-center gap-1 shrink-0">
                <Calendar className="h-3 w-3" />
                {new Date(bookingState.date + 'T12:00:00').toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {bookingState.time && (
              <span className="flex items-center gap-1 shrink-0"><Clock className="h-3 w-3" />{fmtTime(bookingState.time)}</span>
            )}
            {bookingState.name && (
              <span className="flex items-center gap-1 shrink-0"><User className="h-3 w-3" />{bookingState.name}</span>
            )}
            {bookingState.email && (
              <span className="flex items-center gap-1 shrink-0"><Mail className="h-3 w-3" />{bookingState.email}</span>
            )}
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 mt-1 shadow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="flex flex-col gap-2 max-w-[85%]">
                <div className={[
                  'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm'
                    : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm',
                ].join(' ')}>
                  <p className="whitespace-pre-wrap">{msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                </div>

                {/* Buttons */}
                {msg.buttons && msg.buttons.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-1">
                    {msg.buttons.map((btn, bi) => (
                      <button
                        key={bi}
                        onClick={() => handleButtonClick(btn.action, btn.value)}
                        disabled={done || submitting}
                        className="rounded-xl border-2 border-indigo-100 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-40 transition-all shadow-sm"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {(thinking || loadingSlots || submitting) && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 mt-1">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Done confirmation card */}
          {done && (
            <div className="flex justify-center my-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-5 text-center max-w-sm w-full shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 mx-auto mb-3">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="text-base font-bold text-emerald-900 mb-1">Réservation confirmée !</p>
                <p className="text-sm text-emerald-700">
                  Un email de confirmation a été envoyé à <strong>{bookingState.email}</strong>.
                </p>
                {bookingState.date && (
                  <div className="mt-3 space-y-1 text-sm text-emerald-600">
                    <p className="flex items-center justify-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(bookingState.date + 'T12:00:00').toLocaleDateString('fr-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    {bookingState.time && (
                      <p className="flex items-center justify-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {fmtTime(bookingState.time)}
                      </p>
                    )}
                  </div>
                )}
                {bookingToken && (
                  <a href={`/booking/cancel/${bookingToken}`}
                    className="mt-3 inline-block text-xs text-emerald-500 underline hover:text-emerald-700">
                    Annuler ce rendez-vous
                  </a>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {!done && (
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 shrink-0">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/20 transition-all shadow-sm">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Tapez votre message… ou cliquez un bouton ci-dessus"
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                disabled={thinking || submitting}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || thinking || submitting}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="flex items-center gap-3 text-[10px] text-gray-300">
                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Confirmation immédiate</span>
                <span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> Réservation en 2 min</span>
              </div>
              <p className="text-[10px] text-gray-300">
                Propulsé par <span className="font-semibold text-indigo-400">Gestivio AI</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {done && org.phone && (
        <div className="sticky bottom-0 bg-white/95 border-t border-gray-100 px-4 py-4 text-center shrink-0">
          <a href={`tel:${org.phone}`}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            <Phone className="h-4 w-4" /> Appeler {org.name}
          </a>
        </div>
      )}
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    }>
      <BookingPageInner />
    </Suspense>
  )
}
