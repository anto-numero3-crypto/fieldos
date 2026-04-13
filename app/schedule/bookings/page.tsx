'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/lib/hooks/usePagination'
import { supabase } from '../../supabase'
import AppLayout from '@/components/AppLayout'
import EmptyState from '@/components/EmptyState'
import { SkeletonCard, SkeletonKPICard } from '@/components/ui/skeleton'
import { useLanguage } from '@/lib/LanguageContext'
import { toast } from 'sonner'
import {
  CheckCircle, XCircle, Clock, Calendar, User, Phone, Mail,
  MessageSquare, Briefcase, Filter, Search, ChevronDown,
  ExternalLink, Check, X, AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface Booking {
  id: string
  token: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_address: string | null
  service_name: string
  service_price: number | null
  requested_date: string
  requested_time: string
  requested_end_time: string | null
  duration_minutes: number
  notes: string | null
  status: string
  auto_accepted: boolean
  confirmed_at: string | null
  declined_at: string | null
  cancelled_at: string | null
  converted_to_job_id: string | null
  created_at: string
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  pending:   { label: 'En attente',  bg: 'bg-amber-50',   text: 'text-amber-700',   icon: Clock },
  confirmed: { label: 'Confirmé',    bg: 'bg-blue-50',    text: 'text-blue-700',    icon: CheckCircle },
  declined:  { label: 'Refusé',      bg: 'bg-gray-100',   text: 'text-gray-600',    icon: XCircle },
  cancelled: { label: 'Annulé',      bg: 'bg-gray-100',   text: 'text-gray-600',    icon: XCircle },
  completed: { label: 'Terminé',     bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Check },
  no_show:   { label: 'Absent',      bg: 'bg-red-50',     text: 'text-red-600',     icon: AlertCircle },
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-CA', { weekday: 'short', month: 'short', day: 'numeric' })
}
function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}
function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `il y a ${hrs}h`
  return `il y a ${Math.floor(hrs / 24)}j`
}

