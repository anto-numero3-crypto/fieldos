'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/app/supabase'
import AppLayout from '@/components/AppLayout'
import { SkeletonText, SkeletonCard } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useLanguage } from '@/lib/LanguageContext'
import { toast } from 'sonner'
import { fmtMoney, fmtDate as fmtDateLib } from '@/lib/format'
import {
  ArrowLeft, User, Calendar, Clock, Flag, Edit2, Save, CheckSquare,
  Square, Plus, Trash2, FileText, DollarSign, AlertCircle, CheckCircle,
  MapPin, StickyNote, X, Camera,
} from 'lucide-react'

interface ChecklistItem { id: string; text: string; done: boolean }
interface Job {
  id: string; title: string; description: string | null; status: string
  priority: string | null; scheduled_date: string | null; start_time: string | null
  end_time: string | null; service_address: string | null; internal_notes: string | null
  checklist: ChecklistItem[] | null; created_at: string
  source: string | null
  quote_id?: string | null
  assigned_to: string | null
  customers: { id: string; name: string; email: string | null; phone: string | null } | null
}
interface TeamMember { id: string; name: string; email: string; is_active: boolean }

const STATUS_CFG: Record<string, { label: string; cls: string; dotCls: string }> = {
  scheduled:   { label: 'Planifié',   cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',     dotCls: 'bg-blue-500' },
  in_progress: { label: 'En cours',   cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',  dotCls: 'bg-amber-500' },
  complete:    { label: 'Terminé',    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100', dotCls: 'bg-emerald-500' },
  cancelled:   { label: 'Annulé',     cls: 'bg-gray-50 text-gray-500 ring-1 ring-gray-100',      dotCls: 'bg-gray-400' },
}
const PRIORITY_CFG: Record<string, { label: string; cls: string }> = {
  low:    { label: 'Basse priorité',   cls: 'text-gray-500' },
  normal: { label: 'Priorité normale', cls: 'text-blue-500' },
  high:   { label: 'Haute priorité',   cls: 'text-amber-600' },
  urgent: { label: 'Urgent',           cls: 'text-red-600' },
}


export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const confirm = useConfirm()
  const { lang, t }   = useLanguage()
  const tStatus = (k: string) => (t.status as Record<string, string>)[k] || k
  const fmtDate = (d: string) => fmtDateLib(d, lang)
  const fmt = (n: number) => fmtMoney(n, lang)

  const [job, setJob]         = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [newCheckItem, setNewCheckItem] = useState('')
  const [statusDropdown, setStatusDropdown] = useState(false)
  const [invoiceLinked, setInvoiceLinked] = useState<{ id: string; amount: number; status: string } | null>(null)
  const [team, setTeam] = useState<TeamMember[]>([])

  // Edit fields
  const [eTitle, setETitle]   = useState('')
  const [eDesc, setEDesc]     = useState('')
  const [eDate, setEDate]     = useState('')
  const [eStart, setEStart]   = useState('')
  const [eEnd, setEEnd]       = useState('')
  const [eAddr, setEAddr]     = useState('')
  const [eNotes, setENotes]   = useState('')
  const [ePriority, setEPriority] = useState('normal')

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { router.push('/login'); return }

      const { data: j } = await supabase
        .from('jobs')
        .select('*, customers(id, name, email, phone)')
        .eq('id', id)
        .eq('user_id', auth.user.id)
        .single()

      if (!j) { router.push('/jobs'); return }
      setJob(j as unknown as Job)

      // Populate edit fields
      setETitle(j.title); setEDesc(j.description || ''); setEDate(j.scheduled_date || '')
      setEStart(j.start_time || ''); setEEnd(j.end_time || ''); setEAddr(j.service_address || '')
      setENotes(j.internal_notes || ''); setEPriority(j.priority || 'normal')

      // Load linked invoice
      const { data: inv } = await supabase.from('invoices').select('id, amount, status').eq('job_id', id).single()
      if (inv) setInvoiceLinked(inv)

      // Load team for assignment
      const { data: tm } = await supabase.from('team_members')
        .select('id, name, email, is_active')
        .eq('owner_user_id', auth.user.id)
        .eq('is_active', true)
        .order('name')
      setTeam(tm || [])

      setLoading(false)
    }
    init()
  }, [id, router])

  const assignMember = async (memberId: string) => {
    if (!job) return
    const value = memberId || null
    const { error } = await supabase.from('jobs').update({ assigned_to: value }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setJob({ ...job, assigned_to: value })
    toast.success(t.success.updated)
    if (value) {
      const m = team.find((x) => x.id === value)
      if (m?.email) {
        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'job_assigned',
            to: m.email,
            memberName: m.name,
            serviceName: job.title,
            customerName: job.customers?.name || '',
            customerPhone: job.customers?.phone || undefined,
            address: job.service_address || undefined,
            bookingDate: job.scheduled_date || '',
            bookingTime: job.start_time || '',
            notes: job.description || undefined,
            jobLink: `${window.location.origin}/jobs/${job.id}`,
          }),
        })
      }
    }
  }

  const saveEdit = async () => {
    if (!eTitle.trim() || !job) return
    setSaving(true)
    const { error } = await supabase.from('jobs').update({
      title: eTitle, description: eDesc || null, scheduled_date: eDate || null,
      start_time: eStart || null, end_time: eEnd || null,
      service_address: eAddr || null, internal_notes: eNotes || null, priority: ePriority,
    }).eq('id', id)
    if (!error) {
      setJob({ ...job, title: eTitle, description: eDesc || null, scheduled_date: eDate || null,
        start_time: eStart || null, end_time: eEnd || null, service_address: eAddr || null,
        internal_notes: eNotes || null, priority: ePriority })
      setEditMode(false)
    }
    setSaving(false)
  }

  const changeStatus = async (newStatus: string) => {
    if (!job) return
    await supabase.from('jobs').update({ status: newStatus }).eq('id', id)
    setJob({ ...job, status: newStatus })
    setStatusDropdown(false)
  }

  const toggleCheckItem = async (itemId: string) => {
    if (!job) return
    const updated = (job.checklist || []).map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    )
    await supabase.from('jobs').update({ checklist: updated }).eq('id', id)
    setJob({ ...job, checklist: updated })
  }

  const addCheckItem = async () => {
    if (!newCheckItem.trim() || !job) return
    const newItem: ChecklistItem = { id: Date.now().toString(), text: newCheckItem.trim(), done: false }
    const updated = [...(job.checklist || []), newItem]
    await supabase.from('jobs').update({ checklist: updated }).eq('id', id)
    setJob({ ...job, checklist: updated })
    setNewCheckItem('')
  }

  const deleteCheckItem = async (itemId: string) => {
    if (!job) return
    const updated = (job.checklist || []).filter((item) => item.id !== itemId)
    await supabase.from('jobs').update({ checklist: updated }).eq('id', id)
    setJob({ ...job, checklist: updated })
  }

  const generateInvoice = () => {
    if (!job) return
    const customerId = job.customers?.id || ''
    router.push(`/invoices/new?jobId=${encodeURIComponent(String(id))}&customerId=${encodeURIComponent(customerId)}`)
  }

  const deleteJob = async () => {
    const { confirmed } = await confirm({
      title: 'Supprimer cet emploi ?',
      description: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
    })
    if (!confirmed) return
    await supabase.from('jobs').delete().eq('id', id)
    router.push('/jobs')
  }

  if (loading) return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
        <SkeletonText className="h-6 w-48" />
        <SkeletonCard className="h-16" />
        <SkeletonCard className="h-48" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard className="h-40" />
            <SkeletonCard className="h-32" />
          </div>
          <div className="space-y-4">
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
          </div>
        </div>
      </div>
    </AppLayout>
  )

  if (!job) return null

  const scfg    = STATUS_CFG[job.status]
  const pcfg    = PRIORITY_CFG[job.priority || 'normal']
  const checklist = job.checklist || []
  const doneCount = checklist.filter((c) => c.done).length
  const checkPct  = checklist.length > 0 ? (doneCount / checklist.length) * 100 : 0

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Interventions
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900 truncate">{job.title}</span>
        </div>

        {/* Status Pipeline */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-6 py-4 mb-4 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max">
            {[
              { key: 'scheduled', label: 'Planifié', dot: 'bg-blue-500' },
              { key: 'in_progress', label: 'En cours', dot: 'bg-amber-500' },
              { key: 'complete', label: 'Terminé', dot: 'bg-emerald-500' },
              { key: 'invoiced', label: 'Facturé', dot: 'bg-indigo-500' },
            ].map((step, i) => {
              const statuses = ['scheduled', 'in_progress', 'complete', 'invoiced']
              const currentIdx = statuses.indexOf(job.status === 'cancelled' ? 'scheduled' : (invoiceLinked ? 'invoiced' : job.status))
              const stepIdx = statuses.indexOf(step.key)
              const isDone   = stepIdx < currentIdx
              const isCurrent = stepIdx === currentIdx
              const isCancelled = job.status === 'cancelled'
              return (
                <div key={step.key} className="flex items-center">
                  {i > 0 && <div className={`h-0.5 w-8 sm:w-12 ${isDone ? 'bg-indigo-400' : 'bg-gray-200'}`} />}
                  <button
                    onClick={() => step.key !== 'invoiced' && changeStatus(step.key)}
                    className={[
                      'flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                      isCurrent && !isCancelled ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200' :
                      isDone && !isCancelled ? 'text-gray-500 hover:bg-gray-50' :
                      'text-gray-300',
                      step.key === 'invoiced' ? 'cursor-default' : 'cursor-pointer',
                    ].join(' ')}
                  >
                    <span className={`h-2 w-2 rounded-full ${isDone || isCurrent ? step.dot : 'bg-gray-200'}`} />
                    {step.label}
                  </button>
                </div>
              )
            })}
            {job.status === 'cancelled' && (
              <div className="ml-4 flex items-center gap-1.5 rounded-xl bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-400">
                <span className="h-2 w-2 rounded-full bg-gray-300" /> Annulé
              </div>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              {editMode ? (
                <input value={eTitle} onChange={(e) => setETitle(e.target.value)} className="block w-full text-xl font-bold text-gray-900 rounded-xl border border-gray-200 px-3.5 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 mb-3" />
              ) : (
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
                  {job.source === 'booking' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-xs font-semibold">
                      <Calendar className="h-3 w-3" /> Réservé en ligne
                    </span>
                  )}
                  {job.source === 'quote' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-700 px-2.5 py-0.5 text-xs font-semibold">
                      <FileText className="h-3 w-3" /> Créé depuis un devis
                      {job.quote_id && (
                        <Link href={`/quotes`} className="ml-1 underline">voir</Link>
                      )}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {/* Status selector */}
                <div className="relative">
                  <button
                    onClick={() => setStatusDropdown(!statusDropdown)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity ${scfg?.cls || ''}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${scfg?.dotCls}`} />
                    {tStatus(job.status)}
                  </button>
                  {statusDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setStatusDropdown(false)} />
                      <div className="absolute left-0 top-full mt-1 z-20 w-44 rounded-xl border border-gray-100 bg-white shadow-lg py-1 slide-up">
                        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                          <button key={key} onClick={() => changeStatus(key)} className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${job.status === key ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}>
                            <span className={`h-2 w-2 rounded-full ${cfg.dotCls}`} />{tStatus(key)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <span className={`text-sm font-medium flex items-center gap-1 ${pcfg.cls}`}>
                  <Flag className="h-3.5 w-3.5" />{pcfg.label}
                </span>

                {job.scheduled_date && (
                  <span className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-gray-300" />
                    {fmtDate(job.scheduled_date)}
                    {job.start_time && ` · ${job.start_time}${job.end_time ? ' – ' + job.end_time : ''}`}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {editMode ? (
                <>
                  <button onClick={() => setEditMode(false)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button onClick={saveEdit} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                    <Save className="h-4 w-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditMode(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Edit2 className="h-4 w-4" /> Modifier
                  </button>
                  <button onClick={deleteJob} className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Description / edit */}
          {editMode ? (
            <div className="mt-4 space-y-3">
              <textarea value={eDesc} onChange={(e) => setEDesc(e.target.value)} placeholder="Description..." rows={3} className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                  <input type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Priorité</label>
                  <select value={ePriority} onChange={(e) => setEPriority(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    {[['low','Basse'],['normal','Normale'],['high','Haute'],['urgent','Urgent']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Heure de début</label>
                  <input type="time" value={eStart} onChange={(e) => setEStart(e.target.value)} className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Heure de fin</label>
                  <input type="time" value={eEnd} onChange={(e) => setEEnd(e.target.value)} className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              </div>
              <input value={eAddr} onChange={(e) => setEAddr(e.target.value)} placeholder="Adresse d'intervention..." className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {job.description && <p className="text-sm text-gray-600">{job.description}</p>}
              {job.service_address && (
                <p className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 text-gray-300 shrink-0" />{job.service_address}
                </p>
              )}
            </div>
          )}

          {/* Customer card */}
          {job.customers && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {job.customers.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/customers/${job.customers.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors">{job.customers.name}</Link>
                <div className="flex gap-3 text-xs text-gray-400">
                  {job.customers.email && <span>{job.customers.email}</span>}
                  {job.customers.phone && <span>{job.customers.phone}</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Checklist */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Liste de tâches</h2>
                  {checklist.length > 0 && <p className="text-xs text-gray-400">{doneCount}/{checklist.length} terminée(s)</p>}
                </div>
              </div>

              {checklist.length > 0 && (
                <div className="px-5 pt-3 pb-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full progress-fill" style={{ width: `${checkPct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-500">{checkPct.toFixed(0)}%</span>
                  </div>
                </div>
              )}

              <ul className="divide-y divide-gray-50 px-2">
                {checklist.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 px-3 py-3 group">
                    <button onClick={() => toggleCheckItem(item.id)} className="shrink-0 text-gray-400 hover:text-indigo-600 transition-colors">
                      {item.done ? <CheckSquare className="h-5 w-5 text-indigo-600" /> : <Square className="h-5 w-5" />}
                    </button>
                    <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
                    <button onClick={() => deleteCheckItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="flex gap-2 px-5 py-3 border-t border-gray-50">
                <input
                  type="text"
                  placeholder="Ajouter une tâche..."
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCheckItem() } }}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button onClick={addCheckItem} disabled={!newCheckItem.trim()} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Internal notes */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-amber-500" /> Notes internes
              </h2>
              {editMode ? (
                <textarea value={eNotes} onChange={(e) => setENotes(e.target.value)} placeholder="Notes visibles uniquement par votre équipe..." rows={4} className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
              ) : job.internal_notes ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.internal_notes}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">Aucune note. Modifiez l'intervention pour ajouter des notes.</p>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Invoice */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-500" /> Facture
              </h2>
              {invoiceLinked ? (
                <div className="rounded-xl bg-emerald-50 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900">{fmt(parseFloat(String(invoiceLinked.amount)))}</p>
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${invoiceLinked.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {invoiceLinked.status}
                    </span>
                  </div>
                  <Link href={`/invoices/${invoiceLinked.id}`} className="text-xs text-indigo-600 hover:underline">Voir la facture →</Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <DollarSign className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 mb-3">Aucune facture générée</p>
                  <button
                    onClick={generateInvoice}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />Créer une facture
                  </button>
                </div>
              )}
            </div>

            {/* Team assignment */}
            {team.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-500" /> Assigné à
                </h2>
                <select
                  value={job.assigned_to || ''}
                  onChange={(e) => assignMember(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Non assigné</option>
                  {team.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Job details */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Détails de l'intervention</h2>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Statut</dt>
                  <dd><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${scfg?.cls}`}>{tStatus(job.status)}</span></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Priorité</dt>
                  <dd className={`font-medium text-xs ${pcfg.cls}`}>{pcfg.label}</dd>
                </div>
                {job.scheduled_date && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Date</dt>
                    <dd className="font-medium text-gray-900 text-xs">{fmtDate(job.scheduled_date)}</dd>
                  </div>
                )}
                {job.start_time && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Heure</dt>
                    <dd className="font-medium text-gray-900 text-xs">{job.start_time}{job.end_time ? ` – ${job.end_time}` : ''}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">Créé</dt>
                  <dd className="font-medium text-gray-900 text-xs">{fmtDate(job.created_at)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
