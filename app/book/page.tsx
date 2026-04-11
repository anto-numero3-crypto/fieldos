'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Wrench, Calendar, User, Phone, Mail, ChevronRight, CheckCircle, Clock, ArrowLeft, Zap } from 'lucide-react'

interface Business {
  id: string
  name: string
  phone?: string
  email?: string
  service_types?: string[]
}

const SERVICE_TYPES = [
  { id: 'hvac',          emoji: '❄️',  label: 'HVAC / AC Repair' },
  { id: 'plumbing',      emoji: '🔧',  label: 'Plumbing' },
  { id: 'electrical',    emoji: '⚡',  label: 'Electrical' },
  { id: 'cleaning',      emoji: '🧹',  label: 'Cleaning' },
  { id: 'landscaping',   emoji: '🌿',  label: 'Landscaping' },
  { id: 'painting',      emoji: '🎨',  label: 'Painting' },
  { id: 'roofing',       emoji: '🏠',  label: 'Roofing' },
  { id: 'pest_control',  emoji: '🐛',  label: 'Pest Control' },
  { id: 'appliances',    emoji: '🔌',  label: 'Appliance Repair' },
  { id: 'locksmith',     emoji: '🔑',  label: 'Locksmith' },
  { id: 'moving',        emoji: '📦',  label: 'Moving' },
  { id: 'other',         emoji: '🛠️',  label: 'Other' },
]

const TIME_SLOTS = [
  '8:00 AM – 10:00 AM',
  '10:00 AM – 12:00 PM',
  '12:00 PM – 2:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
]

type Step = 'service' | 'datetime' | 'contact' | 'confirm' | 'success'

