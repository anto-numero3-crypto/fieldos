'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../supabase'
import { Wrench, Send, Phone, CheckCircle, Sparkles, ArrowRight } from 'lucide-react'

interface Business {
  id: string
  name: string
  phone?: string
  email?: string
  service_types?: string[]
  ai_agent_name?: string
}

interface Message {
  role: 'assistant' | 'user'
  content: string
  ts: number
}

interface BookingData {
  serviceType?: string
  scheduledDate?: string
  scheduledTime?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
  confirmed?: boolean
}

export default function BookingPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [bookingData, setBookingData] = useState<BookingData>({})
  const [booked, setBooked] = useState(false)
  const [sessionId] = useState(() => Math.random().toString(36).slice(2))
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const bizId = params.get('biz')

    const fetchBusiness = async () => {
      let query = supabase.from('organizations').select('id, name, phone, email, service_types, ai_agent_name')
      if (bizId) query = query.eq('id', bizId)
      else query = query.limit(1)

      const { data } = await query.maybeSingle()
      setBusiness(data)
      setLoading(false)

      // Initial greeting
      if (data) {
        const agentName = data.ai_agent_name || 'Alex'
        const greeting = `Hi there! I'm ${agentName}, your booking assistant for **${data.name}**. 👋\n\nI'm here to help you schedule a service appointment. What can I help you with today?`
        setMessages([{ role: 'assistant', content: greeting, ts: Date.now() }])
      }
    }

    fetchBusiness()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const send = useCallback(async (text?: string) => {
    const content = (text || input).trim()
    if (!content || thinking || booked) return

    setInput('')
    const userMsg: Message = { role: 'user', content, ts: Date.now() }
    setMessages((m) => [...m, userMsg])
    setThinking(true)

    try {
      const res = await fetch('/api/ai/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId,
          businessId: business?.id,
          businessName: business?.name,
          agentName: business?.ai_agent_name || 'Alex',
          bookingData,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()

      // Merge any collected booking data
      if (data.bookingData) {
        const updated = { ...bookingData, ...data.bookingData }
        setBookingData(updated)

        // If all data collected, create the booking
        if (
          updated.customerEmail &&
          updated.customerName &&
          updated.serviceType &&
          updated.scheduledDate &&
          !updated.confirmed
        ) {
          updated.confirmed = true
          setBookingData(updated)
          await createBooking(updated)
        }
      }

      setMessages((m) => [...m, { role: 'assistant', content: data.reply, ts: Date.now() }])
    } catch {
      setMessages((m) => [...m, {
        role: 'assistant',
        content: "I'm having a little trouble right now. Please try again, or call us directly.",
        ts: Date.now(),
      }])
    }

    setThinking(false)
  }, [input, thinking, booked, business, bookingData, messages, sessionId])

  const createBooking = async (data: BookingData) => {
    if (!business) return

    try {
      // Find or create customer
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .ilike('email', data.customerEmail!)
        .limit(1)
        .maybeSingle()

      let customerId = existing?.id

      if (!customerId) {
        const { data: newC } = await supabase
          .from('customers')
          .insert({
            name: data.customerName,
            email: data.customerEmail,
            phone: data.customerPhone,
            address: data.customerAddress,
          })
          .select('id')
          .single()
        customerId = newC?.id
      }

      if (customerId) {
        await supabase.from('jobs').insert({
          title: `${data.serviceType} — ${data.customerName}`,
          status: 'scheduled',
          customer_id: customerId,
          scheduled_date: data.scheduledDate,
          internal_notes: data.scheduledTime ? `Requested time: ${data.scheduledTime}` : undefined,
          priority: 'normal',
          description: `Booked via AI booking portal. Customer: ${data.customerName}, ${data.customerEmail}`,
        })

        // Confirmation email
        if (data.customerEmail) {
          await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'job_confirmation',
              to: data.customerEmail,
              customerName: data.customerName,
              jobTitle: data.serviceType,
              scheduledDate: data.scheduledDate && data.scheduledTime
                ? `${new Date(data.scheduledDate + 'T12:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })} · ${data.scheduledTime}`
                : data.scheduledDate || 'To be confirmed',
              businessName: business.name,
            }),
          })
        }
      }

      setBooked(true)
    } catch (err) {
      console.error('Booking creation error:', err)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const QUICK_REPLIES = [
    'I need HVAC repair', 'Plumbing issue', 'Electrical work',
    'General cleaning', 'What services do you offer?', 'What are your prices?',
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
    </div>
  )

  if (!business) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 mb-4">
        <Wrench className="h-8 w-8 text-indigo-600" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Booking portal not found</h1>
      <p className="text-sm text-gray-500">This booking link may be invalid or expired.</p>
    </div>
  )

  const agentName = business.ai_agent_name || 'Alex'

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur-md shrink-0">
        <div className="mx-auto max-w-2xl px-4 py-3.5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{business.name}</p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-gray-400">AI booking — available 24/7</p>
            </div>
          </div>
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="shrink-0 flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" /> {business.phone}
            </a>
          )}
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">

          {/* Agent intro card */}
          {messages.length <= 1 && (
            <div className="flex items-start gap-3 mb-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm px-4 py-3 max-w-[85%]">
                <p className="text-xs font-semibold text-indigo-600 mb-0.5">{agentName} · AI Booking Assistant</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {messages[0]?.content.replace(/\*\*(.*?)\*\*/g, '$1')}
                </p>
              </div>
            </div>
          )}

          {messages.slice(1).map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 mt-1">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={[
                'max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm'
                  : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm',
              ].join(' ')}>
                <p className="whitespace-pre-wrap">{msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
              </div>
            </div>
          ))}

          {thinking && (
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

          {/* Booked confirmation */}
          {booked && (
            <div className="flex justify-center my-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 text-center max-w-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-emerald-900">Booking confirmed!</p>
                <p className="text-xs text-emerald-700 mt-1">
                  A confirmation has been sent to {bookingData.customerEmail}.
                </p>
                {bookingData.scheduledDate && (
                  <p className="text-xs text-emerald-600 mt-2 font-medium">
                    📅 {new Date(bookingData.scheduledDate + 'T12:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
                    {bookingData.scheduledTime && ` · ${bookingData.scheduledTime}`}
                  </p>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick replies — shown when not booked */}
      {!booked && messages.length <= 1 && (
        <div className="mx-auto max-w-2xl w-full px-4 pb-2">
          <p className="text-xs text-gray-400 mb-2 text-center">Quick start:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {QUICK_REPLIES.map((r) => (
              <button
                key={r}
                onClick={() => send(r)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-colors shadow-sm"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      {!booked ? (
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 shrink-0">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/20 transition-all shadow-sm">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type your message…"
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                disabled={thinking}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || thinking}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              Powered by <span className="font-semibold text-indigo-500">FieldOS AI</span> · Responses are instant
            </p>
          </div>
        </div>
      ) : (
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-4 text-center shrink-0">
          <p className="text-sm text-gray-600 mb-3">
            Your appointment has been requested. {business.name} will confirm shortly.
          </p>
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <Phone className="h-4 w-4" /> Call {business.name}
            </a>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Powered by <a href="/" className="text-indigo-500 font-medium">FieldOS</a>
          </p>
        </div>
      )}

      {/* Trust footer */}
      {!booked && (
        <div className="text-center py-3">
          <div className="flex items-center justify-center gap-4 text-[10px] text-gray-300">
            <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Instant confirmation</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> No account needed</span>
            <span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> 2-min booking</span>
          </div>
        </div>
      )}
    </div>
  )
}
