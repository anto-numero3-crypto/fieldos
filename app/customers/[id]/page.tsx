'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/app/supabase'
import AppLayout from '@/components/AppLayout'
import { writeAuditLog } from '@/lib/audit'
import {
  ArrowLeft, Mail, Phone, MapPin, Tag, Edit2, Trash2, Plus,
  Briefcase, FileText, DollarSign, Clock, CheckCircle, AlertCircle,
  StickyNote, TrendingUp, Calendar, MoreHorizontal, X, Save,
} from 'lucide-react'

interface Customer {
  id: string; name: string; email: string | null; phone: string | null
  address: string | null; notes: string | null; tags: string[] | null
  lifetime_value: number | null; created_at: string
}
interface Job { id: string; title: string; status: string; scheduled_date: string | null; created_at: string }
interface Invoice { id: string; amount: number; status: string; due_date: string | null; invoice_number: string | null; created_at: string }
interface Note { id: string; content: string; created_at: string }

const STATUS = {
  scheduled:   { label: 'Scheduled',   cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  complete:    { label: 'Complete',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-gray-50 text-gray-500 ring-1 ring-gray-100' },
  unpaid:      { label: 'Unpaid',      cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  paid:        { label: 'Paid',        cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  overdue:     { label: 'Overdue',     cls: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
}
type StatusKey = keyof typeof STATUS

const AVATAR_COLORS = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-pink-500','bg-cyan-500']
const initials  = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const getColor  = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length]
const fmt       = (n: number) => `$${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate   = (d: string) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [jobs, setJobs]         = useState<Job[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [notes, setNotes]       = useState<Note[]>([])
  const [tab, setTab]           = useState<'overview' | 'jobs' | 'invoices' | 'notes'>('overview')
  const [loading, setLoading]   = useState(true)
  const [userId, setUserId]     = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [newNote, setNewNote]   = useState('')
  const [addingNote, setAddingNote] = useState(false)

  // Edit form
  const [eName, setEName]       = useState('')
  const [eEmail, setEEmail]     = useState('')
  const [ePhone, setEPhone]     = useState('')
  const [eAddress, setEAddress] = useState('')
  const [eNotes, setENotes]     = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { router.push('/login'); return }
      setUserId(auth.user.id)

      const [{ data: c }, { data: j }, { data: inv }] = await Promise.all([
        supabase.from('customers').select('*').eq('id', id).eq('user_id', auth.user.id).single(),
        supabase.from('jobs').select('id, title, status, scheduled_date, created_at').eq('customer_id', id).eq('user_id', auth.user.id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('id, amount, status, due_date, invoice_number, created_at').eq('customer_id', id).eq('user_id', auth.user.id).order('created_at', { ascending: false }),
      ])

      if (!c) { router.push('/customers'); return }
      setCustomer(c)
      setJobs(j || [])
      setInvoices(inv || [])

      // Try to fetch notes (may not exist yet)
      const { data: n } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false })
      setNotes(n || [])

      setEName(c.name); setEEmail(c.email || ''); setEPhone(c.phone || '')
      setEAddress(c.address || ''); setENotes(c.notes || '')
      setLoading(false)
    }
    init()
  }, [id, router])

  const saveEdit = async () => {
    if (!eName.trim()) return
    setSaving(true)
    const { error } = await supabase.from('customers').update({
      name: eName.trim(), email: eEmail.trim() || null,
      phone: ePhone.trim() || null, address: eAddress.trim() || null,
      notes: eNotes.trim() || null,
    }).eq('id', id)
    if (!error && customer) {
      setCustomer({ ...customer, name: eName, email: eEmail || null, phone: ePhone || null, address: eAddress || null, notes: eNotes || null })
      setEditMode(false)
      if (userId) writeAuditLog({ userId, action: 'update', resourceType: 'customer', resourceId: id, details: { name: eName } })
    }
    setSaving(false)
  }

  const addNote = async () => {
    if (!newNote.trim() || !userId) return
    setAddingNote(true)
    const { data } = await supabase.from('customer_notes').insert({
      customer_id: id, user_id: userId, content: newNote.trim(),
    }).select().single()
    if (data) setNotes([data, ...notes])
    setNewNote('')
    setAddingNote(false)
  }

  const deleteCustomer = async () => {
    if (!confirm('Delete this customer? All associated jobs and invoices will be unlinked.')) return
    if (userId) writeAuditLog({ userId, action: 'delete', resourceType: 'customer', resourceId: id })
    await supabase.from('customers').delete().eq('id', id)
    router.push('/customers')
  }

  if (loading) return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-32 skeleton rounded" />
        <div className="h-40 skeleton rounded-2xl" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    </AppLayout>
  )

  if (!customer) return null

  const totalInvoiced = invoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0)
  const totalPaid     = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
  const completedJobs = jobs.filter((j) => j.status === 'complete').length

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Customers
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900">{customer.name}</span>
        </div>

        {/* Header card */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white ${getColor(customer.name)}`}>
              {initials(customer.name)}
            </div>

            {editMode ? (
              <div className="flex-1 space-y-3">
                <input value={eName} onChange={(e) => setEName(e.target.value)} className="block w-full rounded-xl border border-gray-200 px-3.5 py-2 text-base font-semibold text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={eEmail} onChange={(e) => setEEmail(e.target.value)} placeholder="Email" type="email" className="block w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  <input value={ePhone} onChange={(e) => setEPhone(e.target.value)} placeholder="Phone" type="tel" className="block w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <input value={eAddress} onChange={(e) => setEAddress(e.target.value)} placeholder="Address" className="block w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                <textarea value={eNotes} onChange={(e) => setENotes(e.target.value)} placeholder="Internal notes..." rows={2} className="block w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                  {customer.email   && <span className="flex items-center gap-1.5"><Mail  className="h-4 w-4 text-gray-300" />{customer.email}</span>}
                  {customer.phone   && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-gray-300" />{customer.phone}</span>}
                  {customer.address && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gray-300" />{customer.address}</span>}
                </div>
                {(customer.tags || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(customer.tags || []).map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                        <Tag className="h-2.5 w-2.5" />{tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-400">Customer since {fmtDate(customer.created_at)}</p>
              </div>
            )}

            <div className="flex items-center gap-2 shrink-0">
              {editMode ? (
                <>
                  <button onClick={() => setEditMode(false)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={saveEdit} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                    <Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditMode(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Edit2 className="h-4 w-4" /> Edit
                  </button>
                  <button onClick={deleteCustomer} className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* KPIs */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Jobs', value: jobs.length, sub: `${completedJobs} completed`, icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50' },
              { label: 'Invoiced', value: fmt(totalInvoiced), sub: `${invoices.length} invoices`, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Paid', value: fmt(totalPaid), sub: `${invoices.filter((i) => i.status === 'paid').length} paid`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Outstanding', value: fmt(totalInvoiced - totalPaid), sub: `${invoices.filter((i) => i.status !== 'paid').length} pending`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((k) => (
              <div key={k.label} className={`rounded-xl p-3 ${k.bg}`}>
                <k.icon className={`h-5 w-5 ${k.color} mb-1`} />
                <p className="text-xs text-gray-500">{k.label}</p>
                <p className="text-base font-bold text-gray-900">{k.value}</p>
                <p className="text-xs text-gray-400">{k.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
          {(['overview', 'jobs', 'invoices', 'notes'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={['rounded-lg px-4 py-1.5 text-sm font-semibold transition-all', tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'jobs'     && jobs.length > 0     && <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs">{jobs.length}</span>}
              {t === 'invoices' && invoices.length > 0 && <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs">{invoices.length}</span>}
              {t === 'notes'    && notes.length > 0    && <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs">{notes.length}</span>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview' && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Customer Overview</h2>
            {customer.notes ? (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5"><StickyNote className="h-3.5 w-3.5" /> Internal Notes</p>
                <p className="text-sm text-amber-900 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-4 text-center">
                <StickyNote className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                <p className="text-sm text-gray-400">No notes. Edit customer to add internal notes.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500 mb-0.5">Customer since</p><p className="font-medium text-gray-900">{fmtDate(customer.created_at)}</p></div>
              <div><p className="text-xs text-gray-500 mb-0.5">Total lifetime value</p><p className="font-semibold text-emerald-700">{fmt(totalInvoiced)}</p></div>
            </div>
          </div>
        )}

        {tab === 'jobs' && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Jobs ({jobs.length})</h2>
              <Link href="/jobs" className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">
                <Plus className="h-3.5 w-3.5" /> New Job
              </Link>
            </div>
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No jobs yet for this customer</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {jobs.map((j) => {
                  const s = STATUS[j.status as StatusKey]
                  return (
                    <li key={j.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50">
                        <Briefcase className="h-4 w-4 text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{j.title}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {j.scheduled_date ? fmtDate(j.scheduled_date) : fmtDate(j.created_at)}
                        </p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s?.cls || ''}`}>{s?.label || j.status}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {tab === 'invoices' && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Invoices ({invoices.length})</h2>
              <Link href="/invoices" className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">
                <Plus className="h-3.5 w-3.5" /> New Invoice
              </Link>
            </div>
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No invoices yet for this customer</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {invoices.map((inv) => {
                  const s = STATUS[inv.status as StatusKey]
                  return (
                    <li key={inv.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{fmt(parseFloat(String(inv.amount)))}</p>
                        <p className="text-xs text-gray-400">
                          {inv.invoice_number || 'Invoice'} · {inv.due_date ? `Due ${fmtDate(inv.due_date)}` : fmtDate(inv.created_at)}
                        </p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s?.cls || ''}`}>{s?.label || inv.status}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Note</h3>
              <textarea
                placeholder="Add a note about this customer..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none mb-3"
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim() || addingNote}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Plus className="h-4 w-4" />{addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
                <StickyNote className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No notes yet. Add your first note above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{fmtDate(note.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
