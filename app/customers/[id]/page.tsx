'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/app/supabase'
import AppLayout from '@/components/AppLayout'
import { SkeletonText, SkeletonCard, SkeletonKPICard } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtMoney, fmtDate as fmtDateLib } from '@/lib/format'
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
interface Quote {
  id: string; title: string | null; status: string | null
  total: number | null; valid_until: string | null; created_at: string
  quote_number?: string | null
}
interface Booking {
  id: string; service_name: string | null; status: string
  requested_date: string | null; requested_time: string | null
  source: string | null; created_at: string
}

const STATUS = {
  scheduled:   { label: 'Planifié',   cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  in_progress: { label: 'En cours',   cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  complete:    { label: 'Terminé',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  cancelled:   { label: 'Annulé',     cls: 'bg-gray-50 text-gray-500 ring-1 ring-gray-100' },
  unpaid:      { label: 'Non payé',   cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  paid:        { label: 'Payé',       cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  overdue:     { label: 'En retard',  cls: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
}

const TAB_LABELS: Record<string, string> = {
  overview: 'Aperçu',
  jobs: 'Emplois',
  invoices: 'Factures',
  quotes: 'Devis',
  bookings: 'Réservations',
  notes: 'Notes',
}

const BOOKING_STATUS: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'En attente',  cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  confirmed:  { label: 'Confirmée',   cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  declined:   { label: 'Refusée',     cls: 'bg-gray-50 text-gray-500 ring-1 ring-gray-100' },
  cancelled:  { label: 'Annulée',     cls: 'bg-gray-50 text-gray-500 ring-1 ring-gray-100' },
  completed:  { label: 'Terminée',    cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  no_show:    { label: 'Absence',     cls: 'bg-gray-50 text-gray-500 ring-1 ring-gray-100' },
  custom_request: { label: 'Demande', cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
}

const QUOTE_STATUS: Record<string, { label: string; cls: string }> = {
  draft:    { label: 'Brouillon', cls: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  sent:     { label: 'Envoyé',    cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  accepted: { label: 'Accepté',   cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  declined: { label: 'Refusé',    cls: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
  expired:  { label: 'Expiré',    cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
}
type StatusKey = keyof typeof STATUS

const AVATAR_COLORS = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-pink-500','bg-cyan-500']
const initials  = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const getColor  = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length]

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const confirm = useConfirm()
  const { lang, t }   = useLanguage()
  const fr = lang === 'fr'
  const tStatus = (k: string) => (t.status as Record<string, string>)[k] || k
  const fmt     = (n: number) => fmtMoney(n, lang)
  const fmtDate = (d: string) => fmtDateLib(d, lang)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [jobs, setJobs]         = useState<Job[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [quotes, setQuotes]     = useState<Quote[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [notes, setNotes]       = useState<Note[]>([])
  const [tab, setTab]           = useState<'overview' | 'jobs' | 'invoices' | 'quotes' | 'bookings' | 'notes'>('overview')
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

      const customerRes = await fetch(`/api/customers/${id}`, { cache: 'no-store' })
      const customerJson = await customerRes.json()
      const c = customerJson.customer
      if (!c) { router.push('/customers'); return }

      const [{ data: j }, { data: inv }, { data: q }, { data: bk }] = await Promise.all([
        supabase.from('jobs').select('id, title, status, scheduled_date, created_at').eq('customer_id', id).eq('user_id', auth.user.id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('id, amount, status, due_date, invoice_number, created_at').eq('customer_id', id).eq('user_id', auth.user.id).order('created_at', { ascending: false }),
        supabase.from('quotes').select('id, title, status, total, valid_until, created_at, quote_number').eq('customer_id', id).eq('user_id', auth.user.id).order('created_at', { ascending: false }),
        supabase.from('booking_requests').select('id, service_name, status, requested_date, requested_time, source, created_at').eq('customer_id', id).eq('user_id', auth.user.id).order('created_at', { ascending: false }),
      ])

      setCustomer(c)
      setJobs(j || [])
      setInvoices(inv || [])
      setQuotes((q || []) as Quote[])
      setBookings((bk || []) as Booking[])

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
    const { confirmed } = await confirm({
      title: fr ? 'Supprimer ce client ?' : 'Delete this customer?',
      description: fr
        ? 'Cette action est irréversible. Tous les emplois et factures associés seront dissociés.'
        : 'This cannot be undone. All associated jobs and invoices will be unlinked.',
      confirmLabel: fr ? 'Supprimer' : 'Delete',
    })
    if (!confirmed) return
    if (userId) writeAuditLog({ userId, action: 'delete', resourceType: 'customer', resourceId: id })
    await supabase.from('customers').delete().eq('id', id)
    router.push('/customers')
  }

  if (loading) return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
        <SkeletonText className="h-8 w-48" />
        <SkeletonCard className="h-40" />
        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonKPICard /><SkeletonKPICard /><SkeletonKPICard />
        </div>
        <SkeletonCard className="h-64" />
      </div>
    </AppLayout>
  )

  if (!customer) return null

  const totalInvoiced = invoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0)
  const totalPaid     = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
  const unpaidStatuses = new Set(['unpaid', 'sent', 'overdue', 'viewed'])
  const totalUnpaid   = invoices.filter((i) => unpaidStatuses.has(i.status)).reduce((s, i) => s + parseFloat(String(i.amount)), 0)
  const unpaidCount   = invoices.filter((i) => unpaidStatuses.has(i.status)).length
  const completedJobs = jobs.filter((j) => j.status === 'complete').length

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Clients
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
                  <input value={ePhone} onChange={(e) => setEPhone(e.target.value)} placeholder="Téléphone" type="tel" className="block w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <input value={eAddress} onChange={(e) => setEAddress(e.target.value)} placeholder="Adresse" className="block w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                <textarea value={eNotes} onChange={(e) => setENotes(e.target.value)} placeholder="Notes internes..." rows={2} className="block w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
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
                <p className="mt-1 text-xs text-gray-400">Client depuis le {fmtDate(customer.created_at)}</p>
              </div>
            )}

            <div className="flex items-center gap-2 shrink-0">
              {editMode ? (
                <>
                  <button onClick={() => setEditMode(false)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">{fr ? 'Annuler' : 'Cancel'}</button>
                  <button onClick={saveEdit} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                    <Save className="h-4 w-4" />{saving ? (fr ? 'Enregistrement...' : 'Saving...') : (fr ? 'Enregistrer' : 'Save')}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditMode(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Edit2 className="h-4 w-4" /> {fr ? 'Modifier' : 'Edit'}
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
              { label: 'Interventions', value: jobs.length, sub: `${completedJobs} terminée(s)`, icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50' },
              { label: 'Facturé', value: fmt(totalInvoiced), sub: `${invoices.length} facture(s)`, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Payé', value: fmt(totalPaid), sub: `${invoices.filter((i) => i.status === 'paid').length} payée(s)`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Solde impayé', value: fmt(totalUnpaid), sub: `${unpaidCount} en attente`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((k) => (
              <div key={k.label} className={`rounded-xl p-3 ${k.bg}`}>
                <k.icon className={`h-5 w-5 ${k.color} mb-1`} />
                <p className="text-xs text-gray-500">{k.label}</p>
                <p className="text-base font-bold text-gray-900">{k.value}</p>
                <p className="text-xs text-gray-400">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/jobs?customerId=${id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              <Briefcase className="h-3.5 w-3.5 text-violet-500" /> Nouvel emploi
            </Link>
            <Link href={`/invoices/new?customerId=${id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Nouvelle facture
            </Link>
            <Link href={`/quotes?customerId=${id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              <FileText className="h-3.5 w-3.5 text-indigo-500" /> Nouveau devis
            </Link>
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                <Mail className="h-3.5 w-3.5 text-blue-500" /> Envoyer un message
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit max-w-full overflow-x-auto">
          {(['overview', 'jobs', 'invoices', 'quotes', 'bookings', 'notes'] as const).map((t) => {
            const counts: Record<string, number> = {
              jobs: jobs.length, invoices: invoices.length, quotes: quotes.length,
              bookings: bookings.length, notes: notes.length,
            }
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={['rounded-lg px-4 py-1.5 text-sm font-semibold transition-all whitespace-nowrap', tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}
              >
                {TAB_LABELS[t] || t}
                {counts[t] > 0 && <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs">{counts[t]}</span>}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {tab === 'overview' && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Aperçu du client</h2>
            {customer.notes ? (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5"><StickyNote className="h-3.5 w-3.5" /> Notes internes</p>
                <p className="text-sm text-amber-900 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-4 text-center">
                <StickyNote className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                <p className="text-sm text-gray-400">{fr ? 'Aucune note. Modifiez le client pour ajouter des notes internes.' : 'No notes. Edit the customer to add internal notes.'}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500 mb-0.5">Client depuis</p><p className="font-medium text-gray-900">{fmtDate(customer.created_at)}</p></div>
              <div><p className="text-xs text-gray-500 mb-0.5">Valeur cumulative totale</p><p className="font-semibold text-emerald-700">{fmt(totalInvoiced)}</p></div>
            </div>
          </div>
        )}

        {tab === 'jobs' && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Emplois ({jobs.length})</h2>
              <Link href={`/jobs?customerId=${id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Nouvel emploi
              </Link>
            </div>
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">{fr ? 'Aucun emploi pour ce client' : 'No jobs for this customer'}</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {jobs.map((j) => {
                  const s = STATUS[j.status as StatusKey]
                  return (
                    <li key={j.id}>
                      <Link href={`/jobs/${j.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
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
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s?.cls || ''}`}>{tStatus(j.status)}</span>
                      </Link>
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
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Factures ({invoices.length})</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Facturé : <span className="font-medium text-gray-700">{fmt(totalInvoiced)}</span> ·
                  Payé : <span className="font-medium text-emerald-700">{fmt(totalPaid)}</span> ·
                  Impayé : <span className="font-medium text-amber-700">{fmt(totalUnpaid)}</span>
                </p>
              </div>
              <Link href={`/invoices/new?customerId=${id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Nouvelle facture
              </Link>
            </div>
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">{fr ? 'Aucune facture pour ce client' : 'No invoices for this customer'}</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {invoices.map((inv) => {
                  const s = STATUS[inv.status as StatusKey]
                  return (
                    <li key={inv.id}>
                      <Link href={`/invoices/${inv.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                          <DollarSign className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{fmt(parseFloat(String(inv.amount)))}</p>
                          <p className="text-xs text-gray-400">
                            {inv.invoice_number || 'Facture'} · {inv.due_date ? `Éch. ${fmtDate(inv.due_date)}` : fmtDate(inv.created_at)}
                          </p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s?.cls || ''}`}>{tStatus(inv.status)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {tab === 'quotes' && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Devis ({quotes.length})</h2>
              <Link href={`/quotes?customerId=${id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Nouveau devis
              </Link>
            </div>
            {quotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">{fr ? 'Aucun devis pour ce client' : 'No quotes for this customer'}</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {quotes.map((q) => {
                  const s = q.status ? QUOTE_STATUS[q.status] : null
                  return (
                    <li key={q.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                        <FileText className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {q.title || q.quote_number || 'Devis'}{q.total != null ? ` · ${fmt(parseFloat(String(q.total)))}` : ''}
                        </p>
                        <p className="text-xs text-gray-400">
                          {q.quote_number ? `${q.quote_number} · ` : ''}
                          {q.valid_until ? `Valide jusqu'au ${fmtDate(q.valid_until)}` : `Créé le ${fmtDate(q.created_at)}`}
                        </p>
                      </div>
                      {s && q.status && (
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{tStatus(q.status)}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {tab === 'bookings' && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Réservations ({bookings.length})</h2>
            </div>
            {bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">{fr ? 'Aucune réservation pour ce client' : 'No bookings for this customer'}</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {bookings.map((b) => {
                  const s = BOOKING_STATUS[b.status]
                  return (
                    <li key={b.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{b.service_name || 'Réservation'}</p>
                        <p className="text-xs text-gray-400">
                          {b.requested_date ? fmtDate(b.requested_date) : fmtDate(b.created_at)}
                          {b.requested_time ? ` à ${b.requested_time.slice(0, 5)}` : ''}
                          {b.source ? ` · ${b.source}` : ''}
                        </p>
                      </div>
                      {s && (
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{tStatus(b.status)}</span>
                      )}
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
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Ajouter une note</h3>
              <textarea
                placeholder="Ajouter une note sur ce client..."
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
                <Plus className="h-4 w-4" />{addingNote ? 'Ajout...' : 'Ajouter une note'}
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
                <StickyNote className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">{fr ? 'Aucune note. Ajoutez votre première note ci-dessus.' : 'No notes. Add your first note above.'}</p>
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
