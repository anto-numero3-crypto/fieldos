'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'
import { toast } from 'sonner'
import AppLayout from '@/components/AppLayout'
import { SkeletonText, SkeletonChart, SkeletonKPICard, SkeletonListRow } from '@/components/ui/skeleton'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtMoney, fmtDate } from '@/lib/format'
import {
  Users, Briefcase, FileText, DollarSign, TrendingUp, ArrowRight,
  Plus, Sparkles, Clock, CheckCircle, AlertCircle, Calendar,
  ArrowUpRight, Zap, Target, Activity,
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid,
  BarChart, Bar, YAxis,
} from 'recharts'

interface Stats {
  customers: number; totalJobs: number; activeJobs: number
  completedJobs: number; totalInvoiced: number; paidAmount: number
  unpaidAmount: number; unpaidCount: number; overdueCount: number
  revenueThisMonth: number; revenueLastMonth: number
  jobsThisMonth: number; newCustomersThisMonth: number
  jobsToday: number; pendingBookings: number
}
interface Job {
  id: string; title: string; status: string
  scheduled_date: string | null; start_time?: string | null; service_address?: string | null
  customers: { name: string; phone?: string | null } | null
  priority?: string
}
interface Invoice {
  id: string; amount: number; status: string
  due_date: string | null; customers: { name: string } | null; created_at: string
  paid_at?: string | null
  invoice_number?: string; token?: string
}
interface ActivityItem {
  id: string
  kind: 'booking' | 'invoice_paid' | 'job_complete' | 'new_customer'
  text: string
  href: string
  at: string
}
interface OverdueInvoice {
  id: string; amount: number; due_date: string | null
  customers: { name: string; email: string | null } | null
  invoice_number?: string; token?: string
}

const statusClass: Record<string, string> = {
  scheduled:   'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  complete:    'bg-emerald-50 text-emerald-700',
  cancelled:   'bg-gray-50 text-gray-500',
  unpaid:      'bg-amber-50 text-amber-700',
  paid:        'bg-emerald-50 text-emerald-700',
  overdue:     'bg-red-50 text-red-700',
}

// Build the last 12 months' revenue from PAID invoices (using paid_at).
// Month abbreviations on the X-axis. $0 bars for months with no data.
const FR_MONTHS = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function buildMonthlyRevenue(invoices: Invoice[], fr: boolean) {
  const labels = fr ? FR_MONTHS : EN_MONTHS
  const months: { key: string; label: string; revenue: number }[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({ key, label: labels[d.getMonth()], revenue: 0 })
  }
  const idx = new Map(months.map((m, i) => [m.key, i]))
  for (const inv of invoices) {
    if (inv.status !== 'paid') continue
    const ts = inv.paid_at || inv.created_at
    if (!ts) continue
    const d = new Date(ts)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const i = idx.get(key)
    if (i !== undefined) months[i].revenue += parseFloat(String(inv.amount))
  }
  return months.map((m) => ({ month: m.label, revenue: m.revenue }))
}