export default function BookingsPage() {
  const { lang, t } = useLanguage()
  const tStatus = (k: string) => (t.status as Record<string, string>)[k] || k
  const [userId, setUserId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [actioning, setActioning] = useState<string | null>(null)

  // Decline modal
  const [decliningId, setDecliningId] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')

  // Accept + assign modal
  const [team, setTeam] = useState<{ id: string; name: string }[]>([])
  const [acceptingBooking, setAcceptingBooking] = useState<Booking | null>(null)
  const [assignTo, setAssignTo] = useState<string>('')

  const load = useCallback(async (uid: string, status = 'all') => {
    const res = await fetch(`/api/bookings?userId=${uid}&status=${status}`)
    const data = await res.json()
    setBookings(data.bookings || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      setUserId(data.user.id)
      load(data.user.id)
      const { data: tm } = await supabase
        .from('team_members')
        .select('id, name')
        .eq('owner_user_id', data.user.id)
        .eq('is_active', true)
        .order('name')
      setTeam(tm || [])
    })
  }, [load])

  const openAccept = (b: Booking) => {
    if (team.length === 0) {
      doAction(b.id, 'confirm')
    } else {
      setAcceptingBooking(b)
      setAssignTo('')
    }
  }
  const submitAccept = async () => {
    if (!acceptingBooking) return
    const b = acceptingBooking
    setAcceptingBooking(null)
    await doAction(b.id, 'confirm', undefined, assignTo || null)
  }

  const doAction = async (id: string, action: string, reason?: string, assignedTo?: string | null) => {
    if (!userId) return
    setActioning(id)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason, userId, assignedTo: assignedTo || null }),
      })
      const data = await res.json()
      if (data.success) {
        const labels: Record<string, string> = {
          confirm: 'Réservation confirmée !',
          decline: 'Réservation refusée.',
          cancel:  'Réservation annulée.',
          complete: 'Marqué comme terminé.',
        }
        toast.success(labels[action] || t.success.updated)
        load(userId, statusFilter)
      } else {
        toast.error(data.error || t.errors.unknown)
      }
    } catch {
      toast.error(t.errors.networkError)
    }
    setActioning(null)
    setDecliningId(null)
    setDeclineReason('')
  }

  const pending = useMemo(() => bookings.filter((b) => b.status === 'pending'), [bookings])
  const filtered = useMemo(() => bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (search && !b.customer_name.toLowerCase().includes(search.toLowerCase()) &&
        !b.service_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [bookings, statusFilter, search])

  const { page, setPage, range, pageSize, reset: resetPage } = usePagination(filtered.length)
  const paged = useMemo(() => filtered.slice(range.from, range.to), [filtered, range.from, range.to])
  useEffect(() => { resetPage() }, [statusFilter, search, resetPage])

  // Stats
  const today = new Date().toISOString().slice(0, 10)
  const confirmedToday  = bookings.filter((b) => b.status === 'confirmed' && b.requested_date === today).length
  const completedWeek   = bookings.filter((b) => b.status === 'completed').length
  const totalDone = bookings.filter((b) => ['completed', 'no_show', 'cancelled'].includes(b.status)).length
  const cancelledCount  = bookings.filter((b) => b.status === 'cancelled').length
  const cancellationRate = totalDone > 0 ? Math.round((cancelledCount / totalDone) * 100) : 0

  if (loading) return (
    <AppLayout title="Réservations">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <SkeletonKPICard key={i} />)}
        </div>
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} className="h-28" />)}
      </div>
    </AppLayout>
  )

  return (
    <AppLayout title="Réservations">
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gérez les demandes de rendez-vous de vos clients</p>
          </div>
          <Link href="/schedule/availability"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Calendar className="h-4 w-4" /> Disponibilités
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'En attente', value: pending.length, color: 'text-amber-600', badge: pending.length > 0 },
            { label: 'Confirmés aujourd\'hui', value: confirmedToday, color: 'text-blue-600' },
            { label: 'Terminés', value: completedWeek, color: 'text-emerald-600' },
            { label: 'Taux d\'annulation', value: `${cancellationRate}%`, color: 'text-gray-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-3">
              <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                {s.badge && <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
              </div>
            </div>
          ))}
        </div>

        {/* ── Pending Requests ── */}
        {pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{pending.length}</span>
              En attente de confirmation
            </h2>
            {pending.map((b) => (
              <div key={b.id} className="rounded-2xl border border-amber-100 bg-white shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-lg">
                    {b.customer_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{b.customer_name}</p>
                        <p className="text-sm text-indigo-600 font-medium">{b.service_name}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{timeAgo(b.created_at)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {fmtDate(b.requested_date)} à {fmtTime(b.requested_time)}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {b.customer_email}</span>
                      {b.customer_phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {b.customer_phone}</span>}
                    </div>
                    {b.notes && (
                      <div className="mt-2 flex items-start gap-1.5 text-sm text-gray-500">
                        <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span className="italic">&ldquo;{b.notes}&rdquo;</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openAccept(b)}
                    disabled={actioning === b.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-sm"
                  >
                    {actioning === b.id ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check className="h-4 w-4" />}
                    Accepter
                  </button>
                  <button
                    onClick={() => setDecliningId(b.id)}
                    disabled={actioning === b.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60 transition-all"
                  >
                    <X className="h-4 w-4" /> Refuser
                  </button>
                </div>

                {/* Decline reason modal */}
                {decliningId === b.id && (
                  <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">Raison du refus (optionnel)</p>
                    <textarea
                      rows={2}
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="ex. Créneau non disponible, service non offert dans votre secteur…"
                      className="block w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:border-red-300 focus:outline-none resize-none mb-2"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => doAction(b.id, 'decline', declineReason)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors">Confirmer le refus</button>
                      <button onClick={() => setDecliningId(null)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state — no pending and no bookings at all */}
        {pending.length === 0 && bookings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white">
            <EmptyState
              icon={Clock}
              title="Aucune réservation en attente"
              description="Vous recevrez une notification quand un client réservera en ligne."
            />
          </div>
        )}

        {/* ── All Bookings ── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Toutes les réservations</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="h-8 w-36 pl-8 pr-2 rounded-lg border border-gray-200 bg-gray-50 text-xs focus:border-indigo-500 focus:outline-none focus:w-48 transition-all"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <select value={statusFilter} onChange={(e) => {
                  setStatusFilter(e.target.value)
                  if (userId) load(userId, e.target.value)
                }}
                  className="h-8 appearance-none pl-8 pr-6 rounded-lg border border-gray-200 bg-gray-50 text-xs focus:border-indigo-500 focus:outline-none">
                  <option value="all">{lang === 'fr' ? 'Tous' : 'All'}</option>
                  <option value="pending">{tStatus('pending')}</option>
                  <option value="confirmed">{tStatus('confirmed')}</option>
                  <option value="declined">{tStatus('declined')}</option>
                  <option value="cancelled">{tStatus('cancelled')}</option>
                  <option value="completed">{tStatus('completed')}</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              Aucune réservation{search ? ' correspondant à votre recherche' : ''}.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {paged.map((b) => {
                const cfg = STATUS_CFG[b.status] || STATUS_CFG.pending
                const Icon = cfg.icon
                return (
                  <div key={b.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-semibold text-sm">
                      {b.customer_name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 truncate">{b.customer_name}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          <Icon className="h-3 w-3" />{tStatus(b.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-indigo-600">{b.service_name}</span>
                        <span className="text-xs text-gray-400">{fmtDate(b.requested_date)} · {fmtTime(b.requested_time)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {b.status === 'pending' && (
                        <>
                          <button onClick={() => openAccept(b)} title="Accepter"
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDecliningId(b.id)} title="Refuser"
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {b.status === 'confirmed' && (
                        <button onClick={() => doAction(b.id, 'complete')} title="Marquer terminé"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {b.converted_to_job_id && (
                        <Link href={`/jobs/${b.converted_to_job_id}`} title="Voir le travail"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
                          <Briefcase className="h-4 w-4" />
                        </Link>
                      )}
                      <a href={`/booking/cancel/${b.token}`} target="_blank" rel="noopener noreferrer"
                        title="Page publique" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    {b.service_price && (
                      <span className="text-sm font-semibold text-gray-700 shrink-0 ml-2">
                        CA${parseFloat(String(b.service_price)).toFixed(2)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        </div>

        {/* Accept + assign modal */}
        {acceptingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setAcceptingBooking(null)}>
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Accepter et assigner</h3>
              <p className="text-xs text-gray-500 mb-4">
                {acceptingBooking.customer_name} · {acceptingBooking.service_name}<br />
                {fmtDate(acceptingBooking.requested_date)} à {fmtTime(acceptingBooking.requested_time)}
              </p>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Assigner à</label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 mb-4"
              >
                <option value="">Non assigné</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button onClick={submitAccept}
                  className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
                  Confirmer la réservation
                </button>
                <button onClick={() => setAcceptingBooking(null)}
                  className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Decline modal overlay (for table row actions) */}
        {decliningId && !pending.find((b) => b.id === decliningId) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDecliningId(null)}>
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Refuser la réservation</h3>
              <textarea rows={3} value={declineReason} onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Raison du refus (optionnel)…"
                className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-300 focus:outline-none resize-none mb-3" />
              <div className="flex gap-2">
                <button onClick={() => doAction(decliningId, 'decline', declineReason)}
                  className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">Refuser</button>
                <button onClick={() => setDecliningId(null)}
                  className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
