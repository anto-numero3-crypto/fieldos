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

const STATUS_CFG: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  pending:   { bg: 'bg-amber-50 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-400',   icon: Clock },
  confirmed: { bg: 'bg-blue-50 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-400',    icon: CheckCircle },
  declined:  { bg: 'bg-gray-100 dark:bg-gray-800',   text: 'text-gray-600 dark:text-gray-400',    icon: XCircle },
  cancelled: { bg: 'bg-gray-100 dark:bg-gray-800',   text: 'text-gray-600 dark:text-gray-400',    icon: XCircle },
  completed: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: Check },
  no_show:   { bg: 'bg-red-50 dark:bg-red-900/30',     text: 'text-red-600 dark:text-red-400',     icon: AlertCircle },
}

function fmtDate(d: string, fr: boolean) {
  return new Date(d + 'T12:00:00').toLocaleDateString(fr ? 'fr-CA' : 'en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
}
function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}
function timeAgo(ts: string, fr: boolean) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return fr ? `il y a ${mins} min` : `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return fr ? `il y a ${hrs}h` : `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return fr ? `il y a ${days}j` : `${days}d ago`
}

export default function BookingsPage() {
  const { lang, t } = useLanguage()
  const fr = lang === 'fr'
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
        const labels: Record<string, string> = fr ? {
          confirm: 'Réservation confirmée !',
          decline: 'Réservation refusée.',
          cancel:  'Réservation annulée.',
          complete: 'R\u00e9servation compl\u00e9t\u00e9e.',
        } : {
          confirm: 'Booking confirmed!',
          decline: 'Booking declined.',
          cancel:  'Booking cancelled.',
          complete: 'Marked as completed.',
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
    <AppLayout title={fr ? 'Réservations' : 'Bookings'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <SkeletonKPICard key={i} />)}
        </div>
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} className="h-28" />)}
      </div>
    </AppLayout>
  )

  return (
    <AppLayout title={fr ? 'Réservations' : 'Bookings'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{fr ? 'Réservations' : 'Bookings'}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{fr ? 'Gérez les demandes de rendez-vous de vos clients' : 'Manage booking requests from your customers'}</p>
          </div>
          <Link href="/schedule/availability"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Calendar className="h-4 w-4" /> {fr ? 'Disponibilités' : 'Availability'}
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: fr ? 'En attente' : 'Pending', value: pending.length, color: 'text-amber-600', badge: pending.length > 0 },
            { label: fr ? "Confirmés aujourd'hui" : 'Confirmed today', value: confirmedToday, color: 'text-blue-600' },
            { label: fr ? 'Compl\u00e9t\u00e9s' : 'Completed', value: completedWeek, color: 'text-emerald-600' },
            { label: fr ? "Taux d'annulation" : 'Cancel rate', value: `${cancellationRate}%`, color: 'text-gray-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm px-4 py-3">
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
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{pending.length}</span>
              {fr ? 'En attente de confirmation' : 'Awaiting confirmation'}
            </h2>
            {pending.map((b) => (
              <div key={b.id} className="rounded-2xl border border-amber-100 dark:border-amber-900/50 bg-white dark:bg-gray-900 shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-lg">
                    {b.customer_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{b.customer_name}</p>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{b.service_name}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{timeAgo(b.created_at, fr)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {fmtDate(b.requested_date, fr)} {fr ? 'à' : 'at'} {fmtTime(b.requested_time)}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {b.customer_email}</span>
                      {b.customer_phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {b.customer_phone}</span>}
                    </div>
                    {b.notes && (
                      <div className="mt-2 flex items-start gap-1.5 text-sm text-gray-500 dark:text-gray-400">
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
                    {fr ? 'Accepter' : 'Accept'}
                  </button>
                  <button
                    onClick={() => setDecliningId(b.id)}
                    disabled={actioning === b.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60 transition-all"
                  >
                    <X className="h-4 w-4" /> {fr ? 'Refuser' : 'Decline'}
                  </button>
                </div>

                {/* Decline reason modal */}
                {decliningId === b.id && (
                  <div className="mt-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">{fr ? 'Raison du refus (optionnel)' : 'Decline reason (optional)'}</p>
                    <textarea
                      rows={2}
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder={fr ? 'ex. Créneau non disponible, service non offert dans votre secteur…' : 'e.g. Slot not available, service not offered in your area…'}
                      className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-900 dark:text-white focus:border-red-300 focus:outline-none resize-none mb-2"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => doAction(b.id, 'decline', declineReason)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors">{fr ? 'Confirmer le refus' : 'Confirm decline'}</button>
                      <button onClick={() => setDecliningId(null)}
                        className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">{fr ? 'Annuler' : 'Cancel'}</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state — no pending and no bookings at all */}
        {pending.length === 0 && bookings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <EmptyState
              icon={Clock}
              title={fr ? 'Aucune réservation en attente' : 'No pending bookings'}
              description={fr ? "Vous recevrez une notification quand un client réservera en ligne." : 'You will be notified when a customer books online.'}
            />
          </div>
        )}

        {/* ── All Bookings ── */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{fr ? 'Toutes les réservations' : 'All bookings'}</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder={fr ? 'Rechercher…' : 'Search…'}
                  className="h-9 w-36 pl-8 pr-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:w-48 transition-all"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <select value={statusFilter} onChange={(e) => {
                  setStatusFilter(e.target.value)
                  if (userId) load(userId, e.target.value)
                }}
                  className="h-9 appearance-none pl-8 pr-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/20">
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
            <div className="px-6 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
              {fr ? `Aucune réservation${search ? ' correspondant à votre recherche' : ''}.` : `No bookings${search ? ' matching your search' : ''}.`}
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {paged.map((b) => {
                const cfg = STATUS_CFG[b.status] || STATUS_CFG.pending
                const Icon = cfg.icon
                return (
                  <div key={b.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                      {b.customer_name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{b.customer_name}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          <Icon className="h-3 w-3" />{tStatus(b.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-indigo-600 dark:text-indigo-400">{b.service_name}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{fmtDate(b.requested_date, fr)} · {fmtTime(b.requested_time)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {b.status === 'pending' && (
                        <>
                          <button onClick={() => openAccept(b)} title={fr ? 'Accepter' : 'Accept'}
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDecliningId(b.id)} title={fr ? 'Refuser' : 'Decline'}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {b.status === 'confirmed' && (
                        <button onClick={() => doAction(b.id, 'complete')} title={fr ? 'Marquer comme compl\u00e9t\u00e9e' : 'Mark completed'}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {b.converted_to_job_id && (
                        <Link href={`/jobs/${b.converted_to_job_id}`} title={fr ? 'Voir le travail' : 'View job'}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <Briefcase className="h-4 w-4" />
                        </Link>
                      )}
                      <a href={`/booking/cancel/${b.token}`} target="_blank" rel="noopener noreferrer"
                        title={fr ? 'Page publique' : 'Public page'} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    {b.service_price && (
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0 ml-2">
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
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{fr ? 'Accepter et assigner' : 'Accept and assign'}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {acceptingBooking.customer_name} · {acceptingBooking.service_name}<br />
                {fmtDate(acceptingBooking.requested_date, fr)} {fr ? 'à' : 'at'} {fmtTime(acceptingBooking.requested_time)}
              </p>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{fr ? 'Assigner à' : 'Assign to'}</label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 mb-4"
              >
                <option value="">{fr ? 'Non assigné' : 'Unassigned'}</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button onClick={submitAccept}
                  className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
                  {fr ? 'Confirmer la réservation' : 'Confirm booking'}
                </button>
                <button onClick={() => setAcceptingBooking(null)}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  {fr ? 'Annuler' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Decline modal overlay (for table row actions) */}
        {decliningId && !pending.find((b) => b.id === decliningId) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDecliningId(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">{fr ? 'Refuser la réservation' : 'Decline the booking'}</h3>
              <textarea rows={3} value={declineReason} onChange={(e) => setDeclineReason(e.target.value)}
                placeholder={fr ? 'Raison du refus (optionnel)…' : 'Decline reason (optional)…'}
                className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-400/20 resize-none mb-3" />
              <div className="flex gap-2">
                <button onClick={() => doAction(decliningId, 'decline', declineReason)}
                  className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">{fr ? 'Refuser' : 'Decline'}</button>
                <button onClick={() => setDecliningId(null)}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">{fr ? 'Annuler' : 'Cancel'}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