export default function BookingPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [step, setStep]         = useState<Step>('service')
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [serviceType, setServiceType] = useState('')
  const [serviceNote, setServiceNote] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [address, setAddress]   = useState('')

  // Get business from URL param or default to first active business
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const bizId  = params.get('biz')

    const fetchBusiness = async () => {
      let query = supabase.from('organizations').select('id, name, phone, email, service_types')
      if (bizId) query = query.eq('id', bizId)
      else query = query.limit(1)

      const { data } = await query.single()
      setBusiness(data)
      setLoading(false)
    }

    fetchBusiness()
  }, [])

  // Get next 14 available dates (skip Sundays)
  const availableDates = Array.from({ length: 21 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d
  }).filter(d => d.getDay() !== 0).slice(0, 14)

  const submitBooking = async () => {
    setSubmitting(true)
    try {
      // Find if customer already exists
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .ilike('email', email)
        .limit(1)
        .single()

      let customerId = existing?.id

      // Create customer if not found
      if (!customerId) {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({ name, email, phone, service_address: address })
          .select('id')
          .single()
        customerId = newCustomer?.id
      }

      // Create the job
      if (customerId) {
        await supabase.from('jobs').insert({
          title: `${SERVICE_TYPES.find(s => s.id === serviceType)?.label || serviceType} — ${name}`,
          status: 'scheduled',
          customer_id: customerId,
          scheduled_date: selectedDate,
          service_address: address,
          internal_notes: `Time slot: ${selectedTime}${serviceNote ? `\n\nCustomer note: ${serviceNote}` : ''}`,
          priority: 'normal',
        })

        // Send confirmation email
        if (email && business) {
          await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'job_confirmation',
              to: email,
              customerName: name,
              jobTitle: SERVICE_TYPES.find(s => s.id === serviceType)?.label,
              scheduledDate: `${new Date(selectedDate).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })} · ${selectedTime}`,
              businessName: business.name,
            }),
          })
        }
      }

      setStep('success')
    } catch (err) {
      console.error('Booking error:', err)
    }
    setSubmitting(false)
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
    </div>
  )

  if (!business) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 mb-4">
        <Wrench className="h-8 w-8 text-indigo-600" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Business not found</h1>
      <p className="text-sm text-gray-500">This booking link may be invalid or expired.</p>
    </div>
  )

  const stepOrder: Step[] = ['service', 'datetime', 'contact', 'confirm']
  const stepIndex = stepOrder.indexOf(step)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
            <Wrench className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{business.name}</p>
            <p className="text-xs text-gray-400">Online booking</p>
          </div>
          {business.phone && (
            <a href={`tel:${business.phone}`} className="ml-auto flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
              <Phone className="h-3.5 w-3.5" /> {business.phone}
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">

        {/* Progress bar */}
        {step !== 'success' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {['Service', 'Date & Time', 'Your Info', 'Confirm'].map((label, i) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${i < stepIndex ? 'bg-indigo-600 text-white' : i === stepIndex ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300' : 'bg-gray-100 text-gray-400'}`}>
                    {i < stepIndex ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className={`hidden sm:block text-xs font-medium ${i === stepIndex ? 'text-indigo-700' : 'text-gray-400'}`}>{label}</span>
                </div>
              ))}
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${((stepIndex) / (stepOrder.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step: Service selection */}
        {step === 'service' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">What do you need?</h2>
            <p className="text-gray-500 mb-6">Select the service you&apos;re looking for.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {SERVICE_TYPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setServiceType(s.id)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-sm font-medium transition-all ${serviceType === s.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-center leading-tight">{s.label}</span>
                </button>
              ))}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Any additional details? (optional)</label>
              <textarea
                value={serviceNote}
                onChange={(e) => setServiceNote(e.target.value)}
                rows={3}
                placeholder="Describe the issue or what you need done..."
                className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>
            <button
              onClick={() => setStep('datetime')}
              disabled={!serviceType}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              Next: Pick a date <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step: Date & Time */}
        {step === 'datetime' && (
          <div>
            <button onClick={() => setStep('service')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">When works for you?</h2>
            <p className="text-gray-500 mb-6">Pick a date and arrival window.</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select a date</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableDates.map((d) => {
                  const str = d.toISOString().split('T')[0]
                  const isSelected = selectedDate === str
                  return (
                    <button
                      key={str}
                      onClick={() => setSelectedDate(str)}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border-2 p-3 text-sm transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                    >
                      <span className="text-xs font-medium uppercase opacity-60">{d.toLocaleDateString('en', { weekday: 'short' })}</span>
                      <span className="text-base font-bold">{d.getDate()}</span>
                      <span className="text-xs opacity-60">{d.toLocaleDateString('en', { month: 'short' })}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select an arrival window</label>
                <div className="space-y-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${selectedTime === slot ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                    >
                      <Clock className="h-4 w-4 shrink-0" /> {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep('contact')}
              disabled={!selectedDate || !selectedTime}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              Next: Your info <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step: Contact info */}
        {step === 'contact' && (
          <div>
            <button onClick={() => setStep('datetime')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Your information</h2>
            <p className="text-gray-500 mb-6">We&apos;ll use this to confirm your booking.</p>

            <div className="space-y-4 mb-6">
              {[
                { label: 'Full name', value: name, onChange: setName, placeholder: 'Jane Smith', icon: User, required: true, type: 'text' },
                { label: 'Email address', value: email, onChange: setEmail, placeholder: 'jane@example.com', icon: Mail, required: true, type: 'email' },
                { label: 'Phone number', value: phone, onChange: setPhone, placeholder: '(555) 000-0000', icon: Phone, required: false, type: 'tel' },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={field.type}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="block w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Service address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="123 Main St, City, State"
                  className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>
            </div>

            <button
              onClick={() => setStep('confirm')}
              disabled={!name || !email}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              Review booking <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div>
            <button onClick={() => setStep('contact')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Confirm your booking</h2>
            <p className="text-gray-500 mb-6">Review your details before submitting.</p>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-6">
              <div className="bg-indigo-600 px-6 py-4">
                <p className="text-white font-semibold text-lg">{SERVICE_TYPES.find(s => s.id === serviceType)?.label}</p>
                <p className="text-indigo-200 text-sm">{business.name}</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { icon: Calendar, label: 'Date', value: `${new Date(selectedDate + 'T12:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })} · ${selectedTime}` },
                  { icon: User,     label: 'Name', value: name },
                  { icon: Mail,     label: 'Email', value: email },
                  ...(phone   ? [{ icon: Phone,    label: 'Phone',   value: phone   }] : []),
                  ...(address ? [{ icon: Zap,      label: 'Address', value: address }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <row.icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">{row.label}</p>
                      <p className="text-sm font-medium text-gray-900">{row.value}</p>
                    </div>
                  </div>
                ))}
                {serviceNote && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Notes</p>
                    <p className="text-sm text-gray-600">{serviceNote}</p>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mb-4">
              By booking, you agree to receive a confirmation email at {email}.
            </p>

            <button
              onClick={submitBooking}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 shadow-sm transition-all"
            >
              {submitting ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Booking…</>
              ) : (
                <><CheckCircle className="h-4 w-4" /> Confirm booking</>
              )}
            </button>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">You&apos;re booked!</h2>
            <p className="text-gray-500 mb-2">
              {business.name} will see your request and confirm shortly.
            </p>
            {email && <p className="text-sm text-gray-400">A confirmation was sent to <strong>{email}</strong>.</p>}

            <div className="mt-8 rounded-2xl border border-gray-100 bg-white shadow-sm p-5 text-left max-w-sm mx-auto">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Booking summary</p>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">{SERVICE_TYPES.find(s => s.id === serviceType)?.label}</span></p>
                <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-gray-400" />{selectedTime}</p>
              </div>
            </div>

            {business.phone && (
              <p className="mt-6 text-sm text-gray-400">
                Questions? Call us at <a href={`tel:${business.phone}`} className="font-semibold text-indigo-600">{business.phone}</a>
              </p>
            )}
          </div>
        )}
      </main>

      <footer className="mt-12 border-t border-gray-100 py-6 text-center">
        <p className="text-xs text-gray-400">Powered by <span className="font-semibold text-indigo-600">FieldOS</span></p>
      </footer>
    </div>
  )
}
