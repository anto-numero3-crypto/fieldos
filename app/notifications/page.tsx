'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import EmptyState from '@/components/EmptyState'
import { SkeletonListRow } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/LanguageContext'
import {
  Bell, Calendar, CheckCircle, DollarSign, AlertCircle, UserPlus,
  Briefcase, XCircle, Clock, Info, AlertTriangle,
} from 'lucide-react'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/lib/hooks/usePagination'

interface Notification {
  id: string
  title: string
  body?: string | null
  type: string
  read: boolean
  link?: string | null
  created_at: string
}

type IconMap = Record<string, { Icon: React.ComponentType<{ className?: string }>; bg: string; fg: string; label: string }>

function getTypeIcon(fr: boolean): IconMap {
  return {
    booking_request:   { Icon: Calendar,    bg: 'bg-amber-50',   fg: 'text-amber-600',   label: fr ? 'Réservation' : 'Booking' },
    booking_confirmed: { Icon: CheckCircle, bg: 'bg-emerald-50', fg: 'text-emerald-600', label: fr ? 'Réservation' : 'Booking' },
    invoice_paid:      { Icon: DollarSign,  bg: 'bg-emerald-50', fg: 'text-emerald-600', label: fr ? 'Paiement' : 'Payment' },
    invoice_overdue:   { Icon: AlertCircle, bg: 'bg-red-50',     fg: 'text-red-600',     label: fr ? 'Facture' : 'Invoice' },
    new_customer:      { Icon: UserPlus,    bg: 'bg-blue-50',    fg: 'text-blue-600',    label: fr ? 'Client' : 'Customer' },
    job_completed:     { Icon: Briefcase,   bg: 'bg-emerald-50', fg: 'text-emerald-600', label: fr ? 'Intervention' : 'Job' },
    payment_failed:    { Icon: XCircle,     bg: 'bg-red-50',     fg: 'text-red-600',     label: fr ? 'Paiement' : 'Payment' },
    trial_ending:      { Icon: Clock,       bg: 'bg-orange-50',  fg: 'text-orange-600',  label: fr ? 'Essai' : 'Trial' },
    success:           { Icon: CheckCircle, bg: 'bg-emerald-50', fg: 'text-emerald-600', label: fr ? 'Succès' : 'Success' },
    error:             { Icon: AlertCircle, bg: 'bg-red-50',     fg: 'text-red-600',     label: fr ? 'Erreur' : 'Error' },
    warning:           { Icon: AlertTriangle, bg: 'bg-amber-50', fg: 'text-amber-600',   label: fr ? 'Alerte' : 'Alert' },
    info:              { Icon: Info,        bg: 'bg-blue-50',    fg: 'text-blue-600',    label: 'Info' },
  }
}

function getFilterTypes(fr: boolean): Array<{ value: string; label: string }> {
  return [
    { value: 'all',               label: fr ? 'Tous les types' : 'All types' },
    { value: 'booking_request',   label: fr ? 'Réservations' : 'Bookings' },
    { value: 'invoice_paid',      label: fr ? 'Paiements reçus' : 'Payments received' },
    { value: 'invoice_overdue',   label: fr ? 'Factures en retard' : 'Overdue invoices' },
    { value: 'new_customer',      label: fr ? 'Nouveaux clients' : 'New customers' },
    { value: 'job_completed',     label: fr ? 'Interventions complétées' : 'Completed jobs' },
    { value: 'payment_failed',    label: fr ? 'Paiements échoués' : 'Failed payments' },
    { value: 'trial_ending',      label: fr ? 'Essai' : 'Trial' },
  ]
}

const timeAgoFr = (date: string) => {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (secs < 60) return "à l'instant"
  if (secs < 3600) return `il y a ${Math.floor(secs / 60)} min`
  if (secs < 86400) return `il y a ${Math.floor(secs / 3600)} h`
  return `il y a ${Math.floor(secs / 86400)} j`
}
const timeAgoEn = (date: string) => {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)} h ago`
  return `${Math.floor(secs / 86400)} d ago`
}

export default function NotificationsPage() {
  const [items, setItems]     = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId]   = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all')
  const confirm = useConfirm()
  const { lang, t } = useLanguage()
  const fr = lang === 'fr'
  const TYPE_ICON = getTypeIcon(fr)
  const FILTER_TYPES = getFilterTypes(fr)
  const timeAgo = fr ? timeAgoFr : timeAgoEn

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
  const { page, setPage, range, pageSize, reset: resetPage } = usePagination(filtered.length)
  const pageItems = filtered.slice(range.from, range.to)

  useEffect(() => { resetPage() }, [filterType, filterRead, resetPage])

  const markAllRead = async () => {
    if (!userId) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success(t.success.updated)
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
      title: fr ? 'Supprimer les anciennes notifications ?' : 'Delete old notifications?',
      description: fr
        ? 'Toutes les notifications de plus de 30 jours seront supprimées définitivement.'
        : 'All notifications older than 30 days will be permanently deleted.',
      confirmLabel: fr ? 'Supprimer' : 'Delete',
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
    toast.success(t.success.deleted)
  }

  const unreadCount = items.filter((n) => !n.read).length

  return (
    <AppLayout title={fr ? 'Notifications' : 'Notifications'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5">
        {/* Header / actions */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{fr ? 'Notifications' : 'Notifications'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {fr
                ? `${items.length} au total · ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
                : `${items.length} total · ${unreadCount} unread`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                {fr ? 'Tout marquer comme lu' : 'Mark all as read'}
              </button>
            )}
            <button onClick={deleteOld} className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              {fr ? 'Supprimer les anciennes' : 'Delete old'}
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
                {k === 'all' ? (fr ? 'Toutes' : 'All') : k === 'unread' ? (fr ? 'Non lues' : 'Unread') : (fr ? 'Lues' : 'Read')}
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
              title={fr ? 'Aucune notification' : 'No notifications'}
              description={items.length === 0
                ? (fr ? "Vos alertes apparaîtront ici dès qu'il se passera quelque chose dans votre compte." : 'Your alerts will appear here as soon as something happens in your account.')
                : (fr ? 'Aucune notification ne correspond à vos filtres.' : 'No notifications match your filters.')}
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

        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        </div>

        {/* Quick link back */}
        <div className="text-center pt-2">
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">← {fr ? 'Retour au tableau de bord' : 'Back to dashboard'}</Link>
        </div>
      </div>
    </AppLayout>
  )
}
