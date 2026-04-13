'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import EmptyState from '@/components/EmptyState'
import { SkeletonListRow } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import {
  Bell, Calendar, CheckCircle, DollarSign, AlertCircle, UserPlus,
  Briefcase, XCircle, Clock, Info, AlertTriangle, ChevronLeft, ChevronRight,
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  body?: string | null
  type: string
  read: boolean
  link?: string | null
  created_at: string
}

const TYPE_ICON: Record<string, { Icon: React.ComponentType<{ className?: string }>; bg: string; fg: string; label: string }> = {
  booking_request:   { Icon: Calendar,    bg: 'bg-amber-50',   fg: 'text-amber-600',   label: 'Réservation' },
  booking_confirmed: { Icon: CheckCircle, bg: 'bg-emerald-50', fg: 'text-emerald-600', label: 'Réservation' },
  invoice_paid:      { Icon: DollarSign,  bg: 'bg-emerald-50', fg: 'text-emerald-600', label: 'Paiement' },
  invoice_overdue:   { Icon: AlertCircle, bg: 'bg-red-50',     fg: 'text-red-600',     label: 'Facture' },
  new_customer:      { Icon: UserPlus,    bg: 'bg-blue-50',    fg: 'text-blue-600',    label: 'Client' },
  job_completed:     { Icon: Briefcase,   bg: 'bg-emerald-50', fg: 'text-emerald-600', label: 'Emploi' },
  payment_failed:    { Icon: XCircle,     bg: 'bg-red-50',     fg: 'text-red-600',     label: 'Paiement' },
  trial_ending:      { Icon: Clock,       bg: 'bg-orange-50',  fg: 'text-orange-600',  label: 'Essai' },
  success:           { Icon: CheckCircle, bg: 'bg-emerald-50', fg: 'text-emerald-600', label: 'Succès' },
  error:             { Icon: AlertCircle, bg: 'bg-red-50',     fg: 'text-red-600',     label: 'Erreur' },
  warning:           { Icon: AlertTriangle, bg: 'bg-amber-50', fg: 'text-amber-600',   label: 'Alerte' },
  info:              { Icon: Info,        bg: 'bg-blue-50',    fg: 'text-blue-600',    label: 'Info' },
}
const FILTER_TYPES: Array<{ value: string; label: string }> = [
  { value: 'all',               label: 'Tous les types' },
  { value: 'booking_request',   label: 'Réservations' },
  { value: 'invoice_paid',      label: 'Paiements reçus' },
  { value: 'invoice_overdue',   label: 'Factures en retard' },
  { value: 'new_customer',      label: 'Nouveaux clients' },
  { value: 'job_completed',     label: 'Emplois complétés' },
  { value: 'payment_failed',    label: 'Paiements échoués' },
  { value: 'trial_ending',      label: 'Essai' },
]

const PAGE_SIZE = 25

const timeAgo = (date: string) => {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (secs < 60) return "à l'instant"
  if (secs < 3600) return `il y a ${Math.floor(secs / 60)} min`
  if (secs < 86400) return `il y a ${Math.floor(secs / 3600)} h`
  return `il y a ${Math.floor(secs / 86400)} j`
}

export default function NotificationsPage() {
  const [items, setItems]     = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId]   = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all')
  const [page, setPage]       = useState(0)
  const confirm = useConfirm()

  const load = useCallback(async (uid: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(500)
    setItems(((data || []) as Notification[]))
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      setUserId(data.user.id)
      load(data.user.id)
    })
  }, [load])

  const filtered = items.filter((n) => {
    if (filterType !== 'all' && n.type !== filterType) return false
    if (filterRead === 'unread' && n.read) return false
    if (filterRead === 'read' && !n.read) return false
    return true
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => { setPage(0) }, [filterType, filterRead])

  const markAllRead = async () => {
    if (!userId) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success('Toutes les notifications marquées comme lues')
  }

  const markOne = async (n: Notification) => {
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id)
      setItems((prev) => prev.map((p) => p.id === n.id ? { ...p, read: true } : p))
    }
    if (n.link) window.location.href = n.link
  }

  const deleteOld = async () => {
    if (!userId) return
    const { confirmed } = await confirm({
      title: 'Supprimer les anciennes notifications ?',
      description: 'Toutes les notifications de plus de 30 jours seront supprimées définitivement.',
      confirmLabel: 'Supprimer',
    })
    if (!confirmed) return
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString()
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoff)
    if (error) { toast.error(error.message); return }
    setItems((prev) => prev.filter((n) => n.created_at >= cutoff))
    toast.success('Anciennes notifications supprimées')
  }

  const unreadCount = items.filter((n) => !n.read).length

  return (
    <AppLayout title="Notifications">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5">
        {/* Header / actions */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-0.5">{items.length} au total · {unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Tout marquer comme lu
              </button>
            )}
            <button onClick={deleteOld} className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              Supprimer les anciennes
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {FILTER_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <div className="inline-flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {(['all', 'unread', 'read'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilterRead(k)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${filterRead === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {k === 'all' ? 'Toutes' : k === 'unread' ? 'Non lues' : 'Lues'}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonListRow key={i} />)}</div>
        ) : pageItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white">
            <EmptyState
              icon={Bell}
              title="Aucune notification"
              description={items.length === 0 ? "Vos alertes apparaîtront ici dès qu'il se passera quelque chose dans votre compte." : 'Aucune notification ne correspond à vos filtres.'}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden divide-y divide-gray-50">
            {pageItems.map((n) => {
              const cfg = TYPE_ICON[n.type] || TYPE_ICON.info
              return (
                <button
                  key={n.id}
                  onClick={() => markOne(n)}
                  className={`w-full flex items-start gap-3 px-5 py-4 hover:bg-gray-50 text-left transition-colors ${!n.read ? 'bg-indigo-50/40' : ''}`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                    <cfg.Icon className={`h-4 w-4 ${cfg.fg}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                      <span className="text-[10px] uppercase tracking-wider rounded-full bg-gray-100 text-gray-500 px-2 py-0.5">{cfg.label}</span>
                    </div>
                    {n.body && <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>}
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="mt-2 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />}
                </button>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">Page {page + 1} sur {totalPages} · {filtered.length} notifications</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Quick link back */}
        <div className="text-center pt-2">
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">← Retour au tableau de bord</Link>
        </div>
      </div>
    </AppLayout>
  )
}
