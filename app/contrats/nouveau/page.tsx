'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtMoney, fmtDate } from '@/lib/format'
import { estimateVisitCount, calculateRecurringDates } from '@/lib/recurring-dates'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import {
  ChevronLeft, ChevronRight, Check, Loader2, Users, Calendar,
  DollarSign, FileText, Send,
} from 'lucide-react'

interface Customer { id: string; name: string; email: string | null }

const STEPS_FR = ['Client et service', 'Horaire', 'Tarification', 'R\u00e9capitulatif']
const STEPS_EN = ['Client & Service', 'Schedule', 'Pricing', 'Review']

const RECURRENCE_OPTIONS = [
  { value: 'none', fr: 'Ponctuel', en: 'One-time' },
  { value: 'daily', fr: 'Quotidien', en: 'Daily' },
  { value: 'weekly', fr: 'Hebdomadaire', en: 'Weekly' },
  { value: 'biweekly', fr: 'Aux 2 semaines', en: 'Biweekly' },
  { value: 'monthly', fr: 'Mensuel', en: 'Monthly' },
  { value: 'custom', fr: 'Personnalis\u00e9', en: 'Custom' },
]

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function NewContractPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])

  // Step 1: Client + Service
  const [customerId, setCustomerId] = useState('')
  const [title, setTitle] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')

  // Step 2: Schedule
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [recurrenceType, setRecurrenceType] = useState('weekly')
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([1, 3, 5])

  // Step 3: Pricing
  const [pricePerVisit, setPricePerVisit] = useState('')
  const [billingType, setBillingType] = useState('per_visit')
  const [billingFrequency, setBillingFrequency] = useState('monthly')
  const [tpsEnabled, setTpsEnabled] = useState(true)
  const [tvqEnabled, setTvqEnabled] = useState(true)

  // Notes
  const [notes, setNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return
      const { data } = await supabase
        .from('customers')
        .select('id, name, email')
        .eq('user_id', authData.user.id)
        .order('name')
      if (data) setCustomers(data)

      // Handle renewal
      const renewId = searchParams.get('renew')
      if (renewId) {
        const res = await fetch(`/api/contracts/${renewId}`)
        if (res.ok) {
          const { contract } = await res.json()
          setCustomerId(contract.customer_id || '')
          setTitle(contract.title || '')
          setServiceName(contract.service_name || '')
          setServiceDescription(contract.service_description || '')
          setRecurrenceType(contract.recurrence_type || 'weekly')
          setRecurrenceDays(contract.recurrence_days || [1, 3, 5])
          setPricePerVisit(String(contract.price_per_visit || ''))
          setBillingType(contract.billing_type || 'per_visit')
          setBillingFrequency(contract.billing_frequency || 'monthly')
          setNotes(contract.notes || '')
        }
      }
    }
    load()
  }, [searchParams])

  const visitCount = useMemo(() => {
    if (!startDate || !endDate || recurrenceType === 'none') return recurrenceType === 'none' ? 1 : 0
    return estimateVisitCount(startDate, endDate, recurrenceType, recurrenceDays)
  }, [startDate, endDate, recurrenceType, recurrenceDays])

  const previewDates = useMemo(() => {
    if (!startDate || !endDate) return []
    return calculateRecurringDates(startDate, endDate, recurrenceType, recurrenceDays).slice(0, 5)
  }, [startDate, endDate, recurrenceType, recurrenceDays])

  const price = parseFloat(pricePerVisit) || 0
  const subtotal = price * visitCount
  const tps = tpsEnabled ? subtotal * 0.05 : 0
  const tvq = tvqEnabled ? subtotal * 0.09975 : 0
  const totalPrice = subtotal + tps + tvq

  const toggleDay = (day: number) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    )
  }

  const canProceed = (s: number): boolean => {
    if (s === 0) return !!customerId && !!title && !!serviceName
    if (s === 1) return !!startDate && !!endDate
    if (s === 2) return price > 0
    return true
  }

  const handleSave = async (sendAfter: boolean) => {
    setSaving(true)
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          customer_id: customerId,
          start_date: startDate,
          end_date: endDate,
          recurrence_type: recurrenceType,
          recurrence_days: recurrenceDays,
          service_name: serviceName,
          service_description: serviceDescription,
          price_per_visit: price,
          total_price: subtotal,
          billing_type: billingType,
          billing_frequency: billingFrequency,
          include_tps: tpsEnabled,
          include_tvq: tvqEnabled,
          notes,
          internal_notes: internalNotes,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error')
        setSaving(false)
        return
      }

      if (sendAfter && data.contract?.id) {
        await fetch(`/api/contracts/${data.contract.id}/send`, { method: 'POST' })
        toast.success(fr ? 'Contrat cr\u00e9\u00e9 et envoy\u00e9!' : 'Contract created and sent!')
      } else {
        toast.success(fr ? 'Contrat cr\u00e9\u00e9!' : 'Contract created!')
      }

      router.push(`/contrats/${data.contract.id}`)
    } catch {
      toast.error(fr ? 'Erreur lors de la cr\u00e9ation' : 'Creation failed')
    } finally {
      setSaving(false)
    }
  }

  const steps = fr ? STEPS_FR : STEPS_EN

  return (
    <AppLayout title={fr ? 'Nouveau contrat' : 'New contract'}>
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={[
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold shrink-0 transition-colors',
                i < step ? 'bg-indigo-600 text-white' :
                i === step ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-600' :
                'bg-gray-100 text-gray-400',
              ].join(' ')}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-indigo-700' : 'text-gray-400'}`}>{s}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 p-6 sm:p-8">
          {/* Step 1: Client + Service */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                {fr ? 'Client et service' : 'Client & Service'}
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {fr ? 'Client' : 'Customer'} *
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="">{fr ? 'S\u00e9lectionner un client' : 'Select a customer'}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {fr ? 'Titre du contrat' : 'Contract title'} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={fr ? 'ex: Entretien paysager 2026' : 'e.g. Landscaping maintenance 2026'}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {fr ? 'Nom du service' : 'Service name'} *
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder={fr ? 'ex: Tonte de pelouse' : 'e.g. Lawn mowing'}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {fr ? 'Description du service' : 'Service description'}
                </label>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                {fr ? 'Horaire' : 'Schedule'}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {fr ? 'D\u00e9but' : 'Start date'} *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {fr ? 'Fin' : 'End date'} *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {fr ? 'R\u00e9currence' : 'Recurrence'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRecurrenceType(opt.value)}
                      className={[
                        'px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
                        recurrenceType === opt.value
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400',
                      ].join(' ')}
                    >
                      {fr ? opt.fr : opt.en}
                    </button>
                  ))}
                </div>
              </div>

              {['weekly', 'biweekly', 'custom'].includes(recurrenceType) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {fr ? 'Jours' : 'Days'}
                  </label>
                  <div className="flex gap-2">
                    {(fr ? DAYS_FR : DAYS_EN).map((label, i) => {
                      const day = i + 1
                      const selected = recurrenceDays.includes(day)
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={[
                            'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                            selected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700',
                          ].join(' ')}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Preview */}
              {startDate && endDate && visitCount > 0 && (
                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950 p-4">
                  <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-2">
                    {fr
                      ? `Ce contrat g\u00e9n\u00e9rera environ ${visitCount} interventions`
                      : `This contract will generate approximately ${visitCount} jobs`}
                  </p>
                  {previewDates.length > 0 && (
                    <div className="space-y-1">
                      {previewDates.map((d) => (
                        <p key={d} className="text-xs text-indigo-600 dark:text-indigo-400">
                          {fmtDate(d, lang, 'long')}
                        </p>
                      ))}
                      {visitCount > 5 && (
                        <p className="text-xs text-indigo-500">
                          {fr ? `... et ${visitCount - 5} autres` : `... and ${visitCount - 5} more`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-600" />
                {fr ? 'Tarification' : 'Pricing'}
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {fr ? 'Prix par visite' : 'Price per visit'} *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricePerVisit}
                    onChange={(e) => setPricePerVisit(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {fr ? 'Type de facturation' : 'Billing type'}
                  </label>
                  <select
                    value={billingType}
                    onChange={(e) => setBillingType(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="per_visit">{fr ? 'Par visite' : 'Per visit'}</option>
                    <option value="monthly">{fr ? 'Mensuel' : 'Monthly'}</option>
                    <option value="seasonal">{fr ? 'Saisonnier' : 'Seasonal'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {fr ? 'Fr\u00e9quence de facturation' : 'Billing frequency'}
                  </label>
                  <select
                    value={billingFrequency}
                    onChange={(e) => setBillingFrequency(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  >
                    <option value="per_visit">{fr ? 'Par visite' : 'Per visit'}</option>
                    <option value="monthly">{fr ? 'Mensuel' : 'Monthly'}</option>
                    <option value="quarterly">{fr ? 'Trimestriel' : 'Quarterly'}</option>
                    <option value="seasonal">{fr ? 'Saisonnier' : 'Seasonal'}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tpsEnabled}
                    onChange={(e) => setTpsEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">TPS (5%)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tvqEnabled}
                    onChange={(e) => setTvqEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">TVQ (9,975%)</span>
                </label>
              </div>

              {/* Price summary */}
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{visitCount} {fr ? 'visites' : 'visits'} x {fmtMoney(price, lang)}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{fmtMoney(subtotal, lang)}</span>
                </div>
                {tpsEnabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">TPS (5%)</span>
                    <span className="text-gray-700 dark:text-gray-300">{fmtMoney(tps, lang)}</span>
                  </div>
                )}
                {tvqEnabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">TVQ (9,975%)</span>
                    <span className="text-gray-700 dark:text-gray-300">{fmtMoney(tvq, lang)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-base font-bold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-indigo-600">{fmtMoney(totalPrice, lang)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                {fr ? 'R\u00e9capitulatif' : 'Review'}
              </h2>

              <div className="space-y-4">
                <ReviewRow label={fr ? 'Client' : 'Customer'} value={customers.find((c) => c.id === customerId)?.name || ''} />
                <ReviewRow label={fr ? 'Titre' : 'Title'} value={title} />
                <ReviewRow label={fr ? 'Service' : 'Service'} value={serviceName} />
                <ReviewRow label={fr ? 'P\u00e9riode' : 'Period'} value={`${fmtDate(startDate, lang)} - ${fmtDate(endDate, lang)}`} />
                <ReviewRow label={fr ? 'R\u00e9currence' : 'Recurrence'} value={RECURRENCE_OPTIONS.find((o) => o.value === recurrenceType)?.[fr ? 'fr' : 'en'] || ''} />
                <ReviewRow label={fr ? 'Interventions estim\u00e9es' : 'Estimated jobs'} value={String(visitCount)} />
                <ReviewRow label={fr ? 'Prix par visite' : 'Price per visit'} value={fmtMoney(price, lang)} />
                <ReviewRow label={fr ? 'Sous-total' : 'Subtotal'} value={fmtMoney(subtotal, lang)} />
                {tpsEnabled && <ReviewRow label="TPS (5%)" value={fmtMoney(tps, lang)} />}
                {tvqEnabled && <ReviewRow label="TVQ (9,975%)" value={fmtMoney(tvq, lang)} />}
                <ReviewRow label="Total" value={fmtMoney(totalPrice, lang)} bold />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {fr ? 'Notes pour le client' : 'Notes for client'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {fr ? 'Notes internes' : 'Internal notes'}
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {fr ? 'Pr\u00e9c\u00e9dent' : 'Previous'}
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed(step)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {fr ? 'Suivant' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {fr ? 'Sauvegarder' : 'Save draft'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {fr ? 'Sauvegarder et envoyer' : 'Save & send'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function ReviewRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-indigo-600 text-base' : 'font-medium text-gray-900 dark:text-white'}`}>{value}</span>
    </div>
  )
}
