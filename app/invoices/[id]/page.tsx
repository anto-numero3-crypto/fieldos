'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../supabase'
import AppLayout from '@/components/AppLayout'
import { SkeletonText, SkeletonCard } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtMoney, fmtDate } from '@/lib/format'
import { writeAuditLog } from '@/lib/audit'
import { toast } from 'sonner'
import {
  ArrowLeft, FileText, User, Briefcase, Calendar, DollarSign,
  CheckCircle, Clock, AlertCircle, Edit2, Save, X, Printer,
  Send, Trash2, ExternalLink, Copy, Link2
} from 'lucide-react'
import Link from 'next/link'

interface LineItem { description: string; qty: number; unit?: string; unit_price: number; taxable?: boolean }

interface Invoice {
  id: string
  user_id: string
  token?: string
  invoice_number?: string
  amount: number
  subtotal?: number
  status: string
  due_date: string | null
  created_at: string
  paid_at?: string | null
  tax_rate?: number
  tax_amount?: number
  tax_name?: string
  tax2_rate?: number
  tax2_amount?: number
  tax2_name?: string
  discount?: number
  line_items?: LineItem[] | null
  customer_id: string
  job_id?: string | null
  customers: { id: string; name: string; email?: string; phone?: string } | null
  jobs: { id: string; title: string } | null
}

