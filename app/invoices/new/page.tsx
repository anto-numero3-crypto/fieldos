'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../supabase'
import AppLayout from '@/components/AppLayout'
import { toast } from 'sonner'
import {
  Plus, Trash2, GripVertical, Save, Send, Eye, ArrowLeft,
  User, Calendar, Hash, FileText, ChevronDown,
} from 'lucide-react'
import Link from 'next/link'

interface LineItem {
  id: string
  description: string
  qty: number
  unit: string
  unit_price: number
  taxable: boolean
}

interface Customer { id: string; name: string; email: string | null; phone: string | null; address: string | null }
interface Job { id: string; title: string }

const UNITS = ['unité', 'heure', 'jour', 'pi²', 'm²', 'forfait', 'visite', 'mois']
const DUE_DATE_OPTIONS = [
  { label: 'Dû à la réception', days: 0 },
  { label: 'Net 7 jours',  days: 7 },
  { label: 'Net 15 jours', days: 15 },
  { label: 'Net 30 jours', days: 30 },
  { label: 'Net 45 jours', days: 45 },
  { label: 'Net 60 jours', days: 60 },
  { label: 'Personnalisé', days: -1 },
]

const uid = () => Math.random().toString(36).slice(2, 9)

const newLine = (): LineItem => ({
  id: uid(), description: '', qty: 1, unit: 'unité', unit_price: 0, taxable: true,
})

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [user, setUser] = useState<{ id: string } | null>(null)
  const [orgName, setOrgName] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [jobs, setJobs] = useState<Job[]>([])

  // Header fields
  const [customerId, setCustomerId] = useState('')
  const [jobId, setJobId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDateOption, setDueDateOption] = useState(30)
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]
  })
  const [customDueDate, setCustomDueDate] = useState(false)

  // Line items
  const [lines, setLines] = useState<LineItem[]>([newLine()])

  // Tax
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [taxName, setTaxName] = useState('TPS')
  const [taxRate, setTaxRate] = useState('5')
  const [tax2Enabled, setTax2Enabled] = useState(false)
  const [tax2Name, setTax2Name] = useState('TVQ')
  const [tax2Rate, setTax2Rate] = useState('9.975')

  // Discount
  const [discountEnabled, setDiscountEnabled] = useState(false)
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed')
  const [discountValue, setDiscountValue] = useState('')

  // Notes
  const [clientNotes, setClientNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [terms, setTerms] = useState('Paiement dû dans 30 jours.')

  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const init = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { router.push('/login'); return }
    setUser(auth.user)

    const [{ data: org }, { data: custs }, { data: jbs }] = await Promise.all([
      supabase.from('organizations').select('name').eq('owner_user_id', auth.user.id).single(),
      supabase.from('customers').select('id, name, email, phone, address').eq('user_id', auth.user.id).order('name'),
      supabase.from('jobs').select('id, title').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(50),
    ])
    if (org?.name) setOrgName(org.name)
    setCustomers(custs || [])
    setJobs(jbs || [])

    // Pre-fill from ?customerId= or ?jobId= query params (cross-module handoff)
    const preCustomerId = searchParams.get('customerId')
    const preJobId = searchParams.get('jobId')
    if (preCustomerId && custs?.some((c) => c.id === preCustomerId)) {
      setCustomerId(preCustomerId)
    }
    if (preJobId && jbs?.some((j) => j.id === preJobId)) {
      setJobId(preJobId)
      // If the job has a customer, pre-select it too
      const { data: job } = await supabase
        .from('jobs')
        .select('customer_id')
        .eq('id', preJobId)
        .maybeSingle()
      if (job?.customer_id) setCustomerId(job.customer_id)
    }

    // Generate invoice number
    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', auth.user.id)
    setInvoiceNumber(`INV-${String((count || 0) + 1).padStart(4, '0')}`)
  }, [router, searchParams])

  useEffect(() => { init() }, [init])

  const handleDueDateOption = (days: number) => {
    if (days === -1) { setCustomDueDate(true); return }
    setCustomDueDate(false)
    setDueDateOption(days)
    const d = new Date(issueDate)
    d.setDate(d.getDate() + days)
    setDueDate(d.toISOString().split('T')[0])
  }

  // Calculations
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit_price, 0)
  const taxableSubtotal = lines.filter((l) => l.taxable).reduce((s, l) => s + l.qty * l.unit_price, 0)
  const tax1Amt  = taxEnabled ? taxableSubtotal * (parseFloat(taxRate) || 0) / 100 : 0
  const tax2Amt  = tax2Enabled ? taxableSubtotal * (parseFloat(tax2Rate) || 0) / 100 : 0
  const discAmt  = discountEnabled
    ? discountType === 'fixed'
      ? parseFloat(discountValue) || 0
      : subtotal * (parseFloat(discountValue) || 0) / 100
    : 0
  const total = subtotal + tax1Amt + tax2Amt - discAmt

  const fmt = (n: number) => `$${n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const addLine  = () => setLines([...lines, newLine()])
  const removeLine = (id: string) => setLines(lines.filter((l) => l.id !== id))
  const updateLine = <K extends keyof LineItem>(id: string, key: K, val: LineItem[K]) =>
    setLines(lines.map((l) => l.id === id ? { ...l, [key]: val } : l))

  const buildPayload = () => ({
    user_id:       user!.id,
    customer_id:   customerId || null,
    job_id:        jobId || null,
    invoice_number: invoiceNumber,
    status:        'unpaid',
    line_items:    lines.filter((l) => l.description.trim()),
    subtotal,
    tax_name:      taxName,
    tax_rate:      taxEnabled ? parseFloat(taxRate) || 0 : 0,
    tax_amount:    tax1Amt,
    tax2_name:     tax2Enabled ? tax2Name : null,
    tax2_rate:     tax2Enabled ? parseFloat(tax2Rate) || 0 : 0,
    tax2_amount:   tax2Amt,
    discount:      discAmt,
    discount_type: discountType,
    amount:        total,
    due_date:      dueDate || null,
    client_notes:  clientNotes || null,
    internal_notes: internalNotes || null,
    terms:         terms || null,
  })

  const saveDraft = async () => {
    if (!user) return
    setSaving(true)
    const { data, error } = await supabase.from('invoices').insert(buildPayload()).select('id').single()
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Brouillon enregistré !')
    router.push(`/invoices/${data.id}`)
  }

  const saveAndSend = async () => {
    if (!customerId) { toast.error('Sélectionnez un client avant d\'envoyer.'); return }
    setSending(true)
    const { data, error } = await supabase.from('invoices').insert(buildPayload()).select('id, token').single()
    if (error) { toast.error(error.message); setSending(false); return }

    // Send email via API
    const cust = customers.find((c) => c.id === customerId)
    if (cust?.email) {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invoice',
          to: cust.email,
          customerName: cust.name,
          invoiceNumber,
          amount: fmt(total),
          dueDate: dueDate ? new Date(dueDate).toLocaleDateString('fr-CA', { month: 'long', day: 'numeric', year: 'numeric' }) : undefined,
          paymentLink: `${window.location.origin}/invoice/${data.token}`,
        }),
      })
    }
    toast.success('Facture créée et envoyée !')
    router.push(`/invoices/${data.id}`)
  }

  const selectedCustomer = customers.find((c) => c.id === customerId)

  return (
    <AppLayout title="Nouvelle facture">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto pb-32">

        {/* Back */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/invoices" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Factures
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900">Nouvelle facture</span>
        </div>

        <div className="space-y-6">

          {/* Header card: invoice # + dates */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" /> Numéro de facture
                </label>
                <input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Date d&apos;émission
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Date d&apos;échéance
                </label>
                {!customDueDate ? (
                  <div className="flex gap-2">
                    <select
                      value={dueDateOption}
                      onChange={(e) => handleDueDateOption(parseInt(e.target.value))}
                      className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {DUE_DATE_OPTIONS.map((opt) => (
                        <option key={opt.days} value={opt.days}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Customer + Job */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" /> Client
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Client *</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Sélectionner un client…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Intervention liée (optionnel)</label>
                <select
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Aucune</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCustomer && (
              <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-500 grid sm:grid-cols-3 gap-1">
                {selectedCustomer.email && <span>📧 {selectedCustomer.email}</span>}
                {selectedCustomer.phone && <span>📞 {selectedCustomer.phone}</span>}
                {selectedCustomer.address && <span>📍 {selectedCustomer.address}</span>}
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" /> Lignes de facturation
              </h2>
            </div>

            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_100px_120px_100px_40px] gap-3 px-6 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Description</span>
              <span className="text-center">Qté</span>
              <span className="text-center">Unité</span>
              <span className="text-right">Prix unit.</span>
              <span className="text-right">Taxable</span>
              <span />
            </div>

            <div className="divide-y divide-gray-50">
              {lines.map((line, i) => (
                <div key={line.id} className="grid sm:grid-cols-[1fr_80px_100px_120px_100px_40px] gap-3 px-6 py-3 items-center">
                  <input
                    placeholder={`Description de l'item ${i + 1}`}
                    value={line.description}
                    onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={line.qty}
                    onChange={(e) => updateLine(line.id, 'qty', parseFloat(e.target.value) || 0)}
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-center text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                  />
                  <select
                    value={line.unit}
                    onChange={(e) => updateLine(line.id, 'unit', e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unit_price || ''}
                      onChange={(e) => updateLine(line.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="block w-full rounded-lg border border-gray-200 pl-6 pr-3 py-2 text-sm text-right text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                    />
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => updateLine(line.id, 'taxable', !line.taxable)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${line.taxable ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${line.taxable ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length === 1}
                    className="flex items-center justify-center text-gray-300 hover:text-red-400 disabled:opacity-20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" /> Ajouter une ligne
              </button>
            </div>
          </div>

          {/* Totals + Tax + Discount */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <div className="grid sm:grid-cols-2 gap-8">
              {/* Left: settings */}
              <div className="space-y-4">
                {/* Tax 1 */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Taxe 1</label>
                  <button
                    type="button"
                    onClick={() => setTaxEnabled(!taxEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${taxEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${taxEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {taxEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={taxName}
                      onChange={(e) => setTaxName(e.target.value)}
                      placeholder="Nom (ex: TPS)"
                      className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <div className="relative">
                      <input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        min="0"
                        max="100"
                        step="0.001"
                        className="block w-full rounded-xl border border-gray-200 px-3 py-2 pr-7 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                )}

                {/* Tax 2 */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Taxe 2 (TVQ)</label>
                  <button
                    type="button"
                    onClick={() => setTax2Enabled(!tax2Enabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${tax2Enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${tax2Enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {tax2Enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={tax2Name}
                      onChange={(e) => setTax2Name(e.target.value)}
                      placeholder="Nom (ex: TVQ)"
                      className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <div className="relative">
                      <input
                        type="number"
                        value={tax2Rate}
                        onChange={(e) => setTax2Rate(e.target.value)}
                        min="0"
                        max="100"
                        step="0.001"
                        className="block w-full rounded-xl border border-gray-200 px-3 py-2 pr-7 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                )}

                {/* Discount */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Escompte</label>
                  <button
                    type="button"
                    onClick={() => setDiscountEnabled(!discountEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${discountEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${discountEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {discountEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percent')}
                      className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="fixed">Montant fixe ($)</option>
                      <option value="percent">Pourcentage (%)</option>
                    </select>
                    <div className="relative">
                      <input
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0"
                        className="block w-full rounded-xl border border-gray-200 px-3 py-2 pr-7 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        {discountType === 'percent' ? '%' : '$'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: totals */}
              <div className="flex flex-col justify-end space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sous-total</span>
                  <span className="font-medium text-gray-900">{fmt(subtotal)}</span>
                </div>
                {discAmt > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Escompte</span>
                    <span className="font-medium text-emerald-600">-{fmt(discAmt)}</span>
                  </div>
                )}
                {taxEnabled && tax1Amt > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{taxName} ({taxRate}%)</span>
                    <span className="font-medium text-gray-900">{fmt(tax1Amt)}</span>
                  </div>
                )}
                {tax2Enabled && tax2Amt > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{tax2Name} ({tax2Rate}%)</span>
                    <span className="font-medium text-gray-900">{fmt(tax2Amt)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-3 mt-2">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-black text-gray-900">{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Notes et conditions</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Note au client (visible sur la facture)</label>
                <textarea
                  rows={3}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Merci pour votre confiance…"
                  className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Note interne (non visible par le client)</label>
                <textarea
                  rows={3}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notes internes…"
                  className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Conditions de paiement</label>
              <input
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Fixed bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-3 sm:px-6 shadow-xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="text-right min-w-0 hidden sm:block">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-xl font-black text-gray-900">{fmt(total)}</p>
            </div>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
              <button
                onClick={saveDraft}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-all shadow-sm"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Enregistrement…' : 'Brouillon'}
              </button>
              <button
                onClick={saveAndSend}
                disabled={sending || !customerId}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-sm"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Envoi…' : 'Enregistrer et envoyer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