function timeAgo(iso: string, fr: boolean): string {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return fr ? "à l'instant" : 'just now'
  if (m < 60) return fr ? `il y a ${m} min` : `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return fr ? `il y a ${h} h` : `${h} h ago`
  const d = Math.floor(h / 24)
  return fr ? `il y a ${d} j` : `${d} d ago`
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-gray-900">${payload[0].value.toLocaleString('en', { minimumFractionDigits: 0 })}</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [stats, setStats] = useState<Stats>({
    customers: 0, totalJobs: 0, activeJobs: 0, completedJobs: 0,
    totalInvoiced: 0, paidAmount: 0, unpaidAmount: 0, unpaidCount: 0, overdueCount: 0,
    revenueThisMonth: 0, revenueLastMonth: 0, jobsThisMonth: 0, newCustomersThisMonth: 0,
    jobsToday: 0, pendingBookings: 0,
  })
  const [todayJobs, setTodayJobs]           = useState<Job[]>([])
  const [recentJobs, setRecentJobs]         = useState<Job[]>([])
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [chartData, setChartData]           = useState<{ month: string; revenue: number }[]>([])
  const [activity, setActivity]             = useState<ActivityItem[]>([])
  const [overdueList, setOverdueList]       = useState<OverdueInvoice[]>([])
  const [loading, setLoading]               = useState(true)
  const [reminderSending, setReminderSending] = useState<string | null>(null)
  const { lang, t } = useLanguage()
  const fr = lang === 'fr'
  const tStatus = (key: string) => (t.status as Record<string, string>)[key] || key

  const init = useCallback(async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { window.location.href = '/login'; return }
    setUser(data.user)

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const todayStr = now.toISOString().split('T')[0]

    const [
      { count: customerCount },
      { count: newCustomers },
      { count: jobsTodayCount },
      { count: pendingBookings },
      { data: jobs },
      { data: invoices },
      { data: bookings },
      { data: recentNewCustomers },
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('user_id', data.user.id),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('user_id', data.user.id).gte('created_at', thisMonthStart),
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', data.user.id).eq('scheduled_date', todayStr),
      supabase.from('booking_requests').select('*', { count: 'exact', head: true }).eq('user_id', data.user.id).eq('status', 'pending'),
      supabase.from('jobs').select('id, title, status, scheduled_date, start_time, service_address, priority, customers(name, phone)').eq('user_id', data.user.id).order('created_at', { ascending: false }).limit(100),
      supabase.from('invoices').select('id, amount, status, due_date, customers(name, email), created_at, paid_at, invoice_number, token').eq('user_id', data.user.id).order('created_at', { ascending: false }).limit(500),
      supabase.from('booking_requests').select('id, customer_name, status, created_at').eq('user_id', data.user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('customers').select('id, name, created_at').eq('user_id', data.user.id).order('created_at', { ascending: false }).limit(20),
    ])

    const allInvoices = (invoices || []) as unknown as Invoice[]
    const allJobs     = (jobs || []) as unknown as Job[]

    const totalInvoiced = allInvoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0)
    const paidAmount    = allInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
    // Unpaid = anything not paid (covers 'unpaid', 'sent', 'viewed', 'overdue').
    const unpaidStatuses = new Set(['unpaid', 'sent', 'viewed', 'overdue'])
    const unpaidAmount   = allInvoices.filter((i) => unpaidStatuses.has(i.status)).reduce((s, i) => s + parseFloat(String(i.amount)), 0)
    const unpaidCount    = allInvoices.filter((i) => unpaidStatuses.has(i.status)).length
    const overdueCount   = allInvoices.filter((i) => i.status === 'overdue').length
    const activeJobs     = allJobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress').length
    const completedJobs  = allJobs.filter((j) => j.status === 'complete').length

    // Revenue from PAID invoices using paid_at (falls back to created_at if missing).
    const paidInWindow = (since: string, until?: string) =>
      allInvoices.filter((i) => {
        if (i.status !== 'paid') return false
        const ts = i.paid_at || i.created_at
        if (!ts) return false
        if (ts < since) return false
        if (until && ts >= until) return false
        return true
      }).reduce((s, i) => s + parseFloat(String(i.amount)), 0)
    const revenueThisMonth = paidInWindow(thisMonthStart)
    const revenueLastMonth = paidInWindow(lastMonthStart, thisMonthStart)

    const jobsThisMonth = allJobs.filter((j) => {
      const d = j.scheduled_date || ''
      return d >= thisMonthStart.split('T')[0]
    }).length

    setStats({
      customers: customerCount || 0, totalJobs: allJobs.length, activeJobs, completedJobs,
      totalInvoiced, paidAmount, unpaidAmount, unpaidCount, overdueCount,
      revenueThisMonth, revenueLastMonth, jobsThisMonth,
      newCustomersThisMonth: newCustomers || 0,
      jobsToday: jobsTodayCount || 0,
      pendingBookings: pendingBookings || 0,
    })

    // Today's jobs sorted by start_time
    const todayJobsSorted = allJobs
      .filter((j) => j.scheduled_date === todayStr)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
    setTodayJobs(todayJobsSorted)

    setRecentJobs(allJobs.slice(0, 6))
    setRecentInvoices(allInvoices.slice(0, 6))
    setChartData(buildMonthlyRevenue(allInvoices, lang === 'fr'))

    // ── Activity feed: merge bookings, paid invoices, completed jobs, new customers
    const isFr = lang === 'fr'
    const items: ActivityItem[] = []
    for (const b of (bookings as Array<{ id: string; customer_name: string; status: string; created_at: string }> | null) || []) {
      if (b.status === 'pending' || b.status === 'confirmed') {
        items.push({ id: `b-${b.id}`, kind: 'booking', text: isFr ? `Nouvelle réservation de ${b.customer_name}` : `New booking from ${b.customer_name}`, href: '/schedule/bookings', at: b.created_at })
      }
    }
    for (const inv of allInvoices) {
      if (inv.status === 'paid' && inv.paid_at) {
        const customer = inv.customers?.name || (isFr ? 'client' : 'customer')
        items.push({ id: `i-${inv.id}`, kind: 'invoice_paid', text: isFr ? `Facture payée par ${customer} — $${parseFloat(String(inv.amount)).toFixed(2)}` : `Invoice paid by ${customer} — $${parseFloat(String(inv.amount)).toFixed(2)}`, href: `/invoices/${inv.id}`, at: inv.paid_at })
      }
    }
    for (const j of allJobs) {
      if (j.status === 'complete') {
        items.push({ id: `j-${j.id}`, kind: 'job_complete', text: isFr ? `Emploi complété — ${j.customers?.name || j.title}` : `Job completed — ${j.customers?.name || j.title}`, href: `/jobs/${j.id}`, at: j.scheduled_date || '' })
      }
    }
    for (const c of (recentNewCustomers as Array<{ id: string; name: string; created_at: string }> | null) || []) {
      items.push({ id: `c-${c.id}`, kind: 'new_customer', text: isFr ? `Nouveau client — ${c.name}` : `New customer — ${c.name}`, href: `/customers/${c.id}`, at: c.created_at })
    }
    items.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
    setActivity(items.slice(0, 10))

    // ── Overdue invoices: explicit 'overdue' OR sent/viewed past due_date
    const overdue = allInvoices.filter((i) => {
      if (i.status === 'overdue') return true
      if ((i.status === 'sent' || i.status === 'viewed') && i.due_date && i.due_date < todayStr) return true
      return false
    }).slice(0, 10) as unknown as OverdueInvoice[]
    setOverdueList(overdue)

    setLoading(false)
  }, [lang])

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscribed') === 'true') {
      toast.success(lang === 'fr' ? 'Bienvenue ! Votre abonnement est actif.' : 'Welcome! Your subscription is now active.')
      const url = new URL(window.location.href)
      url.searchParams.delete('subscribed')
      url.searchParams.delete('session_id')
      window.history.replaceState({}, '', url.toString())
    }
  }, [lang])

  useEffect(() => {
    if (!user) return
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      const channel = supabase
        .channel('dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs',      filter: `user_id=eq.${data.user.id}` }, init)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices',  filter: `user_id=eq.${data.user.id}` }, init)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers', filter: `user_id=eq.${data.user.id}` }, init)
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fmt        = (n: number) => fmtMoney(n, lang).replace(/[,.]\d{2}\b/, '')
  const fmt2       = (n: number) => fmtMoney(n, lang)

  const sendReminder = async (inv: OverdueInvoice) => {
    if (!inv.customers?.email) return
    setReminderSending(inv.id)
    try {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment_reminder',
          to: inv.customers.email,
          customerName: inv.customers.name,
          invoiceNumber: inv.invoice_number || inv.id.slice(0, 8),
          amount: fmt2(inv.amount),
          dueDate: inv.due_date,
          paymentLink: inv.token ? `${window.location.origin}/invoice/${inv.token}` : undefined,
        }),
      })
    } finally {
      setReminderSending(null)
    }
  }
  const hour       = new Date().getHours()
  const greeting   = fr
    ? (hour < 12 ? 'Bonjour' : hour < 17 ? 'Bon après-midi' : 'Bonsoir')
    : (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening')
  const name       = user?.email?.split('@')[0] || ''
  const revenueΔ   = stats.revenueLastMonth > 0 ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100 : null
  const collectionRate = stats.totalInvoiced > 0 ? (stats.paidAmount / stats.totalInvoiced) * 100 : 0
  const completionRate = stats.totalJobs > 0 ? (stats.completedJobs / stats.totalJobs) * 100 : 0

  if (loading) return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <SkeletonText className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <SkeletonKPICard key={i} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2"><SkeletonChart className="h-72" /></div>
          <div className="space-y-3">
            <SkeletonText className="h-4 w-40 mb-3" />
            {[...Array(4)].map((_, i) => <SkeletonListRow key={i} />)}
          </div>
        </div>
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
              {fmtDate(new Date().toISOString().slice(0,10), lang)}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{greeting}, {name} 👋</h1>
            <p className="mt-1 text-sm text-gray-500">
              {stats.overdueCount > 0
                ? (fr
                    ? `⚠️ Vous avez ${stats.overdueCount} facture${stats.overdueCount > 1 ? 's' : ''} en retard qui nécessite${stats.overdueCount > 1 ? 'nt' : ''} votre attention.`
                    : `⚠️ You have ${stats.overdueCount} overdue invoice${stats.overdueCount > 1 ? 's' : ''} requiring your attention.`)
                : stats.activeJobs > 0
                ? (fr
                    ? `Vous avez ${stats.activeJobs} intervention${stats.activeJobs > 1 ? 's' : ''} en cours.`
                    : `You have ${stats.activeJobs} active job${stats.activeJobs > 1 ? 's' : ''}.`)
                : (fr ? `Voici un aperçu de votre activité aujourd'hui.` : `Here's an overview of your activity today.`)}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link href="/jobs" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
              <Plus className="h-4 w-4" /> {fr ? 'Nouvelle intervention' : 'New job'}
            </Link>
            <Link href="/invoices" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors">
              <Plus className="h-4 w-4" /> {fr ? 'Nouvelle facture' : 'New invoice'}
            </Link>
          </div>
        </div>

        {/* Alert banner */}
        {(stats.overdueCount > 0 || stats.unpaidCount > 0) && (
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 ${stats.overdueCount > 0 ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
            <AlertCircle className={`h-5 w-5 shrink-0 ${stats.overdueCount > 0 ? 'text-red-500' : 'text-amber-500'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${stats.overdueCount > 0 ? 'text-red-800' : 'text-amber-800'}`}>
                {stats.overdueCount > 0
                  ? (fr
                      ? `${stats.overdueCount} facture${stats.overdueCount > 1 ? 's' : ''} en retard — ${fmt(stats.unpaidAmount)} impayé${stats.unpaidAmount > 1 ? 's' : ''}`
                      : `${stats.overdueCount} overdue invoice${stats.overdueCount > 1 ? 's' : ''} — ${fmt(stats.unpaidAmount)} unpaid`)
                  : (fr
                      ? `${stats.unpaidCount} facture${stats.unpaidCount > 1 ? 's' : ''} en attente de paiement — ${fmt(stats.unpaidAmount)}`
                      : `${stats.unpaidCount} invoice${stats.unpaidCount > 1 ? 's' : ''} pending payment — ${fmt(stats.unpaidAmount)}`)}
              </p>
              <p className={`text-xs mt-0.5 ${stats.overdueCount > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                {fr ? 'Envoyez des rappels pour être payé plus vite' : 'Send reminders to get paid faster'}
              </p>
            </div>
            <Link href="/invoices" className={`shrink-0 text-xs font-semibold hover:underline ${stats.overdueCount > 0 ? 'text-red-700' : 'text-amber-700'}`}>
              {fr ? 'Voir les factures →' : 'View invoices →'}
            </Link>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: fr ? 'Revenus ce mois' : 'Revenue this month',
              value: fmt(stats.revenueThisMonth),
              icon: DollarSign, href: '/invoices',
              iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
              sub: revenueΔ !== null
                ? (fr
                    ? `${revenueΔ >= 0 ? '↑' : '↓'} ${Math.abs(revenueΔ).toFixed(0)}% vs mois dernier`
                    : `${revenueΔ >= 0 ? '↑' : '↓'} ${Math.abs(revenueΔ).toFixed(0)}% vs last month`)
                : (fr ? `${fmt(stats.paidAmount)} total encaissé` : `${fmt(stats.paidAmount)} total collected`),
              subColor: revenueΔ !== null ? (revenueΔ >= 0 ? 'text-emerald-600' : 'text-red-500') : 'text-gray-400',
              highlight: false,
              badge: null as string | null,
            },
            {
              title: fr ? "Emplois aujourd'hui" : "Today's jobs",
              value: stats.jobsToday.toString(),
              icon: Briefcase, href: '/jobs',
              iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
              sub: fr
                ? `${stats.jobsThisMonth} ce mois · ${stats.activeJobs} actives`
                : `${stats.jobsThisMonth} this month · ${stats.activeJobs} active`,
              subColor: 'text-gray-400',
              highlight: false,
              badge: null,
            },
            {
              title: fr ? 'Réservations en attente' : 'Pending bookings',
              value: stats.pendingBookings.toString(),
              icon: Calendar, href: '/schedule/bookings',
              iconBg: stats.pendingBookings > 0 ? 'bg-red-100' : 'bg-indigo-100',
              iconColor: stats.pendingBookings > 0 ? 'text-red-600' : 'text-indigo-600',
              sub: stats.pendingBookings > 0
                ? (fr ? 'À traiter rapidement' : 'Needs attention')
                : (fr ? 'Tout est à jour' : 'All caught up'),
              subColor: stats.pendingBookings > 0 ? 'text-red-500' : 'text-gray-400',
              highlight: stats.pendingBookings > 0,
              badge: stats.pendingBookings > 0 ? String(stats.pendingBookings) : null,
            },
            {
              title: fr ? 'Factures impayées' : 'Unpaid invoices',
              value: fmt(stats.unpaidAmount),
              icon: stats.overdueCount > 0 ? AlertCircle : Clock,
              href: '/invoices',
              iconBg: stats.overdueCount > 0 ? 'bg-red-100' : 'bg-amber-100',
              iconColor: stats.overdueCount > 0 ? 'text-red-600' : 'text-amber-600',
              sub: stats.overdueCount > 0
                ? (fr ? `${stats.overdueCount} en retard` : `${stats.overdueCount} overdue`)
                : (fr ? `${stats.unpaidCount} non payées` : `${stats.unpaidCount} unpaid`),
              subColor: stats.overdueCount > 0 ? 'text-red-500' : 'text-amber-500',
              highlight: stats.overdueCount > 0,
              badge: null,
            },
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={[
                'group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200',
                card.highlight ? 'border-red-200' : 'border-gray-100 hover:border-gray-200',
              ].join(' ')}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                  {card.badge && (
                    <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      {card.badge}
                    </span>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs font-medium text-gray-500 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{card.value}</p>
              <p className={`mt-1 text-xs font-medium ${card.subColor}`}>{card.sub}</p>
            </Link>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue chart — 12 months */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{fr ? 'Revenus' : 'Revenue'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{fr ? 'Encaissés · 12 derniers mois' : 'Collected · Last 12 months'}</p>
              </div>
              {revenueΔ !== null && (
                <div className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${revenueΔ >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {revenueΔ >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5 rotate-45" />}
                  {Math.abs(revenueΔ).toFixed(1)}% MoM
                </div>
              )}
            </div>
            {chartData.some((d) => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-44 rounded-xl bg-gray-50">
                <div className="text-center">
                  <TrendingUp className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{fr ? 'Le graphique apparaîtra une fois que vous aurez des factures payées' : 'The chart will appear once you have paid invoices'}</p>
                  <Link href="/invoices" className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:underline">{fr ? 'Créer une facture →' : 'Create an invoice →'}</Link>
                </div>
              </div>
            )}
          </div>

          {/* Job stats */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Performance</h2>
              <p className="text-xs text-gray-400 mt-0.5">{fr ? 'Depuis le début' : 'All time'}</p>
            </div>

            <div className="space-y-4">
              {[
                { label: fr ? 'Taux de complétion' : 'Completion rate', value: completionRate, color: 'bg-emerald-500', icon: Target },
                { label: fr ? 'Taux de recouvrement' : 'Collection rate', value: collectionRate, color: 'bg-indigo-500', icon: CheckCircle },
                { label: fr ? 'Charge active' : 'Active workload', value: stats.totalJobs > 0 ? (stats.activeJobs / stats.totalJobs) * 100 : 0, color: 'bg-blue-400', icon: Activity },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-600 flex items-center gap-1.5">
                      <row.icon className="h-3 w-3 text-gray-400" /> {row.label}
                    </span>
                    <span className="text-xs font-bold text-gray-900">{Math.round(row.value)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${row.color} transition-all duration-700`} style={{ width: `${Math.min(100, row.value)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto border-t border-gray-100 pt-4 grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
                <p className="text-xs text-gray-400">{fr ? 'Total interventions' : 'Total jobs'}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.customers}</p>
                <p className="text-xs text-gray-400">{fr ? 'Clients' : 'Customers'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's schedule */}
        {todayJobs.length > 0 && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-indigo-900">{fr ? 'Planning du jour' : "Today's schedule"}</h2>
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">{todayJobs.length}</span>
              </div>
              <Link href="/schedule" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                {fr ? 'Calendrier complet' : 'Full calendar'} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-indigo-100">
              {todayJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-indigo-50 transition-colors"
                >
                  <div className="shrink-0 w-14 text-sm font-bold text-indigo-700 tabular-nums">{job.start_time?.slice(0, 5) || '—'}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {job.customers?.name || (fr ? 'Sans client' : 'No customer')}
                      {job.service_address ? ` · ${job.service_address}` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[job.status] || ''}`}>
                    {tStatus(job.status)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{fr ? 'Actions rapides' : 'Quick actions'}</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { label: fr ? 'Nouveau client' : 'New customer',       href: '/customers', color: 'hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700', icon: Users },
              { label: fr ? 'Nouvelle intervention' : 'New job',     href: '/jobs',    color: 'hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700', icon: Briefcase },
              { label: fr ? 'Nouveau devis' : 'New quote',           href: '/quotes',   color: 'hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700', icon: FileText },
              { label: fr ? 'Nouvelle facture' : 'New invoice',      href: '/invoices', color: 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700', icon: DollarSign },
              { label: fr ? 'Calendrier' : 'Calendar',               href: '/schedule', color: 'hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700', icon: Calendar },
              { label: fr ? 'Rapports' : 'Reports',                  href: '/reports',  color: 'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700', icon: TrendingUp },
              { label: fr ? "Demander à l'IA" : 'Ask AI',            href: '/assistant', color: 'hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700', icon: Sparkles },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all ${action.color}`}
              >
                <Plus className="h-3.5 w-3.5" />{action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent jobs */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{fr ? 'Interventions récentes' : 'Recent jobs'}</h2>
              <Link href="/jobs" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                {fr ? 'Voir tout' : 'View all'} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-3">
                  <Briefcase className="h-6 w-6 text-violet-300" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">{fr ? 'Aucune intervention' : 'No jobs yet'}</p>
                <p className="text-xs text-gray-400 mb-3">{fr ? 'Créez votre premier bon de travail pour démarrer' : 'Create your first job to get started'}</p>
                <Link href="/jobs" className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
                  <Plus className="h-3.5 w-3.5" /> {fr ? 'Créer une intervention' : 'Create a job'}
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentJobs.map((job) => (
                  <li key={job.id}>
                    <Link href={`/jobs/${job.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                        <Briefcase className="h-4 w-4 text-violet-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-400">
                          {job.customers?.name || (fr ? 'Sans client' : 'No customer')}
                          {job.scheduled_date ? ` · ${fmtDate(job.scheduled_date, lang)}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[job.status] || ''}`}>
                        {tStatus(job.status)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent invoices */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{fr ? 'Factures récentes' : 'Recent invoices'}</h2>
              <Link href="/invoices" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                {fr ? 'Voir tout' : 'View all'} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-emerald-300" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">{fr ? 'Aucune facture' : 'No invoices yet'}</p>
                <p className="text-xs text-gray-400 mb-3">{fr ? 'Créez une facture pour commencer à être payé' : 'Create an invoice to start getting paid'}</p>
                <Link href="/invoices" className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
                  <Plus className="h-3.5 w-3.5" /> {fr ? 'Créer une facture' : 'Create an invoice'}
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentInvoices.map((inv) => (
                  <li key={inv.id}>
                    <Link href={`/invoices/${inv.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-sm font-bold text-gray-900">{fmt2(parseFloat(String(inv.amount)))}</p>
                          {inv.invoice_number && <span className="text-xs text-gray-400">{inv.invoice_number}</span>}
                        </div>
                        <p className="text-xs text-gray-400">
                          {inv.customers?.name || (fr ? 'Sans client' : 'No customer')}
                          {inv.due_date ? ` · ${fmtDate(inv.due_date, lang)}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[inv.status] || ''}`}>
                        {tStatus(inv.status)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Activity feed + Overdue invoices */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Activity feed */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{fr ? 'Activité récente' : 'Recent activity'}</h2>
              <span className="text-xs text-gray-400">{activity.length} {fr ? 'événements' : 'events'}</span>
            </div>
            {activity.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">{fr ? 'Aucune activité récente.' : 'No recent activity.'}</div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {activity.map((it) => {
                  const cfg = it.kind === 'booking'      ? { bg: 'bg-indigo-50',  fg: 'text-indigo-600',  Icon: Calendar }
                            : it.kind === 'invoice_paid' ? { bg: 'bg-emerald-50', fg: 'text-emerald-600', Icon: DollarSign }
                            : it.kind === 'job_complete' ? { bg: 'bg-blue-50',    fg: 'text-blue-600',    Icon: CheckCircle }
                            :                              { bg: 'bg-violet-50',  fg: 'text-violet-600',  Icon: Users }
                  return (
                    <li key={it.id}>
                      <Link href={it.href} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
                          <cfg.Icon className={`h-4 w-4 ${cfg.fg}`} />
                        </div>
                        <p className="text-sm text-gray-700 flex-1 truncate">{it.text}</p>
                        <span className="text-xs text-gray-400 shrink-0">{it.at ? timeAgo(it.at, fr) : ''}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Overdue invoices */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{fr ? 'Factures en retard' : 'Overdue invoices'}</h2>
              <Link href="/invoices" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                {fr ? 'Voir tout' : 'View all'} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {overdueList.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                <CheckCircle className="h-6 w-6 text-emerald-300 mx-auto mb-2" />
                {fr ? 'Aucune facture en retard' : 'No overdue invoices'}
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {overdueList.map((inv) => {
                  const days = inv.due_date
                    ? Math.max(0, Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86_400_000))
                    : 0
                  return (
                    <li key={inv.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <Link href={`/invoices/${inv.id}`} className="flex-1 min-w-0 hover:opacity-80">
                        <p className="text-sm font-semibold text-gray-900 truncate">{inv.customers?.name || (fr ? 'Sans client' : 'No customer')}</p>
                        <p className="text-xs text-gray-500">{fmt2(inv.amount)}{days > 0 ? (fr ? ` · ${days} j de retard` : ` · ${days} d late`) : ''}</p>
                      </Link>
                      {inv.customers?.email && (
                        <button
                          onClick={() => sendReminder(inv)}
                          disabled={reminderSending === inv.id}
                          className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-60"
                        >
                          {reminderSending === inv.id ? (fr ? 'Envoi…' : 'Sending…') : (fr ? 'Envoyer un rappel' : 'Send reminder')}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Revenue breakdown bar */}
        {chartData.some((d) => d.revenue > 0) && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{fr ? 'Revenus mensuels' : 'Monthly revenue'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{fr ? 'Revenus encaissés par mois' : 'Revenue collected by month'}</p>
              </div>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI nudge */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-indigo-200" />
                <span className="text-sm font-semibold text-indigo-100">{fr ? 'Insights IA pour votre entreprise' : 'AI Business Insights'}</span>
              </div>
              <p className="text-base font-semibold mb-1">
                {stats.overdueCount > 0
                  ? (fr
                      ? `${stats.overdueCount} facture${stats.overdueCount > 1 ? 's' : ''} en retard — voulez-vous que l'IA rédige des rappels de paiement ?`
                      : `${stats.overdueCount} overdue invoice${stats.overdueCount > 1 ? 's' : ''} — want AI to draft payment reminders?`)
                  : stats.unpaidCount > 0
                  ? (fr
                      ? `${stats.unpaidCount} facture${stats.unpaidCount > 1 ? 's' : ''} en attente. Demandez à l'IA d'analyser votre trésorerie.`
                      : `${stats.unpaidCount} invoice${stats.unpaidCount > 1 ? 's' : ''} pending. Ask AI to analyze your cash flow.`)
                  : (fr
                      ? `Votre entreprise fonctionne parfaitement. Demandez des insights ou créez des enregistrements avec l'IA.`
                      : `Your business is running smoothly. Ask AI for insights or to create records.`)}
              </p>
              <p className="text-sm text-indigo-200">{fr ? "Votre assistant IA a accès en temps réel à toutes vos données d'entreprise." : 'Your AI assistant has real-time access to all your business data.'}</p>
            </div>
            <Link href="/assistant" className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
              {fr ? "Demander à l'IA" : 'Ask AI'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
