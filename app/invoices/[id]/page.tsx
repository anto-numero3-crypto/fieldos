'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../supabase'
import AppLayout from '@/components/AppLayout'
import { writeAuditLog } from '@/lib/audit'
import {
  ArrowLeft, FileText, User, Briefcase, Calendar, DollarSign,
  CheckCircle, Clock, AlertCircle, Edit2, Save, X, Printer,
  Send, Trash2, ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface LineItem { description: string; qty: number; unit_price: number }

interface Invoice {
  id: string
  invoice_number?: string
  amount: number
  status: string
  due_date: string | null
  created_at: string
  paid_at?: string | null
  tax_rate?: number
  line_items?: LineItem[] | null
  customer_id: string
  job_id?: string | null
  customers: { id: string; name: string; email?: string; phone?: string } | null
  jobs: { id: string; title: string } | null
}

const STATUS_CFG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  unpaid:  { label: 'Unpaid',  className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',   icon: Clock },
  paid:    { label: 'Paid',    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: CheckCircle },
  overdue: { label: 'Overdue', className: 'bg-red-50 text-red-700 ring-1 ring-red-200',         icon: AlertCircle },
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [invoice, setInvoice]   = useState<Invoice | null>(null)
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [sending, setSending]   = useState(false)
  const [message, setMessage]   = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Edit form state
  const [editStatus, setEditStatus]   = useState('unpaid')
  const [editDueDate, setEditDueDate] = useState('')
  const [editTaxRate, setEditTaxRate] = useState('0')
  const [lineItems, setLineItems]     = useState<LineItem[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { window.location.href = '/login'; return }
      fetchInvoice()
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchInvoice = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('invoices')
      .select('*, customers(id, name, email, phone), jobs(id, title)')
      .eq('id', id)
      .single()
    if (data) {
      setInvoice(data)
      setEditStatus(data.status)
      setEditDueDate(data.due_date || '')
      setEditTaxRate(String(data.tax_rate || 0))
      setLineItems(data.line_items || [])
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
      setMessage({ text: error.message, type: 'error' })
    } else {
      setMessage({ text: 'Invoice updated.', type: 'success' })
      setEditing(false)
      fetchInvoice()
      setTimeout(() => setMessage(null), 3000)
    }
    setSaving(false)
  }

  const deleteInvoice = async () => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return
    const { data: auth } = await supabase.auth.getUser()
    if (auth.user) writeAuditLog({ userId: auth.user.id, action: 'delete', resourceType: 'invoice', resourceId: id })
    await supabase.from('invoices').delete().eq('id', id)
    router.push('/invoices')
  }

  const markPaid = async () => {
    await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
    fetchInvoice()
  }

  const sendInvoiceEmail = async (type: 'invoice' | 'payment_reminder') => {
    if (!invoice?.customers?.email) return
    setSending(true)
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          to: invoice.customers.email,
          customerName: invoice.customers.name,
          invoiceNumber: invoice.invoice_number,
          amount: `$${parseFloat(String(invoice.amount)).toFixed(2)}`,
          dueDate: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' }) : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ text: `Email sent to ${invoice.customers.email}`, type: 'success' })
      } else {
        setMessage({ text: data.error || 'Email failed to send', type: 'error' })
      }
    } catch {
      setMessage({ text: 'Failed to send email', type: 'error' })
    }
    setSending(false)
    setTimeout(() => setMessage(null), 4000)
  }

  const addLineItem = () => setLineItems([...lineItems, { description: '', qty: 1, unit_price: 0 }])
  const updateLineItem = (i: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[i] = { ...updated[i], [field]: field === 'description' ? value : parseFloat(String(value)) || 0 }
    setLineItems(updated)
  }
  const removeLineItem = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i))

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (loading) return (
    <AppLayout title="Invoice">
      <div className="flex h-full items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
      </div>
    </AppLayout>
  )

  if (!invoice) return (
    <AppLayout title="Invoice">
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <FileText className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">Invoice not found.</p>
        <Link href="/invoices" className="mt-4 text-sm text-indigo-600 hover:underline">Back to Invoices</Link>
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
    <AppLayout title={invoice.invoice_number || 'Invoice'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/invoices" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Invoices
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900">{invoice.invoice_number || invoice.id.slice(0, 8)}</span>
        </div>

        {message && (
          <div className={`mb-4 flex items-center gap-2 rounded-xl p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {message.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle className="h-4 w-4 shrink-0" />}
            {message.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main invoice panel */}
          <div className="lg:col-span-2 space-y-6">

            {/* Invoice header card */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{invoice.invoice_number || `INV-${invoice.id.slice(0,8).toUpperCase()}`}</p>
                    <p className="text-xs text-gray-400">Created {new Date(invoice.created_at).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!editing && invoice.status !== 'paid' && (
                    <button
                      onClick={markPaid}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      <CheckCircle className="h-4 w-4" /> Mark Paid
                    </button>
                  )}
                  {!editing ? (
                    <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                      <Edit2 className="h-4 w-4" /> Edit
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                        <X className="h-4 w-4" /> Cancel
                      </button>
                      <button onClick={saveEdits} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-sm">
                        <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Status + Due Date row */}
              {editing ? (
                <div className="px-6 py-4 grid grid-cols-2 gap-4 bg-gray-50 border-b border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
                    <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>
              ) : (
                <div className="px-6 py-4 flex items-center gap-6 bg-gray-50 border-b border-gray-100">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg?.className}`}>
                    <StatusIcon className="h-3.5 w-3.5" /> {cfg?.label || invoice.status}
                  </span>
                  {invoice.due_date && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 text-gray-300" />
                      Due {new Date(invoice.due_date).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                  {invoice.paid_at && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      Paid {new Date(invoice.paid_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              )}

              {/* Line items */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900">Line Items</p>
                  {editing && (
                    <button onClick={addLineItem} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">+ Add item</button>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-2">
                    {lineItems.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">No line items. Add one above or save with just the invoice amount.</p>
                    )}
                    {lineItems.map((li, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          value={li.description}
                          onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                          placeholder="Description"
                          className="col-span-6 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                        />
                        <input
                          type="number" min="1" value={li.qty}
                          onChange={(e) => updateLineItem(i, 'qty', e.target.value)}
                          className="col-span-2 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none text-center"
                          placeholder="Qty"
                        />
                        <input
                          type="number" min="0" step="0.01" value={li.unit_price}
                          onChange={(e) => updateLineItem(i, 'unit_price', e.target.value)}
                          className="col-span-3 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                          placeholder="Price"
                        />
                        <button onClick={() => removeLineItem(i)} className="col-span-1 flex justify-center text-gray-300 hover:text-red-500 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <label className="text-xs text-gray-500">Tax rate:</label>
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
                          <th className="pb-2 text-center text-xs font-medium text-gray-400">Qty</th>
                          <th className="pb-2 text-right text-xs font-medium text-gray-400">Unit Price</th>
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
                      <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(displaySubtotal)}</span></div>
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
                    <span className="text-sm text-gray-500">Invoice amount</span>
                    <span className="text-2xl font-bold text-gray-900">{fmt(invoice.amount)}</span>
                  </div>
                )}

                {editing && lineItems.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(lineItemSubtotal)}</span></div>
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Amount</p>
              <p className="text-4xl font-bold text-gray-900">{fmt(invoice.amount)}</p>
              {invoice.status === 'paid' && invoice.paid_at && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Paid {new Date(invoice.paid_at).toLocaleDateString()}</p>
              )}
            </div>

            {/* Customer card */}
            {invoice.customers && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer</p>
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
                  View profile <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}

            {/* Job card */}
            {invoice.jobs && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Linked Job</p>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-400 shrink-0" />
                  <p className="text-sm font-medium text-gray-900 truncate">{invoice.jobs.title}</p>
                </div>
                <Link href={`/jobs/${invoice.jobs.id}`} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  View job <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}

            {/* Actions */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Actions</p>
              <button
                onClick={() => window.print()}
                className="w-full flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-4 w-4 text-gray-400" /> Print / Download PDF
              </button>
              {invoice.customers?.email && (
                <>
                  <button
                    onClick={() => sendInvoiceEmail('invoice')}
                    disabled={sending}
                    className="w-full flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
                  >
                    {sending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" /> : <Send className="h-4 w-4 text-gray-400" />}
                    Send Invoice Email
                  </button>
                  {invoice.status === 'overdue' && (
                    <button
                      onClick={() => sendInvoiceEmail('payment_reminder')}
                      disabled={sending}
                      className="w-full flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
                    >
                      <Send className="h-4 w-4" /> Send Payment Reminder
                    </button>
                  )}
                </>
              )}
              <button
                onClick={deleteInvoice}
                className="w-full flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Delete Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