const STATUS_CFG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  unpaid:  { label: 'Non payé',  className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',   icon: Clock },
  sent:    { label: 'Envoyée',   className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',       icon: Send },
  paid:    { label: 'Payé',      className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: CheckCircle },
  overdue: { label: 'En retard', className: 'bg-red-50 text-red-700 ring-1 ring-red-200',         icon: AlertCircle },
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router       = useRouter()
  const confirm      = useConfirm()
  const searchParams = useSearchParams()
  const { lang, t }  = useLanguage()
  const fr = lang === 'fr'
  const tStatus      = (k: string) => (t.status as Record<string, string>)[k] || k

  const [invoice, setInvoice]       = useState<Invoice | null>(null)
  const [businessName, setBusinessName] = useState<string>('')
  const [loading, setLoading]       = useState(true)
  const [editing, setEditing]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [sending, setSending]       = useState(false)

  // Edit form state
  const [editStatus, setEditStatus]   = useState('unpaid')
  const [editDueDate, setEditDueDate] = useState('')
  const [editTaxRate, setEditTaxRate] = useState('0')
  const [lineItems, setLineItems]     = useState<LineItem[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { window.location.href = '/login'; return }
      // Handle Stripe return: mark paid if ?paid=true
      if (searchParams.get('paid') === 'true') {
        await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
        router.replace(`/invoices/${id}`)
      }
      fetchInvoice()
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchInvoice = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/invoices/${id}`, { cache: 'no-store' })
      const json = await res.json()
      const data = json.invoice
      if (data) {
        if (!data.token) {
          const newToken = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/-/g, '')
          const { error: tokenErr } = await supabase.from('invoices').update({ token: newToken }).eq('id', data.id)
          if (!tokenErr) data.token = newToken
        }
        setInvoice(data)
        setEditStatus(data.status)
        setEditDueDate(data.due_date || '')
        setEditTaxRate(String(data.tax_rate || 0))
        setLineItems(data.line_items || [])
        if (data.user_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('owner_user_id', data.user_id)
            .single()
          if (org?.name) setBusinessName(org.name)
        }
      }
    } catch (e) {
      console.error('[invoice detail] fetch failed:', e)
    }
    setLoading(false)
  }

  const saveEdits = async () => {
    if (!invoice) return
    setSaving(true)
    const subtotal = lineItems.reduce((s, li) => s + li.qty * li.unit_price, 0)
    const tax = subtotal * (parseFloat(editTaxRate) / 100)
    const total = lineItems.length > 0 ? subtotal + tax : invoice.amount

    const { error } = await supabase
      .from('invoices')
      .update({
        status: editStatus,
        due_date: editDueDate || null,
        tax_rate: parseFloat(editTaxRate),
        line_items: lineItems.length > 0 ? lineItems : null,
        amount: total,
        ...(editStatus === 'paid' && invoice.status !== 'paid' ? { paid_at: new Date().toISOString() } : {}),
      })
      .eq('id', id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t.success.updated)
      setEditing(false)
      fetchInvoice()
    }
    setSaving(false)
  }

  const deleteInvoice = async () => {
    const { confirmed } = await confirm({
      title: fr ? 'Supprimer cette facture ?' : 'Delete this invoice?',
      description: fr
        ? 'Cette action est irréversible. Le lien de paiement partagé ne fonctionnera plus.'
        : 'This cannot be undone. The shared payment link will no longer work.',
      confirmLabel: fr ? 'Supprimer' : 'Delete',
    })
    if (!confirmed) return
    const { data: auth } = await supabase.auth.getUser()
    if (auth.user) writeAuditLog({ userId: auth.user.id, action: 'delete', resourceType: 'invoice', resourceId: id })
    await supabase.from('invoices').delete().eq('id', id)
    router.push('/invoices')
  }

  const markPaid = async () => {
    await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
    fetchInvoice()
  }

  const fmtCAD = (n: number) => fmtMoney(n, lang)

  const sendInvoiceEmail = async (type: 'invoice' | 'payment_reminder') => {
    if (!invoice?.customers?.email) return
    setSending(true)
    try {
      const items = invoice.line_items || []
      const subtotal = invoice.subtotal ?? items.reduce((s, li) => s + li.qty * li.unit_price, 0)
      const taxAmt = invoice.tax_amount ?? subtotal * ((invoice.tax_rate || 0) / 100)
      const tax2Amt = invoice.tax2_amount ?? subtotal * ((invoice.tax2_rate || 0) / 100)

      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          to: invoice.customers.email,
          customerName: invoice.customers.name,
          invoiceNumber: invoice.invoice_number,
          amount: fmtCAD(invoice.amount),
          subtotal: items.length > 0 ? fmtCAD(subtotal) : undefined,
          taxName: invoice.tax_name || 'TPS',
          taxAmount: taxAmt > 0 ? fmtCAD(taxAmt) : undefined,
          tax2Name: invoice.tax2_name || 'TVQ',
          tax2Amount: tax2Amt > 0 ? fmtCAD(tax2Amt) : undefined,
          discount: invoice.discount && invoice.discount > 0 ? fmtCAD(invoice.discount) : undefined,
          dueDate: invoice.due_date ? fmtDate(invoice.due_date, lang) : undefined,
          paymentLink: invoice.token ? `${window.location.origin}/invoice/${invoice.token}` : undefined,
          lineItems: items.length > 0 ? items : undefined,
          businessName: businessName || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(t.success.sent)
        // Mark invoice as sent if it was unpaid
        if (type === 'invoice' && invoice.status === 'unpaid') {
          await supabase.from('invoices').update({ status: 'sent' }).eq('id', id)
          fetchInvoice()
        }
      } else {
        toast.error(data.error || t.errors.unknown)
      }
    } catch {
      toast.error(t.errors.unknown)
    }
    setSending(false)
  }

  const addLineItem = () => setLineItems([...lineItems, { description: '', qty: 1, unit_price: 0, taxable: true }])
  const updateLineItem = (i: number, field: keyof LineItem, value: string | number | boolean) => {
    const updated = [...lineItems]
    const strFields: (keyof LineItem)[] = ['description', 'unit']
    updated[i] = { ...updated[i], [field]: strFields.includes(field) ? value : typeof value === 'boolean' ? value : parseFloat(String(value)) || 0 }
    setLineItems(updated)
  }
  const removeLineItem = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i))

  const fmt = (n: number) => fmtMoney(n, lang)

  if (loading) return (
    <AppLayout title="Facture">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
        <SkeletonText className="h-6 w-48" />
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2"><SkeletonCard className="h-48" /></div>
          <SkeletonCard className="h-48" />
        </div>
      </div>
    </AppLayout>
  )

  if (!invoice) return (
    <AppLayout title="Facture">
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <FileText className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">Facture introuvable.</p>
        <Link href="/invoices" className="mt-4 text-sm text-indigo-600 hover:underline">Retour aux factures</Link>
      </div>
    </AppLayout>
  )

  const cfg = STATUS_CFG[invoice.status]
  const StatusIcon = cfg?.icon || Clock

  const lineItemSubtotal = lineItems.reduce((s, li) => s + li.qty * li.unit_price, 0)
  const taxAmount = lineItemSubtotal * (parseFloat(editTaxRate) / 100)
  const lineItemTotal = lineItemSubtotal + taxAmount

  const displayItems: LineItem[] = invoice.line_items || []
  const displaySubtotal = displayItems.reduce((s, li) => s + li.qty * li.unit_price, 0)
  const displayTax = displaySubtotal * ((invoice.tax_rate || 0) / 100)

  return (
    <AppLayout title={invoice.invoice_number || (fr ? 'Facture' : 'Invoice')}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/invoices" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Factures
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900">{invoice.invoice_number || invoice.id.slice(0, 8)}</span>
        </div>


        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main invoice panel */}
          <div className="lg:col-span-2 space-y-6">

            {/* Invoice header card */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 shrink-0">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-gray-900 truncate">{invoice.invoice_number || `INV-${invoice.id.slice(0,8).toUpperCase()}`}</p>
                    <p className="text-xs text-gray-400">{fmtDate(invoice.created_at, lang)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!editing && invoice.status !== 'paid' && (
                    <button
                      onClick={markPaid}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      <CheckCircle className="h-4 w-4" /> {fr ? 'Marquer payée' : 'Mark as paid'}
                    </button>
                  )}
                  {!editing ? (
                    <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                      <Edit2 className="h-4 w-4" /> {fr ? 'Modifier' : 'Edit'}
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                        <X className="h-4 w-4" /> {fr ? 'Annuler' : 'Cancel'}
                      </button>
                      <button onClick={saveEdits} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-sm">
                        <Save className="h-4 w-4" /> {saving ? (fr ? 'Enregistrement…' : 'Saving…') : (fr ? 'Enregistrer' : 'Save')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Status + Due Date row */}
              {editing ? (
                <div className="px-6 py-4 grid grid-cols-2 gap-4 bg-gray-50 border-b border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                      <option value="unpaid">{tStatus('unpaid')}</option>
                      <option value="paid">{tStatus('paid')}</option>
                      <option value="overdue">{tStatus('overdue')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date d'échéance</label>
                    <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>
              ) : (
                <div className="px-6 py-4 flex items-center gap-6 bg-gray-50 border-b border-gray-100">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg?.className}`}>
                    <StatusIcon className="h-3.5 w-3.5" /> {tStatus(invoice.status)}
                  </span>
                  {invoice.due_date && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 text-gray-300" />
                      {fmtDate(invoice.due_date, lang)}
                    </span>
                  )}
                  {invoice.paid_at && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      {fmtDate(invoice.paid_at, lang)}
                    </span>
                  )}
                </div>
              )}

              {/* Line items */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900">Lignes de la facture</p>
                  {editing && (
                    <button onClick={addLineItem} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">+ Ajouter une ligne</button>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-2">
                    {lineItems.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">Aucune ligne. Ajoutez-en une ou enregistrez simplement le montant de la facture.</p>
                    )}
                    {lineItems.map((li, i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:items-center rounded-xl bg-gray-50 sm:bg-transparent p-2 sm:p-0">
                        <input
                          value={li.description}
                          onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                          placeholder="Description"
                          className="sm:col-span-6 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-base sm:text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                        />
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:contents">
                          <input
                            type="number" inputMode="numeric" min="1" value={li.qty}
                            onChange={(e) => updateLineItem(i, 'qty', e.target.value)}
                            className="sm:col-span-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-base sm:text-sm text-gray-900 focus:border-indigo-500 focus:outline-none text-center"
                            placeholder="Qté"
                          />
                          <input
                            type="number" inputMode="decimal" min="0" step="0.01" value={li.unit_price}
                            onChange={(e) => updateLineItem(i, 'unit_price', e.target.value)}
                            className="sm:col-span-3 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-base sm:text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                            placeholder="Prix"
                          />
                          <button onClick={() => removeLineItem(i)} aria-label="Retirer" className="sm:col-span-1 flex items-center justify-center rounded-lg px-2 text-gray-400 hover:text-red-500 transition-colors">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <label className="text-xs text-gray-500">Taux de taxe :</label>
                      <input type="number" min="0" max="100" step="0.1" value={editTaxRate}
                        onChange={(e) => setEditTaxRate(e.target.value)}
                        className="w-20 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none" />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  </div>
                ) : displayItems.length > 0 ? (
                  <div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="pb-2 text-left text-xs font-medium text-gray-400">Description</th>
                          <th className="pb-2 text-center text-xs font-medium text-gray-400">Qté</th>
                          <th className="pb-2 text-right text-xs font-medium text-gray-400">Prix unitaire</th>
                          <th className="pb-2 text-right text-xs font-medium text-gray-400">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {displayItems.map((li, i) => (
                          <tr key={i}>
                            <td className="py-2 text-gray-900">{li.description}</td>
                            <td className="py-2 text-center text-gray-500">{li.qty}</td>
                            <td className="py-2 text-right text-gray-500">{fmt(li.unit_price)}</td>
                            <td className="py-2 text-right font-medium text-gray-900">{fmt(li.qty * li.unit_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-sm">
                      <div className="flex justify-between text-gray-500"><span>Sous-total</span><span>{fmt(displaySubtotal)}</span></div>
                      {(invoice.tax_rate || 0) > 0 && (
                        <div className="flex justify-between text-gray-500"><span>Tax ({invoice.tax_rate}%)</span><span>{fmt(displayTax)}</span></div>
                      )}
                      <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
                        <span>Total</span><span>{fmt(invoice.amount)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center py-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Montant de la facture</span>
                    <span className="text-2xl font-bold text-gray-900">{fmt(invoice.amount)}</span>
                  </div>
                )}

                {editing && lineItems.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-500"><span>Sous-total</span><span>{fmt(lineItemSubtotal)}</span></div>
                    {parseFloat(editTaxRate) > 0 && (
                      <div className="flex justify-between text-gray-500"><span>Tax ({editTaxRate}%)</span><span>{fmt(taxAmount)}</span></div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
                      <span>Total</span><span>{fmt(lineItemTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Amount card */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Montant total</p>
              <p className="text-4xl font-bold text-gray-900">{fmt(invoice.amount)}</p>
              {invoice.status === 'paid' && invoice.paid_at && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> {fmtDate(invoice.paid_at, lang)}</p>
              )}
            </div>

            {/* Customer card */}
            {invoice.customers && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Client</p>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-sm">
                    {invoice.customers.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{invoice.customers.name}</p>
                    {invoice.customers.email && <p className="text-xs text-gray-400 truncate">{invoice.customers.email}</p>}
                    {invoice.customers.phone && <p className="text-xs text-gray-400">{invoice.customers.phone}</p>}
                  </div>
                </div>
                <Link href={`/customers/${invoice.customers.id}`} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  {fr ? 'Voir le profil' : 'View profile'} <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}

            {/* Job card */}
            {invoice.jobs && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Intervention liée</p>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-400 shrink-0" />
                  <p className="text-sm font-medium text-gray-900 truncate">{invoice.jobs.title}</p>
                </div>
                <Link href={`/jobs/${invoice.jobs.id}`} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  {fr ? "Voir l'intervention" : 'View job'} <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}

            {/* Actions */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{fr ? 'Actions' : 'Actions'}</p>

              {/* Public invoice link */}
              {invoice.token && (
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/invoice/${invoice.token}`
                    navigator.clipboard.writeText(url)
                    toast.success(t.success.copied)
                  }}
                  className="w-full flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <Link2 className="h-4 w-4" /> {fr ? 'Copier le lien client' : 'Copy client link'}
                </button>
              )}
              {invoice.token && (
                <a
                  href={`/invoice/${invoice.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-gray-400" /> {fr ? 'Voir la facture client' : 'View client invoice'}
                </a>
              )}

              <button
                onClick={() => window.print()}
                className="w-full flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-4 w-4 text-gray-400" /> {fr ? 'Imprimer / Télécharger PDF' : 'Print / Download PDF'}
              </button>
              {invoice.customers?.email && (
                <>
                  <button
                    onClick={() => sendInvoiceEmail('invoice')}
                    disabled={sending}
                    className="w-full flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
                  >
                    {sending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" /> : <Send className="h-4 w-4 text-gray-400" />}
                    {fr ? 'Envoyer la facture par courriel' : 'Send invoice by email'}
                  </button>
                  {invoice.status === 'overdue' && (
                    <button
                      onClick={() => sendInvoiceEmail('payment_reminder')}
                      disabled={sending}
                      className="w-full flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
                    >
                      <Send className="h-4 w-4" /> {fr ? 'Envoyer un rappel de paiement' : 'Send payment reminder'}
                    </button>
                  )}
                </>
              )}
              <button
                onClick={deleteInvoice}
                className="w-full flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" /> {fr ? 'Supprimer la facture' : 'Delete invoice'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
