'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../supabase'
import AppLayout from '@/components/AppLayout'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtMoney, fmtDate } from '@/lib/format'
import {
  Plus, Trash2, Save, Send, Eye, EyeOff, ArrowLeft,
  User, Calendar, Hash, FileText, ChevronDown, ChevronUp,
  Search, Sparkles, X, Loader2, CheckCircle,
} from 'lucide-react'
import Link from 'next/link'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LineItem {
  id: string
  description: string
  qty: number
  unit: string
  unit_price: number
  position: number
  product_id?: string | null
}

interface Customer { id: string; name: string; email: string | null; phone: string | null; address: string | null }
interface Job { id: string; title: string }
interface Product { id: string; name: string; unit_price: number; unit: string; description: string | null }

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const uid = () => Math.random().toString(36).slice(2, 9)
const newLine = (pos: number): LineItem => ({
  id: uid(), description: '', qty: 1, unit: 'unit', unit_price: 0, position: pos,
})

function getDueDateOptions(fr: boolean) {
  return [
    { label: fr ? 'Du\u0300 a\u0300 la re\u0301ception' : 'Due on receipt', days: 0 },
    { label: fr ? 'Net 7 jours' : 'Net 7 days', days: 7 },
    { label: fr ? 'Net 15 jours' : 'Net 15 days', days: 15 },
    { label: fr ? 'Net 30 jours' : 'Net 30 days', days: 30 },
    { label: fr ? 'Net 60 jours' : 'Net 60 days', days: 60 },
  ]
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang, t } = useLanguage()
  const fr = lang === 'fr'
  const DUE_DATE_OPTIONS = getDueDateOptions(fr)

  /* ---- data ---- */
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [orgName, setOrgName] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [products, setProducts] = useState<Product[]>([])

  /* ---- client selector ---- */
  const [customerId, setCustomerId] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const customerRef = useRef<HTMLDivElement>(null)

  /* ---- invoice details (collapsible) ---- */
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDateOption, setDueDateOption] = useState(30)
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]
  })
  const [poNumber, setPoNumber] = useState('')
  const [jobId, setJobId] = useState('')

  /* ---- line items ---- */
  const [lines, setLines] = useState<LineItem[]>([newLine(0)])
  const [productSearch, setProductSearch] = useState<Record<string, string>>({})
  const [productDropdown, setProductDropdown] = useState<string | null>(null)
  const [productHighlight, setProductHighlight] = useState(-1)

  /* ---- taxes & discount ---- */
  const [applyTps, setApplyTps] = useState(true)
  const [applyTvq, setApplyTvq] = useState(true)
  const [discountEnabled, setDiscountEnabled] = useState(false)
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState('')

  /* ---- notes ---- */
  const [clientNotes, setClientNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  /* ---- state ---- */
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)

  /* ---- AI ---- */
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  /* ---- Init ---- */
  const init = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { router.push('/login'); return }
    setUser(auth.user)

    const [{ data: org }, { data: custs }, { data: jbs }] = await Promise.all([
      supabase.from('organizations').select('name, invoice_default_tps, invoice_default_tvq').eq('owner_user_id', auth.user.id).single(),
      supabase.from('customers').select('id, name, email, phone, address').eq('user_id', auth.user.id).order('name'),
      supabase.from('jobs').select('id, title').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(50),
    ])
    if (org?.name) setOrgName(org.name)
    if (org?.invoice_default_tps === false) setApplyTps(false)
    if (org?.invoice_default_tvq === false) setApplyTvq(false)
    setCustomers(custs || [])
    setJobs(jbs || [])

    // Fetch products
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch { /* products not available */ }

    // Pre-fill from query params
    const preCustomerId = searchParams.get('customerId')
    const preJobId = searchParams.get('jobId')
    if (preCustomerId && custs?.some((c) => c.id === preCustomerId)) {
      setCustomerId(preCustomerId)
    }
    if (preJobId && jbs?.some((j) => j.id === preJobId)) {
      setJobId(preJobId)
      const { data: job } = await supabase
        .from('jobs')
        .select('customer_id, title')
        .eq('id', preJobId)
        .maybeSingle()
      if (job?.customer_id) setCustomerId(job.customer_id)
      if (job?.title) {
        setLines([{ id: uid(), description: job.title, qty: 1, unit: fr ? 'forfait' : 'flat', unit_price: 0, position: 0 }])
      }
    }

    // Invoice number from API
    try {
      const res = await fetch('/api/invoices/next-number')
      const data = await res.json()
      if (data.number) setInvoiceNumber(data.number)
    } catch {
      const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', auth.user.id)
      setInvoiceNumber(`FAC-${String((count || 0) + 1).padStart(4, '0')}`)
    }
  }, [router, searchParams, fr])

  useEffect(() => { init() }, [init])

  /* ---- Click outside to close customer dropdown ---- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ---- Due date logic ---- */
  const handleDueDateOption = (days: number) => {
    setDueDateOption(days)
    const d = new Date(issueDate)
    d.setDate(d.getDate() + days)
    setDueDate(d.toISOString().split('T')[0])
  }

  /* ---- Line item helpers ---- */
  const addLine = () => setLines([...lines, newLine(lines.length)])
  const removeLine = (id: string) => { if (lines.length > 1) setLines(lines.filter((l) => l.id !== id)) }
  const updateLine = <K extends keyof LineItem>(id: string, key: K, val: LineItem[K]) =>
    setLines(lines.map((l) => l.id === id ? { ...l, [key]: val } : l))

  const selectProduct = (lineId: string, product: Product) => {
    setLines(lines.map((l) => l.id === lineId ? {
      ...l,
      description: product.name,
      unit_price: product.unit_price,
      unit: product.unit || 'unit',
      product_id: product.id,
    } : l))
    setProductDropdown(null)
    setProductSearch((prev) => ({ ...prev, [lineId]: '' }))
    setProductHighlight(-1)
  }

  /* ---- Calculations ---- */
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit_price, 0)
  const discAmt = discountEnabled
    ? discountType === 'fixed' ? parseFloat(discountValue) || 0 : subtotal * (parseFloat(discountValue) || 0) / 100
    : 0
  const afterDiscount = subtotal - discAmt
  const tpsAmt = applyTps ? afterDiscount * 0.05 : 0
  const tvqAmt = applyTvq ? afterDiscount * 0.09975 : 0
  const total = afterDiscount + tpsAmt + tvqAmt

  const fmt = (n: number) => fmtMoney(n, lang)

  /* ---- Customer filter ---- */
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim()
    if (!q) return customers.slice(0, 5)
    return customers.filter((c) => c.name.toLowerCase().includes(q))
  }, [customerSearch, customers])

  const selectedCustomer = customers.find((c) => c.id === customerId)

  /* ---- Build payload ---- */
  const buildPayload = (status: string) => ({
    user_id: user!.id,
    customer_id: customerId || null,
    job_id: jobId || null,
    invoice_number: invoiceNumber,
    status,
    line_items: lines.filter((l) => l.description.trim()).map((l, i) => ({
      ...l, position: i,
    })),
    subtotal,
    tax_name: 'TPS',
    tax_rate: applyTps ? 5 : 0,
    tax_amount: tpsAmt,
    tax2_name: 'TVQ',
    tax2_rate: applyTvq ? 9.975 : 0,
    tax2_amount: tvqAmt,
    discount: discAmt,
    discount_type: discountType,
    amount: total,
    due_date: dueDate || null,
    client_notes: clientNotes || null,
    internal_notes: internalNotes || null,
    terms: poNumber || null,
    po_number: poNumber || null,
  })

  /* ---- Auto-save draft every 30s ---- */
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (!user || !customerId) return
    autoSaveTimer.current = setInterval(async () => {
      if (draftId) {
        await supabase.from('invoices').update(buildPayload('draft')).eq('id', draftId)
      } else {
        const { data } = await supabase.from('invoices').insert(buildPayload('draft')).select('id').single()
        if (data) setDraftId(data.id)
      }
      setSavedAt(new Date())
    }, 30000)
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current) }
  })

  /* ---- Save / Send ---- */
  const saveDraft = async () => {
    if (!user || !customerId) {
      toast.error(fr ? 'Veuillez sélectionner un client' : 'Please select a customer')
      return
    }
    setSaving(true)
    if (draftId) {
      const { error } = await supabase.from('invoices').update(buildPayload('draft')).eq('id', draftId)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success(fr ? 'Brouillon sauvegardé' : 'Draft saved')
      router.push(`/invoices/${draftId}`)
    } else {
      const { data, error } = await supabase.from('invoices').insert(buildPayload('draft')).select('id').single()
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success(fr ? 'Brouillon sauvegardé' : 'Draft saved')
      router.push(`/invoices/${data.id}`)
    }
  }

  const saveAndSend = async () => {
    if (!user || !customerId) {
      toast.error(fr ? 'Veuillez sélectionner un client' : 'Please select a customer')
      return
    }
    setSending(true)
    const payload = buildPayload('sent')
    let invoiceId: string
    if (draftId) {
      const { error } = await supabase.from('invoices').update(payload).eq('id', draftId)
      if (error) { toast.error(error.message); setSending(false); return }
      invoiceId = draftId
    } else {
      const { data, error } = await supabase.from('invoices').insert(payload).select('id, token').single()
      if (error) { toast.error(error.message); setSending(false); return }
      invoiceId = data.id
    }

    // Send email
    const cust = customers.find((c) => c.id === customerId)
    if (cust?.email) {
      const { data: inv } = await supabase.from('invoices').select('token').eq('id', invoiceId).single()
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invoice',
          to: cust.email,
          customerName: cust.name,
          invoiceNumber,
          amount: fmt(total),
          dueDate: dueDate ? fmtDate(dueDate, lang) : undefined,
          paymentLink: inv?.token ? `${window.location.origin}/invoice/${inv.token}` : undefined,
          businessName: orgName || undefined,
        }),
      })
    }
    toast.success(fr ? 'Facture envoyée' : 'Invoice sent')
    router.push(`/invoices/${invoiceId}`)
  }

  /* ---- AI creation ---- */
  const handleAiCreate = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/invoices/ai-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiPrompt }),
      })
      const data = await res.json()
      if (data.invoice) {
        const inv = data.invoice
        if (inv.customer_id) setCustomerId(inv.customer_id)
        else if (inv.customer_name) {
          const match = customers.find((c) => c.name.toLowerCase().includes(inv.customer_name.toLowerCase()))
          if (match) setCustomerId(match.id)
        }
        if (inv.apply_tps !== undefined) setApplyTps(inv.apply_tps)
        if (inv.apply_tvq !== undefined) setApplyTvq(inv.apply_tvq)
        if (inv.line_items?.length) {
          setLines(inv.line_items.map((li: { description: string; quantity?: number; unit?: string; unit_price: number; product_id?: string }, i: number) => ({
            id: uid(),
            description: li.description,
            qty: li.quantity || 1,
            unit: li.unit || 'unit',
            unit_price: li.unit_price,
            position: i,
            product_id: li.product_id || null,
          })))
        }
        if (inv.notes) setClientNotes(inv.notes)
        toast.success(fr ? 'Facture pré-remplie par l\'IA' : 'Invoice pre-filled by AI')
        setAiOpen(false)
        setAiPrompt('')
      } else {
        toast.error(data.error || (fr ? 'Erreur IA' : 'AI error'))
      }
    } catch {
      toast.error(fr ? 'Erreur réseau' : 'Network error')
    }
    setAiLoading(false)
  }

  /* ---- Product matches for a line ---- */
  const getProductMatches = (lineId: string) => {
    const q = (productSearch[lineId] || '').toLowerCase().trim()
    if (!q) return []
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))).slice(0, 6)
  }

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <AppLayout title={fr ? 'Nouvelle facture' : 'New invoice'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-32">

        {/* Breadcrumb + AI button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/invoices" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> {fr ? 'Factures' : 'Invoices'}
            </Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{fr ? 'Nouvelle facture' : 'New invoice'}</span>
          </div>
          <div className="flex items-center gap-2">
            {savedAt && (
              <span className="text-xs text-gray-400 hidden sm:inline">
                {fr ? 'Sauvegardé' : 'Saved'} {fmtDate(savedAt, lang, 'short')}
              </span>
            )}
            <button
              onClick={() => setAiOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-violet-700 hover:to-indigo-700 transition-all"
            >
              <Sparkles className="h-4 w-4" /> {fr ? 'Créer avec l\'IA' : 'Create with AI'}
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ========== LEFT: EDITOR (60%) ========== */}
          <div className="flex-1 lg:max-w-[60%] space-y-6">

            {/* A. Client Selector */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" /> {fr ? 'Client' : 'Customer'}
              </h2>
              <div ref={customerRef} className="relative">
                {customerId && selectedCustomer ? (
                  <div className="flex items-center justify-between rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                        {selectedCustomer.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{selectedCustomer.email || selectedCustomer.phone || ''}</p>
                      </div>
                    </div>
                    <button onClick={() => { setCustomerId(''); setCustomerSearch('') }} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={fr ? 'Rechercher un client...' : 'Search for a customer...'}
                        value={customerSearch}
                        onChange={(e) => { setCustomerSearch(e.target.value); setCustomerDropdownOpen(true) }}
                        onFocus={() => setCustomerDropdownOpen(true)}
                        className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                    {customerDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg max-h-60 overflow-auto">
                        {filteredCustomers.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">{fr ? 'Aucun client trouvé' : 'No customer found'}</p>
                        ) : (
                          filteredCustomers.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => { setCustomerId(c.id); setCustomerDropdownOpen(false); setCustomerSearch('') }}
                              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-xs">
                                {c.name[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                                {c.email && <p className="text-xs text-gray-400 dark:text-gray-500">{c.email}</p>}
                              </div>
                            </button>
                          ))
                        )}
                        <Link
                          href="/customers?new=1"
                          className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border-t border-gray-100 dark:border-gray-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" /> {fr ? 'Nouveau client' : 'New customer'}
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* B. Invoice Details (collapsible) */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <button
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-400" /> {fr ? 'Détails de la facture' : 'Invoice details'}
                  <span className="text-xs font-normal text-gray-400 dark:text-gray-500">{invoiceNumber}</span>
                </span>
                {detailsOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {detailsOpen && (
                <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{fr ? 'Numéro de facture' : 'Invoice number'}</label>
                      <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> {fr ? "Date d'émission" : 'Issue date'}
                      </label>
                      <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{fr ? 'Conditions de paiement' : 'Payment terms'}</label>
                      <select
                        value={dueDateOption}
                        onChange={(e) => handleDueDateOption(parseInt(e.target.value))}
                        className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {DUE_DATE_OPTIONS.map((opt) => <option key={opt.days} value={opt.days}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{fr ? "Date d'échéance" : 'Due date'}</label>
                      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{fr ? 'N° de bon de commande (optionnel)' : 'PO number (optional)'}</label>
                      <input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder={fr ? 'PO-1234' : 'PO-1234'} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{fr ? 'Intervention liée' : 'Linked job'}</label>
                      <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                        <option value="">{fr ? 'Aucune' : 'None'}</option>
                        {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* C. Line Items */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" /> {fr ? 'Lignes de facturation' : 'Line items'}
                </h2>
              </div>

              {/* Column headers */}
              <div className="hidden sm:grid grid-cols-[1fr_80px_120px_100px_40px] gap-3 px-6 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                <span>Description</span>
                <span className="text-center">{fr ? 'Qté' : 'Qty'}</span>
                <span className="text-right">{fr ? 'Prix unit.' : 'Unit price'}</span>
                <span className="text-right">Total</span>
                <span />
              </div>

              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {lines.map((line, idx) => {
                  const matches = getProductMatches(line.id)
                  return (
                    <div key={line.id} className="px-6 py-3">
                      <div className="grid sm:grid-cols-[1fr_80px_120px_100px_40px] gap-3 items-center">
                        {/* Description with product search */}
                        <div className="relative">
                          <input
                            placeholder={fr ? `Description de l'item ${idx + 1}` : `Item ${idx + 1} description`}
                            value={productSearch[line.id] !== undefined ? productSearch[line.id] : line.description}
                            onChange={(e) => {
                              const val = e.target.value
                              setProductSearch((prev) => ({ ...prev, [line.id]: val }))
                              updateLine(line.id, 'description', val)
                              setProductDropdown(line.id)
                              setProductHighlight(-1)
                            }}
                            onFocus={() => {
                              if (productSearch[line.id] || line.description) setProductDropdown(line.id)
                            }}
                            onBlur={() => setTimeout(() => setProductDropdown(null), 200)}
                            onKeyDown={(e) => {
                              if (productDropdown !== line.id) return
                              const m = getProductMatches(line.id)
                              if (e.key === 'ArrowDown') { e.preventDefault(); setProductHighlight((h) => Math.min(h + 1, m.length - 1)) }
                              else if (e.key === 'ArrowUp') { e.preventDefault(); setProductHighlight((h) => Math.max(h - 1, 0)) }
                              else if (e.key === 'Enter' && productHighlight >= 0 && m[productHighlight]) { e.preventDefault(); selectProduct(line.id, m[productHighlight]) }
                              else if (e.key === 'Enter' && idx === lines.length - 1) { e.preventDefault(); addLine() }
                            }}
                            className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-base sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                          />
                          {productDropdown === line.id && matches.length > 0 && (
                            <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-auto">
                              {matches.map((p, pi) => (
                                <button
                                  key={p.id}
                                  onMouseDown={(e) => { e.preventDefault(); selectProduct(line.id, p) }}
                                  className={`flex items-center justify-between w-full px-3 py-2 text-left text-sm transition-colors ${pi === productHighlight ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}`}
                                >
                                  <span className="truncate">{p.name}</span>
                                  <span className="text-xs text-gray-400 ml-2 shrink-0">{fmt(p.unit_price)}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Qty */}
                        <input
                          type="number" min="0" step="0.5" value={line.qty}
                          onChange={(e) => updateLine(line.id, 'qty', parseFloat(e.target.value) || 0)}
                          className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-center text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                        />

                        {/* Unit price */}
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input
                            type="number" min="0" step="0.01" value={line.unit_price || ''}
                            onChange={(e) => updateLine(line.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-6 pr-3 py-2 text-sm text-right text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                          />
                        </div>

                        {/* Line total */}
                        <p className="text-sm font-semibold text-gray-900 dark:text-white text-right">{fmt(line.qty * line.unit_price)}</p>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length === 1}
                          className="flex items-center justify-center text-gray-300 hover:text-red-400 disabled:opacity-20 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={addLine} className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                  <Plus className="h-4 w-4" /> {fr ? 'Ajouter une ligne' : 'Add a line'}
                </button>
              </div>
            </div>

            {/* D. Subtotal / Taxes / Discount */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
              <div className="grid sm:grid-cols-2 gap-8">
                {/* Settings */}
                <div className="space-y-4">
                  {/* Discount toggle */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{fr ? 'Remise' : 'Discount'}</label>
                    <button type="button" onClick={() => setDiscountEnabled(!discountEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${discountEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${discountEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  {discountEnabled && (
                    <div className="flex gap-3">
                      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <button onClick={() => setDiscountType('percent')} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${discountType === 'percent' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>%</button>
                        <button onClick={() => setDiscountType('fixed')} className={`px-3 py-1.5 text-xs font-semibold transition-colors ${discountType === 'fixed' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>$</button>
                      </div>
                      <input type="number" min="0" step="0.01" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder="0" className="w-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
                    </div>
                  )}

                  {/* TPS */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">TPS (5%)</label>
                    <button type="button" onClick={() => setApplyTps(!applyTps)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${applyTps ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${applyTps ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  {/* TVQ */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">TVQ (9,975%)</label>
                    <button type="button" onClick={() => setApplyTvq(!applyTvq)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${applyTvq ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${applyTvq ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex flex-col justify-end space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{fr ? 'Sous-total' : 'Subtotal'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{fmt(subtotal)}</span>
                  </div>
                  {discAmt > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{fr ? 'Remise' : 'Discount'}</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">-{fmt(discAmt)}</span>
                    </div>
                  )}
                  {applyTps && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">TPS (5%)</span>
                      <span className="font-medium text-gray-900 dark:text-white">{fmt(tpsAmt)}</span>
                    </div>
                  )}
                  {applyTvq && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">TVQ (9,975%)</span>
                      <span className="font-medium text-gray-900 dark:text-white">{fmt(tvqAmt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
                    <span className="text-base font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white">{fmt(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* E. Notes */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{fr ? 'Notes' : 'Notes'}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{fr ? 'Note au client' : 'Client note'}</label>
                  <textarea rows={3} value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} placeholder={fr ? 'Merci pour votre confiance...' : 'Thank you for your business...'} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{fr ? 'Note interne' : 'Internal note'}</label>
                  <textarea rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder={fr ? 'Notes internes...' : 'Internal notes...'} className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 resize-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ========== RIGHT: LIVE PREVIEW (40%) ========== */}
          <div className={`lg:w-[40%] ${showPreview ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-6">
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{fr ? 'Aperçu' : 'Preview'}</h3>
                  <button onClick={() => setShowPreview(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  {/* Preview header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{orgName || (fr ? 'Votre entreprise' : 'Your business')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{invoiceNumber}</p>
                      <p className="text-gray-400 dark:text-gray-500">{fmtDate(issueDate, lang, 'short')}</p>
                    </div>
                  </div>

                  {/* Client */}
                  {selectedCustomer && (
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                      <p className="text-gray-400 dark:text-gray-500 mb-1">{fr ? 'Facturer à' : 'Bill to'}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                      {selectedCustomer.email && <p className="text-gray-500 dark:text-gray-400">{selectedCustomer.email}</p>}
                      {selectedCustomer.address && <p className="text-gray-500 dark:text-gray-400">{selectedCustomer.address}</p>}
                    </div>
                  )}

                  {/* Line items table */}
                  {lines.some((l) => l.description.trim()) && (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-700">
                          <th className="pb-1.5 text-left text-gray-400 dark:text-gray-500 font-medium">Description</th>
                          <th className="pb-1.5 text-center text-gray-400 dark:text-gray-500 font-medium">{fr ? 'Qté' : 'Qty'}</th>
                          <th className="pb-1.5 text-right text-gray-400 dark:text-gray-500 font-medium">{fr ? 'Prix' : 'Price'}</th>
                          <th className="pb-1.5 text-right text-gray-400 dark:text-gray-500 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {lines.filter((l) => l.description.trim()).map((l) => (
                          <tr key={l.id}>
                            <td className="py-1.5 text-gray-700 dark:text-gray-300">{l.description}</td>
                            <td className="py-1.5 text-center text-gray-500 dark:text-gray-400">{l.qty}</td>
                            <td className="py-1.5 text-right text-gray-500 dark:text-gray-400">{fmt(l.unit_price)}</td>
                            <td className="py-1.5 text-right font-medium text-gray-900 dark:text-white">{fmt(l.qty * l.unit_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Totals */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-1">
                    <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">{fr ? 'Sous-total' : 'Subtotal'}</span><span className="text-gray-700 dark:text-gray-300">{fmt(subtotal)}</span></div>
                    {discAmt > 0 && <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">{fr ? 'Remise' : 'Discount'}</span><span className="text-emerald-600 dark:text-emerald-400">-{fmt(discAmt)}</span></div>}
                    {applyTps && <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">TPS 5%</span><span className="text-gray-700 dark:text-gray-300">{fmt(tpsAmt)}</span></div>}
                    {applyTvq && <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500">TVQ 9,975%</span><span className="text-gray-700 dark:text-gray-300">{fmt(tvqAmt)}</span></div>}
                    <div className="flex justify-between font-bold text-gray-900 dark:text-white text-sm border-t border-gray-200 dark:border-gray-700 pt-2 mt-1">
                      <span>Total</span><span>{fmt(total)}</span>
                    </div>
                  </div>

                  {/* Due date */}
                  {dueDate && (
                    <p className="text-gray-400 dark:text-gray-500 text-center mt-2">
                      {fr ? `Échéance : ${fmtDate(dueDate, lang, 'short')}` : `Due: ${fmtDate(dueDate, lang, 'short')}`}
                    </p>
                  )}

                  {/* Notes */}
                  {clientNotes && (
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 mt-2">
                      <p className="text-gray-400 dark:text-gray-500 mb-1">Note</p>
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{clientNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* F. Fixed bottom action bar */}
        <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 sm:px-6 shadow-xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowPreview(!showPreview)} className="lg:hidden inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? (fr ? 'Masquer' : 'Hide') : (fr ? 'Aperçu' : 'Preview')}
              </button>
              <div className="hidden sm:block text-right">
                <p className="text-xs text-gray-400 dark:text-gray-500">Total</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{fmt(total)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={saveDraft} disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 transition-all shadow-sm">
                <Save className="h-4 w-4" />
                {saving ? (fr ? 'Enregistrement...' : 'Saving...') : (fr ? 'Sauvegarder brouillon' : 'Save draft')}
              </button>
              <button onClick={saveAndSend} disabled={sending} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-sm">
                <Send className="h-4 w-4" />
                {sending ? (fr ? 'Envoi...' : 'Sending...') : (fr ? 'Envoyer la facture' : 'Send invoice')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* G. AI Creation Modal */}
      {aiOpen && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => !aiLoading && setAiOpen(false)} />
          <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{fr ? 'Créer avec l\'IA' : 'Create with AI'}</h3>
              </div>
              <button onClick={() => !aiLoading && setAiOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {fr ? 'Décrivez votre facture en langage naturel...' : 'Describe your invoice in natural language...'}
              </label>
              <textarea
                rows={5}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={fr ? 'Ex: Facture pour Jean Tremblay, 3 heures de plomberie à 85$/h plus 2 raccords en cuivre à 12$' : 'E.g.: Invoice for John Smith, 3 hours of plumbing at $85/hr plus 2 copper fittings at $12 each'}
                className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-base sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                disabled={aiLoading}
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60 px-6 py-3">
              <button onClick={() => setAiOpen(false)} disabled={aiLoading} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60">
                {fr ? 'Annuler' : 'Cancel'}
              </button>
              <button onClick={handleAiCreate} disabled={aiLoading || !aiPrompt.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {aiLoading ? (fr ? 'Génération...' : 'Generating...') : (fr ? 'Générer' : 'Generate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
