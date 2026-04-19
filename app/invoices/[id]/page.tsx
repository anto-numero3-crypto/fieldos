'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../supabase'
import AppLayout from '@/components/AppLayout'
import { SkeletonText, SkeletonCard } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtMoney, fmtDate } from '@/lib/format'
import { getInvoiceDisplayStatus, invoiceStatusLabel, INVOICE_STATUS_CLS } from '@/lib/invoice-status'
import { writeAuditLog } from '@/lib/audit'
import { toast } from 'sonner'
import {
  ArrowLeft, FileText, User, Calendar, DollarSign,
  CheckCircle, Clock, AlertCircle, Edit2, Save, X, Printer,
  Send, Trash2, ExternalLink, Link2, Copy, Eye, RefreshCw,
  CreditCard, Banknote, Building2,
} from 'lucide-react'
import Link from 'next/link'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
  client_notes?: string | null
  internal_notes?: string | null
  viewed_count?: number
  viewed_at?: string | null
  customers: { id: string; name: string; email?: string; phone?: string; address?: string } | null
  jobs: { id: string; title: string } | null
}

interface ActivityEvent {
  id: string
  event_type: string
  event_data: Record<string, unknown>
  created_at: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const confirm = useConfirm()
  const searchParams = useSearchParams()
  const { lang, t } = useLanguage()
  const fr = lang === 'fr'

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [activity, setActivity] = useState<ActivityEvent[]>([])

  /* ---- Payment modal ---- */
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<'card' | 'transfer' | 'cash' | 'cheque' | 'stripe'>('card')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [payReference, setPayReference] = useState('')
  const [paySaving, setPaySaving] = useState(false)

  /* ---- Fetch ---- */
  const fetchInvoice = useCallback(async () => {
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
        if (data.user_id) {
          const { data: org } = await supabase.from('organizations').select('name').eq('owner_user_id', data.user_id).single()
          if (org?.name) setBusinessName(org.name)
        }
      }
    } catch (e) {
      console.error('[invoice detail] fetch failed:', e)
    }
    setLoading(false)
  }, [id])

  const fetchActivity = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('invoice_activity')
        .select('id, event_type, event_data, created_at')
        .eq('invoice_id', id)
        .order('created_at', { ascending: false })
        .limit(50)
      setActivity(data || [])
    } catch { /* non-blocking */ }
  }, [id])

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { window.location.href = '/login'; return }
      if (searchParams.get('paid') === 'true') {
        await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
        router.replace(`/invoices/${id}`)
      }
      await Promise.all([fetchInvoice(), fetchActivity()])
    }
    init()
  }, [id, fetchInvoice, fetchActivity, searchParams, router])

  /* ---- Actions ---- */
  const sendInvoiceEmail = async (type: 'invoice' | 'payment_reminder') => {
    if (!invoice?.customers?.email) return
    setSending(true)
    try {
      const items = invoice.line_items || []
      const sub = invoice.subtotal ?? items.reduce((s, li) => s + li.qty * li.unit_price, 0)
      const taxAmt = invoice.tax_amount ?? sub * ((invoice.tax_rate || 0) / 100)
      const tax2Amt = invoice.tax2_amount ?? sub * ((invoice.tax2_rate || 0) / 100)

      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          to: invoice.customers.email,
          customerName: invoice.customers.name,
          invoiceNumber: invoice.invoice_number,
          amount: fmtMoney(invoice.amount, lang),
          subtotal: items.length > 0 ? fmtMoney(sub, lang) : undefined,
          taxName: invoice.tax_name || 'TPS',
          taxAmount: taxAmt > 0 ? fmtMoney(taxAmt, lang) : undefined,
          tax2Name: invoice.tax2_name || 'TVQ',
          tax2Amount: tax2Amt > 0 ? fmtMoney(tax2Amt, lang) : undefined,
          discount: invoice.discount && invoice.discount > 0 ? fmtMoney(invoice.discount, lang) : undefined,
          dueDate: invoice.due_date ? fmtDate(invoice.due_date, lang) : undefined,
          paymentLink: invoice.token ? `${window.location.origin}/invoice/${invoice.token}` : undefined,
          lineItems: items.length > 0 ? items : undefined,
          businessName: businessName || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(t.success.sent)
        if (type === 'invoice' && (invoice.status === 'unpaid' || invoice.status === 'draft')) {
          await supabase.from('invoices').update({ status: 'sent' }).eq('id', id)
          fetchInvoice()
        }
      } else { toast.error(data.error || t.errors.unknown) }
    } catch { toast.error(t.errors.unknown) }
    setSending(false)
  }

  const openPayModal = () => {
    setPayAmount(String(invoice?.amount ?? ''))
    setPayMethod('card')
    setPayDate(new Date().toISOString().slice(0, 10))
    setPayReference('')
    setPayModalOpen(true)
  }

  const submitManualPayment = async () => {
    if (!invoice) return
    const amount = parseFloat(payAmount)
    if (!Number.isFinite(amount) || amount <= 0) { toast.error(fr ? 'Montant invalide' : 'Invalid amount'); return }
    setPaySaving(true)
    try {
      const paidAtIso = new Date(payDate + 'T12:00:00').toISOString()
      const { error: invErr } = await supabase
        .from('invoices')
        .update({ status: 'paid', paid_at: paidAtIso, payment_method: payMethod })
        .eq('id', invoice.id)
      if (invErr) { toast.error(invErr.message); return }

      const { data: auth } = await supabase.auth.getUser()
      if (auth.user) {
        await supabase.from('payments').insert({
          invoice_id: invoice.id,
          user_id: auth.user.id,
          amount,
          payment_method: payMethod,
          payment_date: paidAtIso,
          reference: payReference || 'manual',
        })
      }

      if (invoice.job_id) {
        await supabase.from('jobs').update({ status: 'invoiced' }).eq('id', invoice.job_id)
      }
      toast.success(fr ? 'Paiement enregistré' : 'Payment recorded')
      setPayModalOpen(false)
      await fetchInvoice()
    } finally { setPaySaving(false) }
  }

  const deleteInvoice = async () => {
    const { confirmed } = await confirm({
      title: fr ? 'Supprimer cette facture ?' : 'Delete this invoice?',
      description: fr ? 'Cette action est irréversible.' : 'This cannot be undone.',
      confirmLabel: fr ? 'Supprimer' : 'Delete',
    })
    if (!confirmed) return
    const { data: auth } = await supabase.auth.getUser()
    if (auth.user) writeAuditLog({ userId: auth.user.id, action: 'delete', resourceType: 'invoice', resourceId: id })
    await supabase.from('invoices').delete().eq('id', id)
    router.push('/invoices')
  }

  const duplicateInvoice = async () => {
    if (!invoice) return
    router.push(`/invoices/new?customerId=${invoice.customer_id}${invoice.job_id ? `&jobId=${invoice.job_id}` : ''}`)
  }

  const fmt = (n: number) => fmtMoney(n, lang)

  /* ---- Loading ---- */
  if (loading) return (
    <AppLayout title={fr ? 'Facture' : 'Invoice'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        <SkeletonText className="h-6 w-48" />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <SkeletonCard className="h-96" />
          <SkeletonCard className="h-96" />
        </div>
      </div>
    </AppLayout>
  )

  if (!invoice) return (
    <AppLayout title={fr ? 'Facture' : 'Invoice'}>
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <FileText className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">{fr ? 'Facture introuvable.' : 'Invoice not found.'}</p>
        <Link href="/invoices" className="mt-4 text-sm text-indigo-600 hover:underline">{fr ? 'Retour aux factures' : 'Back to invoices'}</Link>
      </div>
    </AppLayout>
  )

  const displayStatus = getInvoiceDisplayStatus(invoice)
  const displayItems: LineItem[] = invoice.line_items || []
  const displaySubtotal = displayItems.reduce((s, li) => s + li.qty * li.unit_price, 0)
  const displayTax = invoice.tax_amount ?? displaySubtotal * ((invoice.tax_rate || 0) / 100)
  const displayTax2 = invoice.tax2_amount ?? displaySubtotal * ((invoice.tax2_rate || 0) / 100)
  const displayDiscount = invoice.discount || 0

  /* ---- Timeline steps ---- */
  const timelineSteps = [
    { key: 'created', label: fr ? 'Créée' : 'Created', date: invoice.created_at, done: true },
    { key: 'sent', label: fr ? 'Envoyée' : 'Sent', date: invoice.status === 'sent' || invoice.status === 'paid' ? invoice.created_at : null, done: invoice.status !== 'draft' && invoice.status !== 'unpaid' },
    { key: 'viewed', label: fr ? 'Vue' : 'Viewed', date: invoice.viewed_at, done: !!invoice.viewed_at },
    { key: 'paid', label: fr ? 'Payée' : 'Paid', date: invoice.paid_at, done: displayStatus === 'paid' },
  ]

  /* ---- Activity labels ---- */
  const activityLabel = (type: string) => {
    const labels: Record<string, { fr: string; en: string }> = {
      created: { fr: 'Facture créée', en: 'Invoice created' },
      sent: { fr: 'Facture envoyée', en: 'Invoice sent' },
      viewed: { fr: 'Facture consultée', en: 'Invoice viewed' },
      paid: { fr: 'Paiement reçu', en: 'Payment received' },
      reminder_sent: { fr: 'Rappel envoyé', en: 'Reminder sent' },
      updated: { fr: 'Facture modifiée', en: 'Invoice updated' },
    }
    return fr ? (labels[type]?.fr || type) : (labels[type]?.en || type)
  }

  const activityIcon = (type: string) => {
    switch (type) {
      case 'created': return <FileText className="h-3.5 w-3.5" />
      case 'sent': return <Send className="h-3.5 w-3.5" />
      case 'viewed': return <Eye className="h-3.5 w-3.5" />
      case 'paid': return <CheckCircle className="h-3.5 w-3.5" />
      case 'reminder_sent': return <RefreshCw className="h-3.5 w-3.5" />
      default: return <Clock className="h-3.5 w-3.5" />
    }
  }

  /* ---- Payment method labels ---- */
  const payMethodLabel = (m: string) => {
    const map: Record<string, { fr: string; en: string; icon: React.ReactNode }> = {
      card: { fr: 'Carte', en: 'Card', icon: <CreditCard className="h-4 w-4" /> },
      transfer: { fr: 'Virement', en: 'Transfer', icon: <Building2 className="h-4 w-4" /> },
      cash: { fr: 'Espèces', en: 'Cash', icon: <Banknote className="h-4 w-4" /> },
      cheque: { fr: 'Chèque', en: 'Cheque', icon: <FileText className="h-4 w-4" /> },
      stripe: { fr: 'Stripe', en: 'Stripe', icon: <CreditCard className="h-4 w-4" /> },
    }
    return map[m] || { fr: m, en: m, icon: <DollarSign className="h-4 w-4" /> }
  }

  return (
    <AppLayout title={invoice.invoice_number || (fr ? 'Facture' : 'Invoice')}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/invoices" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> {fr ? 'Factures' : 'Invoices'}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900">{invoice.invoice_number || invoice.id.slice(0, 8)}</span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ml-2 ${INVOICE_STATUS_CLS[displayStatus] || ''}`}>
            {invoiceStatusLabel(displayStatus, fr)}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* ========== LEFT: Invoice Preview (60%) ========== */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Preview header */}
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xl font-bold text-gray-900">{businessName || (fr ? 'Votre entreprise' : 'Your business')}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-indigo-600">{invoice.invoice_number || `INV-${invoice.id.slice(0, 8).toUpperCase()}`}</p>
                  <p className="text-sm text-gray-400 mt-1">{fmtDate(invoice.created_at, lang)}</p>
                  {invoice.due_date && (
                    <p className={`text-sm mt-0.5 ${displayStatus === 'overdue' ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                      {fr ? 'Échéance :' : 'Due:'} {fmtDate(invoice.due_date, lang)}
                    </p>
                  )}
                </div>
              </div>

              {/* Client info */}
              {invoice.customers && (
                <div className="mt-6 rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{fr ? 'Facturer à' : 'Bill to'}</p>
                  <p className="text-sm font-semibold text-gray-900">{invoice.customers.name}</p>
                  {invoice.customers.email && <p className="text-sm text-gray-500">{invoice.customers.email}</p>}
                  {invoice.customers.phone && <p className="text-sm text-gray-500">{invoice.customers.phone}</p>}
                  {invoice.customers.address && <p className="text-sm text-gray-500">{invoice.customers.address}</p>}
                </div>
              )}
            </div>

            {/* Line items */}
            <div className="px-8 py-6">
              {displayItems.length > 0 ? (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                        <th className="pb-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">{fr ? 'Qté' : 'Qty'}</th>
                        <th className="pb-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">{fr ? 'Prix unitaire' : 'Unit price'}</th>
                        <th className="pb-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {displayItems.map((li, i) => (
                        <tr key={i}>
                          <td className="py-3 text-gray-900">{li.description}</td>
                          <td className="py-3 text-center text-gray-500">{li.qty}{li.unit ? ` ${li.unit}` : ''}</td>
                          <td className="py-3 text-right text-gray-500">{fmt(li.unit_price)}</td>
                          <td className="py-3 text-right font-medium text-gray-900">{fmt(li.qty * li.unit_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="mt-6 pt-4 border-t border-gray-200 space-y-2 max-w-xs ml-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{fr ? 'Sous-total' : 'Subtotal'}</span>
                      <span className="font-medium text-gray-900">{fmt(displaySubtotal)}</span>
                    </div>
                    {displayDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{fr ? 'Remise' : 'Discount'}</span>
                        <span className="font-medium text-emerald-600">-{fmt(displayDiscount)}</span>
                      </div>
                    )}
                    {displayTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{invoice.tax_name || 'TPS'} ({invoice.tax_rate || 5}%)</span>
                        <span className="font-medium text-gray-900">{fmt(displayTax)}</span>
                      </div>
                    )}
                    {displayTax2 > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{invoice.tax2_name || 'TVQ'} ({invoice.tax2_rate || 9.975}%)</span>
                        <span className="font-medium text-gray-900">{fmt(displayTax2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-3 mt-2">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-black text-gray-900">{fmt(invoice.amount)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center py-8">
                  <span className="text-sm text-gray-500">{fr ? 'Montant de la facture' : 'Invoice amount'}</span>
                  <span className="text-3xl font-black text-gray-900">{fmt(invoice.amount)}</span>
                </div>
              )}

              {/* Notes */}
              {invoice.client_notes && (
                <div className="mt-6 rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Note</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.client_notes}</p>
                </div>
              )}
            </div>

            {/* Print button */}
            <div className="px-8 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Printer className="h-4 w-4" /> {fr ? 'Imprimer' : 'Print'}
              </button>
            </div>
          </div>

          {/* ========== RIGHT: Action Panel (40%) ========== */}
          <div className="space-y-4">

            {/* Status Timeline */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{fr ? 'Progression' : 'Progress'}</p>
              <div className="space-y-3">
                {timelineSteps.map((step, i) => (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${step.done ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {step.done ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <div className={`w-0.5 h-6 mt-1 ${step.done ? 'bg-indigo-200' : 'bg-gray-100'}`} />
                      )}
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                      {step.done && step.date && <p className="text-xs text-gray-400">{fmtDate(step.date, lang, 'short')}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Viewed count badge */}
              {(invoice.viewed_count || 0) > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <Eye className="h-3.5 w-3.5" />
                  {fr ? `Vue ${invoice.viewed_count} fois` : `Viewed ${invoice.viewed_count} time(s)`}
                  {invoice.viewed_at && <span className="text-blue-400 ml-1">({fmtDate(invoice.viewed_at, lang, 'short')})</span>}
                </div>
              )}
            </div>

            {/* Amount Card */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{fr ? 'Montant total' : 'Total amount'}</p>
              <p className="text-3xl font-black text-gray-900">{fmt(invoice.amount)}</p>
              {invoice.status === 'paid' && invoice.paid_at && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> {fr ? 'Payée le' : 'Paid on'} {fmtDate(invoice.paid_at, lang, 'short')}</p>
              )}
            </div>

            {/* Actions */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{fr ? 'Actions' : 'Actions'}</p>

              {/* Mark paid */}
              {displayStatus !== 'paid' && (
                <button onClick={openPayModal} className="w-full flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm">
                  <CheckCircle className="h-4 w-4" /> {fr ? 'Marquer comme payée' : 'Mark as paid'}
                </button>
              )}

              {/* Send / Resend */}
              {invoice.customers?.email && displayStatus !== 'paid' && (
                <button
                  onClick={() => sendInvoiceEmail('invoice')}
                  disabled={sending}
                  className="w-full flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
                >
                  {sending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" /> : <Send className="h-4 w-4 text-gray-400" />}
                  {displayStatus === 'sent' || displayStatus === 'overdue'
                    ? (fr ? 'Renvoyer la facture' : 'Resend invoice')
                    : (fr ? 'Envoyer la facture' : 'Send invoice')}
                </button>
              )}

              {/* Reminder */}
              {displayStatus === 'overdue' && invoice.customers?.email && (
                <button
                  onClick={() => sendInvoiceEmail('payment_reminder')}
                  disabled={sending}
                  className="w-full flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
                >
                  <AlertCircle className="h-4 w-4" /> {fr ? 'Envoyer un rappel' : 'Send reminder'}
                </button>
              )}

              {/* Edit */}
              {(displayStatus === 'draft' || displayStatus === 'unpaid') && (
                <Link href={`/invoices/new?editId=${invoice.id}`} className="w-full flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Edit2 className="h-4 w-4 text-gray-400" /> {fr ? 'Modifier' : 'Edit'}
                </Link>
              )}

              {/* Public link */}
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

              {/* View public */}
              {invoice.token && (
                <a href={`/invoice/${invoice.token}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <ExternalLink className="h-4 w-4 text-gray-400" /> {fr ? 'Voir la facture client' : 'View client invoice'}
                </a>
              )}

              {/* Duplicate */}
              <button onClick={duplicateInvoice} className="w-full flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Copy className="h-4 w-4 text-gray-400" /> {fr ? 'Dupliquer' : 'Duplicate'}
              </button>

              {/* Delete */}
              <button onClick={deleteInvoice} className="w-full flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="h-4 w-4" /> {fr ? 'Supprimer' : 'Delete'}
              </button>
            </div>

            {/* Customer Card */}
            {invoice.customers && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{fr ? 'Client' : 'Customer'}</p>
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

            {/* Activity Log */}
            {activity.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{fr ? 'Activité' : 'Activity'}</p>
                <div className="space-y-3 max-h-60 overflow-auto">
                  {activity.map((evt) => (
                    <div key={evt.id} className="flex items-start gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 mt-0.5">
                        {activityIcon(evt.event_type)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700">{activityLabel(evt.event_type)}</p>
                        <p className="text-xs text-gray-400">{fmtDate(evt.created_at, lang, 'short')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {payModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => !paySaving && setPayModalOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{fr ? 'Enregistrer un paiement' : 'Record payment'}</h3>
              </div>
              <button onClick={() => !paySaving && setPayModalOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{fr ? 'Montant' : 'Amount'}</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="block w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{fr ? 'Méthode de paiement' : 'Payment method'}</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['card', 'transfer', 'cash', 'cheque', 'stripe'] as const).map((m) => {
                    const info = payMethodLabel(m)
                    return (
                      <button
                        key={m}
                        onClick={() => setPayMethod(m)}
                        className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition-all ${payMethod === m ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                      >
                        {info.icon}
                        <span>{fr ? info.fr : info.en}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{fr ? 'Date du paiement' : 'Payment date'}</label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{fr ? 'Référence (optionnel)' : 'Reference (optional)'}</label>
                <input type="text" value={payReference} onChange={(e) => setPayReference(e.target.value)} placeholder={fr ? 'N° de transaction, note...' : 'Transaction #, note...'} className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3">
              <button type="button" onClick={() => setPayModalOpen(false)} disabled={paySaving} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                {fr ? 'Annuler' : 'Cancel'}
              </button>
              <button type="button" onClick={submitManualPayment} disabled={paySaving} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                <CheckCircle className="h-4 w-4" /> {paySaving ? (fr ? 'Enregistrement...' : 'Saving...') : (fr ? 'Enregistrer' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
