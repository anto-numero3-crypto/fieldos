'use client'

// ───────────────────────────────────────────────────────────────
// Gestivio — world-class dashboard
// ───────────────────────────────────────────────────────────────
// Single-file dashboard page. Renders inside <AppLayout>, which already
// provides the top bar (search, notifications, language + theme toggle)
// and the sidebar. This file focuses on a data-rich, alive dashboard
// body: greeting, KPIs, revenue chart + activity feed, today's schedule
// + live jobs map, stat breakdowns, and pending/overdue queues.

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Briefcase,
  Calendar,
  CheckCircle,
  DollarSign,
  Loader2,
  Moon,
  Plus,
  Send,
  Sparkles,
  Sun,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import AppLayout from '@/components/AppLayout'
import { Skeleton, SkeletonKPICard } from '@/components/ui/skeleton'
import { useTheme } from '@/components/ThemeProvider'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtMoney } from '@/lib/format'
import { formatTime } from '@/lib/format-time'
import { getInvoiceDisplayStatus } from '@/lib/invoice-status'
import { getEffectiveJobStatus } from '@/lib/job-status'
import { JOB_COLORS, INVOICE_COLORS } from '@/lib/status-colors'
import PeriodSelector from '@/components/PeriodSelector'
import { supabase } from '@/app/supabase'

// ───── Lazy load the map (leaflet needs window) ─────
const JobsMap = dynamic(() => import('./JobsMap'), {
  ssr: false,
  loading: () => (
    <Skeleton className="h-[360px] w-full rounded-xl" />
  ),
})

// ────────── Types ──────────
interface Invoice {
  id: string
  amount: number | string
  status: 'paid' | 'unpaid' | 'sent' | 'overdue' | 'draft' | string
  paid_at: string | null
  created_at: string
  due_date: string | null
  invoice_number: string | null
  customer_id: string | null
  customers?: { name: string | null } | null
}

interface Job {
  id: string
  title: string | null
  status: 'scheduled' | 'in_progress' | 'complete' | 'cancelled' | string
  scheduled_date: string | null
  start_time: string | null
  end_time: string | null
  service_address: string | null
  customer_id: string | null
  assigned_to: string | null
  created_at: string
  customers?: { name: string | null } | null
  team_members?: { name: string | null } | null
}

interface Customer {
  id: string
  name: string | null
  created_at: string
}

interface Booking {
  id: string
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  service_name: string | null
  preferred_date: string | null
  preferred_time: string | null
  status: 'pending' | 'accepted' | 'declined' | string
  notes: string | null
  created_at: string
}

type ActivityKind =
  | 'invoice_paid'
  | 'new_booking'
  | 'job_completed'
  | 'new_customer'
  | 'invoice_overdue'

interface ActivityItem {
  id: string
  kind: ActivityKind
  text: string
  href: string
  at: string
}

type Period = '7d' | '30d' | '3m' | '6m' | '1y'

// ────────── Small helpers ──────────
const toNum = (v: number | string | null | undefined): number => {
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

const isoStartOfDay = (d: Date) => {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}

const todayIsoDate = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const initials = (name: string | null | undefined): string => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || '?'
}

// ────────── Component ──────────
export default function DashboardPage() {
  const { lang } = useLanguage()
  const { theme } = useTheme()
  const fr = lang === 'fr'
  const isDark = theme === 'dark'

  const [userId, setUserId] = useState<string | null>(null)
  const [firstName, setFirstName] = useState<string>('')

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])

  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [now, setNow] = useState<Date>(new Date())
  const [period, setPeriod] = useState<Period>('30d')

  // Trigger staggered entrance after first paint.
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30)
    return () => clearTimeout(t)
  }, [])

  // Update clock once a minute so relative times stay fresh.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  // ───── Fetch everything in parallel ─────
  const fetchAll = useCallback(async (uid: string) => {
    const [invRes, jobRes, custRes, bookRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('id, amount, status, paid_at, created_at, due_date, invoice_number, customer_id, customers(name)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(2000),
      supabase
        .from('jobs')
        .select('id, title, status, scheduled_date, start_time, end_time, service_address, customer_id, assigned_to, created_at, customers(name), team_members:assigned_to(name)')
        .eq('user_id', uid)
        .order('scheduled_date', { ascending: false })
        .limit(2000),
      supabase
        .from('customers')
        .select('id, name, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(2000),
      supabase
        .from('bookings')
        .select('id, customer_name, customer_phone, customer_email, service_name, preferred_date, preferred_time, status, notes, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(200),
    ])

    const invoicesData = ((invRes.data || []) as unknown) as Invoice[]
    const jobsData = ((jobRes.data || []) as unknown) as Job[]
    const customersData = ((custRes.data || []) as unknown) as Customer[]
    const bookingsData = ((bookRes.data || []) as unknown) as Booking[]

    setInvoices(invoicesData)
    setJobs(jobsData)
    setCustomers(customersData)
    setBookings(bookingsData)
    setLastSync(new Date())
  }, [])

  // Load the current user, then fetch initial data.
  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return
      if (!data.user) {
        setLoading(false)
        return
      }
      setUserId(data.user.id)
      // Derive first name — try user metadata, else the bit before '@'.
      const metaName = (data.user.user_metadata?.first_name
        || data.user.user_metadata?.full_name
        || data.user.user_metadata?.name
        || '') as string
      let fn = metaName.trim().split(/\s+/)[0] || ''
      if (!fn && data.user.email) {
        fn = data.user.email.split('@')[0].replace(/[._-]+/g, ' ').split(' ')[0]
        fn = fn.charAt(0).toUpperCase() + fn.slice(1)
      }
      setFirstName(fn || (fr ? 'Bienvenue' : 'Welcome'))
      try {
        await fetchAll(data.user.id)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })
    return () => { cancelled = true }
    // fetchAll is stable via useCallback; fr only affects fallback name
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAll])

  // Auto-refresh every 60s.
  useEffect(() => {
    if (!userId) return
    const t = setInterval(() => { fetchAll(userId).catch(() => {}) }, 60_000)
    return () => clearInterval(t)
  }, [userId, fetchAll])

  // ─────────────────────────────────────────────────
  // Derived data
  // ─────────────────────────────────────────────────
  const today = useMemo(() => isoStartOfDay(new Date()), [])
  const todayStr = useMemo(() => todayIsoDate(), [])

  const startOfThisMonth = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d
  }, [])
  const startOfLastMonth = useMemo(() => {
    const d = new Date(startOfThisMonth); d.setMonth(d.getMonth() - 1); return d
  }, [startOfThisMonth])

  // KPI 1 — revenue this month vs last month (paid invoices)
  const { revenueThisMonth, revenueTrendPct } = useMemo(() => {
    let thisM = 0
    let lastM = 0
    for (const inv of invoices) {
      if (inv.status !== 'paid') continue
      const ts = inv.paid_at || inv.created_at
      if (!ts) continue
      const d = new Date(ts)
      if (d >= startOfThisMonth) thisM += toNum(inv.amount)
      else if (d >= startOfLastMonth && d < startOfThisMonth) lastM += toNum(inv.amount)
    }
    const trend = lastM > 0 ? ((thisM - lastM) / lastM) * 100 : (thisM > 0 ? 100 : 0)
    return { revenueThisMonth: thisM, revenueTrendPct: trend }
  }, [invoices, startOfThisMonth, startOfLastMonth])

  // KPI 2 — active jobs, and how many are scheduled today
  const { activeJobs, jobsToday, todaysJobs } = useMemo(() => {
    const active = jobs.filter((j) => { const s = getEffectiveJobStatus(j); return s === 'scheduled' || s === 'in_progress' || s === 'needs_completion' })
    const todays = jobs
      .filter((j) => j.scheduled_date === todayStr)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
    return { activeJobs: active.length, jobsToday: todays.length, todaysJobs: todays }
  }, [jobs, todayStr])

  // KPI 3 — customers + new this month
  const { totalCustomers, newCustomersThisMonth } = useMemo(() => {
    const total = customers.length
    const newM = customers.filter((c) => c.created_at && new Date(c.created_at) >= startOfThisMonth).length
    return { totalCustomers: total, newCustomersThisMonth: newM }
  }, [customers, startOfThisMonth])

  // KPI 4 — unpaid + overdue
  const { unpaidTotal, unpaidCount, overdueInvoices } = useMemo(() => {
    const unpaid = invoices.filter((i) => { const d = getInvoiceDisplayStatus(i); return d === 'unpaid' || d === 'sent' || d === 'overdue' })
    const sum = unpaid.reduce((acc, i) => acc + toNum(i.amount), 0)
    const overdue = invoices
      .filter((i) => getInvoiceDisplayStatus(i) === 'overdue')
      .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
    return { unpaidTotal: sum, unpaidCount: unpaid.length, overdueInvoices: overdue }
  }, [invoices, today])

  // Invoice status breakdown — period-filtered (Row 4 donut)
  const [invoicesPeriod, setInvoicesPeriod] = useState<'month' | 'quarter' | 'year'>('month')
  const invoicesRange = useMemo(() => {
    const now = new Date()
    const start = new Date(now); start.setHours(0, 0, 0, 0)
    const end = new Date(now); end.setHours(23, 59, 59, 999)
    if (invoicesPeriod === 'month') {
      start.setDate(1)
      end.setMonth(start.getMonth() + 1, 0); end.setHours(23, 59, 59, 999)
    } else if (invoicesPeriod === 'quarter') {
      start.setMonth(start.getMonth() - 2, 1)
    } else {
      start.setMonth(0, 1)
    }
    return { start, end }
  }, [invoicesPeriod])

  const invoiceBreakdown = useMemo(() => {
    const buckets = { paid: 0, unpaid: 0, overdue: 0, draft: 0 }
    const { start, end } = invoicesRange
    for (const inv of invoices) {
      const ref = inv.created_at || inv.due_date
      if (!ref) continue
      const t = new Date(ref).getTime()
      if (t < start.getTime() || t > end.getTime()) continue
      const d = getInvoiceDisplayStatus(inv)
      if (d === 'paid') buckets.paid++
      else if (d === 'overdue') buckets.overdue++
      else if (d === 'draft') buckets.draft++
      else if (d === 'unpaid' || d === 'sent') buckets.unpaid++
    }
    return buckets
  }, [invoices, invoicesRange])

  const invoiceBreakdownTotal =
    invoiceBreakdown.paid + invoiceBreakdown.unpaid + invoiceBreakdown.overdue + invoiceBreakdown.draft

  // Top customers (Row 4 card 2)
  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; total: number }>()
    for (const inv of invoices) {
      const cid = inv.customer_id || 'unknown'
      const name = inv.customers?.name || (fr ? 'Client' : 'Customer')
      const entry = map.get(cid) || { name, total: 0 }
      entry.total += toNum(inv.amount)
      entry.name = name
      map.set(cid, entry)
    }
    return Array.from(map.values())
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [invoices, fr])

  // Jobs by status — period-filtered (Row 4 card 3)
  const [jobsPeriod, setJobsPeriod] = useState<'week' | 'month' | 'quarter'>('week')
  const jobsRange = useMemo(() => {
    const now = new Date()
    const start = new Date(now); start.setHours(0, 0, 0, 0)
    const end = new Date(now); end.setHours(23, 59, 59, 999)
    if (jobsPeriod === 'week') {
      // Monday → Sunday
      const dow = start.getDay()
      const diff = dow === 0 ? -6 : 1 - dow
      start.setDate(start.getDate() + diff)
      end.setTime(start.getTime()); end.setDate(end.getDate() + 6); end.setHours(23, 59, 59, 999)
    } else if (jobsPeriod === 'month') {
      start.setDate(1)
      end.setMonth(start.getMonth() + 1, 0); end.setHours(23, 59, 59, 999)
    } else {
      // rolling 3 months
      start.setMonth(start.getMonth() - 2, 1)
      end.setTime(Date.now()); end.setHours(23, 59, 59, 999)
    }
    return { start, end }
  }, [jobsPeriod])

  const jobsByStatus = useMemo(() => {
    const b = { scheduled: 0, in_progress: 0, needs_completion: 0, completed: 0 }
    const { start, end } = jobsRange
    for (const j of jobs) {
      if (!j.scheduled_date) continue
      const d = new Date(j.scheduled_date.slice(0, 10) + 'T00:00:00')
      if (d < start || d > end) continue
      const s = getEffectiveJobStatus(j)
      if (s === 'scheduled') b.scheduled++
      else if (s === 'in_progress') b.in_progress++
      else if (s === 'needs_completion') b.needs_completion++
      else if (s === 'complete' || s === 'completed' || s === 'invoiced') b.completed++
    }
    return b
  }, [jobs, jobsRange])

  // Pending bookings (Row 5)
  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === 'pending').slice(0, 5),
    [bookings],
  )

  // ───── Revenue chart data (based on selected period) ─────
  const revenueSeries = useMemo(() => {
    const buckets: Array<{ label: string; value: number; ts: number }> = []
    const nowD = new Date()
    const pushBucket = (d: Date, label: string) => buckets.push({ label, value: 0, ts: d.getTime() })

    if (period === '7d' || period === '30d') {
      const days = period === '7d' ? 7 : 30
      for (let i = days - 1; i >= 0; i--) {
        const d = isoStartOfDay(new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate() - i))
        const label = d.toLocaleDateString(fr ? 'fr-CA' : 'en-CA', {
          day: 'numeric',
          month: days <= 7 ? 'short' : undefined,
        })
        pushBucket(d, label)
      }
      for (const inv of invoices) {
        if (inv.status !== 'paid') continue
        const ts = inv.paid_at || inv.created_at
        if (!ts) continue
        const d = isoStartOfDay(new Date(ts))
        const idx = buckets.findIndex((b) => b.ts === d.getTime())
        if (idx >= 0) buckets[idx].value += toNum(inv.amount)
      }
    } else {
      // 3m / 6m / 1y — monthly buckets
      const months = period === '3m' ? 3 : period === '6m' ? 6 : 12
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1)
        const label = d.toLocaleDateString(fr ? 'fr-CA' : 'en-CA', { month: 'short' })
        buckets.push({ label, value: 0, ts: d.getTime() })
      }
      const keyOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getTime()
      for (const inv of invoices) {
        if (inv.status !== 'paid') continue
        const ts = inv.paid_at || inv.created_at
        if (!ts) continue
        const k = keyOf(new Date(ts))
        const idx = buckets.findIndex((b) => b.ts === k)
        if (idx >= 0) buckets[idx].value += toNum(inv.amount)
      }
    }
    return buckets.map((b) => ({ label: b.label, value: Math.round(b.value * 100) / 100 }))
  }, [invoices, period, fr])

  const revenuePeriodTotal = useMemo(
    () => revenueSeries.reduce((acc, r) => acc + r.value, 0),
    [revenueSeries],
  )

  // ───── Activity feed (Row 2 right) ─────
  const activityItems = useMemo((): ActivityItem[] => {
    const out: ActivityItem[] = []

    for (const inv of invoices) {
      if (inv.status === 'paid' && inv.paid_at) {
        const name = inv.customers?.name || (fr ? 'un client' : 'a customer')
        out.push({
          id: `inv-paid-${inv.id}`,
          kind: 'invoice_paid',
          text: fr
            ? `Facture ${inv.invoice_number || ''} payée par ${name}`
            : `Invoice ${inv.invoice_number || ''} paid by ${name}`,
          href: `/invoices`,
          at: inv.paid_at,
        })
      }
      if (getInvoiceDisplayStatus(inv) === 'overdue') {
        const name = inv.customers?.name || (fr ? 'un client' : 'a customer')
        out.push({
          id: `inv-over-${inv.id}`,
          kind: 'invoice_overdue',
          text: fr
            ? `Facture ${inv.invoice_number || ''} en retard — ${name}`
            : `Invoice ${inv.invoice_number || ''} overdue — ${name}`,
          href: `/invoices`,
          at: inv.due_date || inv.created_at,
        })
      }
    }

    for (const j of jobs) {
      const je = getEffectiveJobStatus(j)
      if (je === 'complete' || je === 'completed' || je === 'invoiced') {
        const name = j.customers?.name || (fr ? 'un client' : 'a customer')
        out.push({
          id: `job-${j.id}`,
          kind: 'job_completed',
          text: fr ? `Intervention terminée pour ${name}` : `Job completed for ${name}`,
          href: `/jobs/${j.id}`,
          at: j.scheduled_date || j.created_at,
        })
      }
    }

    for (const b of bookings) {
      out.push({
        id: `book-${b.id}`,
        kind: 'new_booking',
        text: fr
          ? `Nouvelle réservation — ${b.customer_name || 'client'} (${b.service_name || ''})`
          : `New booking — ${b.customer_name || 'customer'} (${b.service_name || ''})`,
        href: `/bookings`,
        at: b.created_at,
      })
    }

    for (const c of customers) {
      out.push({
        id: `cust-${c.id}`,
        kind: 'new_customer',
        text: fr ? `Nouveau client : ${c.name || ''}` : `New customer: ${c.name || ''}`,
        href: `/customers/${c.id}`,
        at: c.created_at,
      })
    }

    return out
      .filter((a) => !!a.at)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 20)
  }, [invoices, jobs, bookings, customers, today, fr])

  // ───── Greeting helpers ─────
  const formattedDate = now.toLocaleDateString(fr ? 'fr-CA' : 'en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const lastSyncLabel = useMemo(() => {
    if (!lastSync) return ''
    const secs = Math.max(0, Math.floor((now.getTime() - lastSync.getTime()) / 1000))
    if (secs < 60) return fr ? `Mis à jour il y a ${secs}s` : `Updated ${secs}s ago`
    const mins = Math.floor(secs / 60)
    if (mins < 60) return fr ? `Mis à jour il y a ${mins} min` : `Updated ${mins}m ago`
    const hrs = Math.floor(mins / 60)
    return fr ? `Mis à jour il y a ${hrs} h` : `Updated ${hrs}h ago`
  }, [lastSync, now, fr])

  // ───── Bookings actions ─────
  const [bookingActing, setBookingActing] = useState<string | null>(null)
  const updateBooking = async (id: string, status: 'accepted' | 'declined') => {
    setBookingActing(id)
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success(
        status === 'accepted'
          ? (fr ? 'Réservation acceptée' : 'Booking accepted')
          : (fr ? 'Réservation refusée' : 'Booking declined'),
      )
      if (userId) await fetchAll(userId)
    } catch {
      toast.error(fr ? "Impossible de mettre à jour la réservation" : 'Could not update booking')
    } finally {
      setBookingActing(null)
    }
  }

  // Pass to JobsMap: today's jobs with an address.
  const mapJobs = useMemo(() => todaysJobs
    .filter((j) => !!j.service_address)
    .map((j) => ({
      id: j.id,
      title: j.title || '',
      status: getEffectiveJobStatus(j),
      service_address: j.service_address,
      customer_name: j.customers?.name || null,
      start_time: j.start_time || null,
      technician: j.team_members?.name || null,
    })), [todaysJobs])

  // ───── Render ─────
  return (
    <AppLayout title={fr ? 'Tableau de bord' : 'Dashboard'}>
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ══════ ROW 0 — Greeting ══════ */}
        <GreetingRow
          firstName={firstName}
          dateLabel={formattedDate}
          lastSyncLabel={lastSyncLabel}
          fr={fr}
          mounted={mounted}
          loading={loading && !firstName}
        />

        {/* ══════ ROW 1 — KPI cards ══════ */}
        <section
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{ transitionDelay: '80ms' }}
        >
          {loading ? (
            <>
              <SkeletonKPICard /><SkeletonKPICard />
              <SkeletonKPICard /><SkeletonKPICard />
            </>
          ) : (
            <>
              <KpiCard
                href="/invoices"
                tone="emerald"
                Icon={DollarSign}
                label={fr ? 'Revenus ce mois' : 'Revenue this month'}
                value={fmtMoney(revenueThisMonth, lang)}
                trendPct={revenueTrendPct}
                trendSuffix={fr ? 'vs mois dernier' : 'vs last month'}
              />
              <KpiCard
                href="/jobs"
                tone="blue"
                Icon={Briefcase}
                label={fr ? 'Interventions actives' : 'Active jobs'}
                value={String(activeJobs)}
                subtext={
                  fr
                    ? `${jobsToday} planifiée${jobsToday !== 1 ? 's' : ''} aujourd'hui`
                    : `${jobsToday} scheduled today`
                }
              />
              <KpiCard
                href="/customers"
                tone="violet"
                Icon={Users}
                label={fr ? 'Clients' : 'Customers'}
                value={String(totalCustomers)}
                subtext={
                  fr
                    ? `+${newCustomersThisMonth} nouveau${newCustomersThisMonth !== 1 ? 'x' : ''} ce mois`
                    : `+${newCustomersThisMonth} new this month`
                }
              />
              <KpiCard
                href="/invoices?status=unpaid"
                tone="amber"
                Icon={AlertCircle}
                label={fr ? 'Factures impayées' : 'Unpaid invoices'}
                value={fmtMoney(unpaidTotal, lang)}
                subtext={
                  fr
                    ? `${unpaidCount} facture${unpaidCount !== 1 ? 's' : ''} en attente`
                    : `${unpaidCount} invoice${unpaidCount !== 1 ? 's' : ''} pending`
                }
              />
            </>
          )}
        </section>

        {/* ══════ ROW 2 — Revenue chart + Activity feed ══════ */}
        <section
          className={`grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 transition-all duration-500 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{ transitionDelay: '160ms' }}
        >
          <RevenueCard
            fr={fr}
            lang={lang}
            isDark={isDark}
            period={period}
            onPeriod={setPeriod}
            total={revenuePeriodTotal}
            data={revenueSeries}
            loading={loading}
          />
          <ActivityFeed items={activityItems} fr={fr} loading={loading} nowTs={now.getTime()} />
        </section>

        {/* ══════ ROW 3 — Today's schedule + Jobs map ══════ */}
        <section
          className={`grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4 transition-all duration-500 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{ transitionDelay: '240ms' }}
        >
          <TodaysSchedule jobs={todaysJobs} fr={fr} lang={lang} loading={loading} dateLabel={formattedDate} />
          <div className="hidden lg:block">
            <MapCard fr={fr} jobs={mapJobs} loading={loading} />
          </div>
        </section>

        {/* ══════ ROW 4 — Stat grid ══════ */}
        <section
          className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-500 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{ transitionDelay: '320ms' }}
        >
          <InvoiceBreakdownCard
            fr={fr}
            breakdown={invoiceBreakdown}
            total={invoiceBreakdownTotal}
            isDark={isDark}
            loading={loading}
            period={invoicesPeriod}
            onPeriod={setInvoicesPeriod}
            range={invoicesRange}
          />
          <TopCustomersCard fr={fr} lang={lang} customers={topCustomers} loading={loading} />
          <JobsByStatusCard
            fr={fr}
            stats={jobsByStatus}
            loading={loading}
            mounted={mounted}
            period={jobsPeriod}
            onPeriod={setJobsPeriod}
            range={jobsRange}
          />
        </section>

        {/* ══════ ROW 5 — Pending bookings + Overdue invoices ══════ */}
        <section
          className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-500 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{ transitionDelay: '400ms' }}
        >
          <PendingBookingsCard
            fr={fr}
            bookings={pendingBookings}
            onAction={updateBooking}
            acting={bookingActing}
            loading={loading}
          />
          <OverdueInvoicesCard fr={fr} lang={lang} invoices={overdueInvoices} loading={loading} today={today} />
        </section>
      </div>
    </AppLayout>
  )
}

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════

// ────────── Greeting row ──────────
function GreetingRow({
  firstName, dateLabel, lastSyncLabel, fr, mounted, loading,
}: {
  firstName: string; dateLabel: string; lastSyncLabel: string
  fr: boolean; mounted: boolean; loading: boolean
}) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 transition-all duration-500 ease-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {loading ? (
            <span className="inline-block h-8 w-60 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse align-middle" />
          ) : (
            <>
              <span>{fr ? 'Bonjour, ' : 'Hi, '}</span>
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                {firstName}
              </span>
              <span className="ml-2 inline-block origin-[70%_70%] animate-wave">👋</span>
            </>
          )}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 capitalize">
          {dateLabel}
          {lastSyncLabel && (
            <span className="ml-2 hidden sm:inline text-xs text-gray-400 dark:text-gray-500">
              · {lastSyncLabel}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {fr ? 'Nouvelle intervention' : 'New job'}
        </Link>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-sm font-medium transition-colors shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
          {fr ? 'Créer une facture' : 'New invoice'}
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? (fr ? 'Passer au mode clair' : 'Switch to light mode') : (fr ? 'Passer au mode sombre' : 'Switch to dark mode')}
          className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
        >
          {isDark
            ? <Sun className="h-4.5 w-4.5 transition-transform duration-300 hover:rotate-12" />
            : <Moon className="h-4.5 w-4.5 transition-transform duration-300 hover:-rotate-12" />}
        </button>
      </div>
    </div>
  )
}

// ────────── KPI card ──────────
function KpiCard({
  href, tone, Icon, label, value, subtext, trendPct, trendSuffix,
}: {
  href: string
  tone: 'emerald' | 'blue' | 'violet' | 'amber'
  Icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subtext?: string
  trendPct?: number
  trendSuffix?: string
}) {
  const tones: Record<typeof tone, { bg: string; fg: string }> = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', fg: 'text-emerald-600 dark:text-emerald-400' },
    blue:    { bg: 'bg-blue-50 dark:bg-blue-500/10',       fg: 'text-blue-600 dark:text-blue-400' },
    violet:  { bg: 'bg-violet-50 dark:bg-violet-500/10',   fg: 'text-violet-600 dark:text-violet-400' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-500/10',     fg: 'text-amber-600 dark:text-amber-400' },
  }
  const t = tones[tone]
  const up = (trendPct ?? 0) >= 0

  return (
    <Link
      href={href}
      className="group relative rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${t.bg}`}>
          <Icon className={`h-5 w-5 ${t.fg}`} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="mt-3 text-3xl font-bold tabular-nums text-gray-900 dark:text-white leading-tight break-words">
        {value}
      </div>
      <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{label}</div>

      {typeof trendPct === 'number' && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold ${
            up
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
          }`}>
            {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(trendPct).toFixed(1)}%
          </span>
          {trendSuffix && <span className="text-gray-400 dark:text-gray-500">{trendSuffix}</span>}
        </div>
      )}

      {subtext && !Number.isFinite(trendPct as number) && (
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">{subtext}</div>
      )}
      {subtext && Number.isFinite(trendPct as number) && (
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 truncate">{subtext}</div>
      )}
    </Link>
  )
}

// ────────── Revenue card ──────────
function RevenueCard({
  fr, lang, isDark, period, onPeriod, total, data, loading,
}: {
  fr: boolean
  lang: 'fr' | 'en'
  isDark: boolean
  period: Period
  onPeriod: (p: Period) => void
  total: number
  data: Array<{ label: string; value: number }>
  loading: boolean
}) {
  const pills: { key: Period; label: string }[] = [
    { key: '7d', label: fr ? '7J' : '7D' },
    { key: '30d', label: fr ? '30J' : '30D' },
    { key: '3m', label: '3M' },
    { key: '6m', label: '6M' },
    { key: '1y', label: fr ? '1A' : '1Y' },
  ]
  const axisColor = isDark ? '#6b7280' : '#9ca3af'
  const gridColor = isDark ? '#1f2937' : '#f3f4f6'
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {fr ? 'Revenus' : 'Revenue'}
          </h2>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tabular-nums text-gray-900 dark:text-white">
              {fmtMoney(total, lang)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {fr ? 'payé · période' : 'paid · period'}
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-0.5">
          {pills.map((p) => (
            <button
              key={p.key}
              onClick={() => onPeriod(p.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                period === p.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-64 w-full">
        {loading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: axisColor }}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis
                hide
                domain={[0, (max: number) => Math.max(max * 1.2, 10)]}
              />
              <Tooltip
                cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeOpacity: 0.3 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const v = toNum(payload[0].value as number | string)
                  return (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-lg">
                      <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{label}</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                        {fmtMoney(v, lang)}
                      </div>
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2.25}
                fill="url(#revGradient)"
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// ────────── Activity feed ──────────
function ActivityFeed({
  items, fr, loading, nowTs,
}: {
  items: ActivityItem[]
  fr: boolean
  loading: boolean
  nowTs: number
}) {
  const timeAgo = (iso: string): string => {
    const mins = Math.floor((nowTs - new Date(iso).getTime()) / 60000)
    if (mins < 1) return fr ? "à l'instant" : 'just now'
    if (mins < 60) return fr ? `il y a ${mins} min` : `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return fr ? `il y a ${hrs} h` : `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return fr ? `il y a ${days} j` : `${days}d ago`
  }

  const KIND_META: Record<ActivityKind, { dot: string; Icon: React.ComponentType<{ className?: string }>; fg: string; bg: string }> = {
    invoice_paid:     { dot: 'bg-emerald-500', Icon: DollarSign,  fg: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    new_booking:      { dot: 'bg-blue-500',    Icon: Calendar,    fg: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-500/10' },
    job_completed:    { dot: 'bg-violet-500',  Icon: CheckCircle, fg: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-500/10' },
    new_customer:     { dot: 'bg-amber-500',   Icon: UserPlus,    fg: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-500/10' },
    invoice_overdue:  { dot: 'bg-red-500',     Icon: AlertCircle, fg: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-500/10' },
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {fr ? 'Activité récente' : 'Recent activity'}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {fr ? 'Les 20 derniers événements' : 'Last 20 events'}
          </p>
        </div>
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title={fr ? 'Live' : 'Live'} />
      </div>

      <div className="max-h-[500px] min-h-[320px] overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4 rounded" />
                  <Skeleton className="h-2.5 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
              <Sparkles className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {fr ? 'Aucune activité pour l\'instant' : 'No activity yet'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {fr ? 'Vos événements apparaîtront ici.' : 'Your events will appear here.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {items.map((a) => {
              const m = KIND_META[a.kind]
              return (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    <span className={`mt-1.5 inline-flex h-2 w-2 shrink-0 rounded-full ${m.dot}`} />
                    <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.bg}`}>
                      <m.Icon className={`h-4 w-4 ${m.fg}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{a.text}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo(a.at)}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

// ────────── Today's schedule ──────────
function TodaysSchedule({
  jobs, fr, lang, loading, dateLabel,
}: {
  jobs: Job[]; fr: boolean; lang: 'fr' | 'en'
  loading: boolean; dateLabel: string
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {fr ? "Agenda du jour" : "Today's schedule"}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">{dateLabel}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
          {jobs.length}
        </span>
      </div>

      <div className="flex-1 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
              <Calendar className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
            </div>
            <p className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {fr ? "Aucune intervention aujourd'hui" : 'No jobs today'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-4">
              {fr ? 'Votre journée est libre. Profitez-en.' : 'Your day is clear. Enjoy it.'}
            </p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              {fr ? 'Créer une intervention' : 'Create a job'}
            </Link>
          </div>
        ) : (
          <ul className="p-3 space-y-2">
            {jobs.map((j) => (
              <ScheduleRow key={j.id} job={j} fr={fr} lang={lang} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ScheduleRow({ job, fr, lang }: { job: Job; fr: boolean; lang: 'fr' | 'en' }) {
  const statusColor: Record<string, { border: string; badge: string; label: string }> = {
    scheduled:        { border: 'border-l-blue-500',   badge: 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300',                    label: fr ? 'Planifiée' : 'Scheduled' },
    in_progress:      { border: 'border-l-green-500',  badge: 'bg-green-100 text-green-900 animate-pulse dark:bg-green-950/60 dark:text-green-300', label: fr ? 'En cours' : 'In progress' },
    needs_completion: { border: 'border-l-orange-500', badge: 'bg-orange-100 text-orange-900 animate-pulse dark:bg-orange-950/60 dark:text-orange-300', label: fr ? 'À compléter' : 'Needs completion' },
    completed:        { border: 'border-l-gray-400',   badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',                       label: fr ? 'Complétée' : 'Completed' },
    complete:         { border: 'border-l-gray-400',   badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',                       label: fr ? 'Complétée' : 'Completed' },
    invoiced:         { border: 'border-l-gray-400',   badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',                       label: fr ? 'Complétée' : 'Completed' },
    cancelled:        { border: 'border-l-gray-300',   badge: 'bg-gray-100 text-gray-500 opacity-60 dark:bg-gray-800 dark:text-gray-500',            label: fr ? 'Annulée' : 'Cancelled' },
  }
  const effective = getEffectiveJobStatus(job)
  const s = statusColor[effective] || statusColor.scheduled

  const formatTimeStr = (t: string | null): string => t ? formatTime(t, lang) : '—'

  return (
    <li>
      <Link
        href={`/jobs/${job.id}`}
        className={`flex items-stretch gap-3 rounded-xl border-l-4 ${s.border} bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 p-3 transition-colors`}
      >
        <div className="flex flex-col items-center justify-center w-16 shrink-0 text-center">
          <div className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
            {formatTimeStr(job.start_time)}
          </div>
          {job.end_time && (
            <div className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
              {formatTimeStr(job.end_time)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {job.title || (fr ? 'Intervention' : 'Job')}
            </h3>
            <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.badge}`}>
              {s.label}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 truncate">
            {job.customers?.name || (fr ? 'Client' : 'Customer')}
            {job.service_address ? ` · ${job.service_address}` : ''}
          </p>
          {job.team_members?.name && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
              {fr ? 'Assigné à' : 'Assigned to'}: {job.team_members.name}
            </p>
          )}
        </div>
      </Link>
    </li>
  )
}

// ────────── Map card ──────────
function MapCard({
  fr, jobs, loading,
}: {
  fr: boolean
  jobs: Array<{
    id: string
    title: string
    status: string
    service_address: string | null
    customer_name: string | null
    start_time: string | null
    technician: string | null
  }>
  loading: boolean
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {fr ? 'Carte des interventions' : 'Jobs map'}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {fr ? 'Interventions d\'aujourd\'hui géolocalisées' : "Today's jobs, geolocated"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] flex-wrap">
          <LegendDot color={JOB_COLORS.scheduled.hex}        label={fr ? JOB_COLORS.scheduled.label.fr        : JOB_COLORS.scheduled.label.en} />
          <LegendDot color={JOB_COLORS.in_progress.hex}      label={fr ? JOB_COLORS.in_progress.label.fr      : JOB_COLORS.in_progress.label.en} />
          <LegendDot color={JOB_COLORS.needs_completion.hex} label={fr ? JOB_COLORS.needs_completion.label.fr : JOB_COLORS.needs_completion.label.en} />
          <LegendDot color={JOB_COLORS.completed.hex}        label={fr ? JOB_COLORS.completed.label.fr        : JOB_COLORS.completed.label.en} />
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <Skeleton className="h-[360px] w-full rounded-xl" />
        ) : (
          <JobsMap jobs={jobs} />
        )}
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

// ────────── Invoice breakdown donut ──────────
function InvoiceBreakdownCard({
  fr, breakdown, total, isDark, loading, period, onPeriod, range,
}: {
  fr: boolean
  breakdown: { paid: number; unpaid: number; overdue: number; draft: number }
  total: number
  isDark: boolean
  loading: boolean
  period: 'month' | 'quarter' | 'year'
  onPeriod: (v: 'month' | 'quarter' | 'year') => void
  range: { start: Date; end: Date }
}) {
  const data = [
    { key: 'paid',    label: fr ? INVOICE_COLORS.paid.label.fr    : INVOICE_COLORS.paid.label.en,    value: breakdown.paid,    color: INVOICE_COLORS.paid.hex },
    { key: 'unpaid',  label: fr ? INVOICE_COLORS.unpaid.label.fr  : INVOICE_COLORS.unpaid.label.en,  value: breakdown.unpaid,  color: INVOICE_COLORS.unpaid.hex },
    { key: 'overdue', label: fr ? INVOICE_COLORS.overdue.label.fr : INVOICE_COLORS.overdue.label.en, value: breakdown.overdue, color: INVOICE_COLORS.overdue.hex },
    { key: 'draft',   label: fr ? INVOICE_COLORS.draft.label.fr   : INVOICE_COLORS.draft.label.en,   value: breakdown.draft,   color: INVOICE_COLORS.draft.hex },
  ]
  const hasData = total > 0
  const rangeLabel = (() => {
    const s = range.start, e = range.end
    const fmt = fr ? 'fr-CA' : 'en-CA'
    if (period === 'month') return s.toLocaleDateString(fmt, { month: 'long', year: 'numeric' })
    return `${s.toLocaleDateString(fmt, { month: 'short', day: 'numeric' })} — ${e.toLocaleDateString(fmt, { month: 'short', day: 'numeric', year: 'numeric' })}`
  })()
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {fr ? 'Factures ce mois' : 'Invoices this month'}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{rangeLabel}</p>
        </div>
        <PeriodSelector
          selected={period}
          onChange={(v) => onPeriod(v as 'month' | 'quarter' | 'year')}
          periods={[
            { value: 'month',   label: { fr: 'Ce mois', en: 'This month' } },
            { value: 'quarter', label: { fr: '3 mois',  en: '3 months' } },
            { value: 'year',    label: { fr: 'Année',   en: 'Year' } },
          ]}
        />
      </div>

      <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-4">
        <div className="h-44 relative">
          {loading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : hasData ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke={isDark ? '#0b0f19' : '#fff'}
                    strokeWidth={2}
                    animationDuration={600}
                  >
                    {data.map((d) => <Cell key={d.key} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const p = payload[0].payload as { label: string; value: number; color: string }
                      return (
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 shadow-lg text-xs">
                          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
                          <span className="font-medium text-gray-900 dark:text-white">{p.label}</span>
                          <span className="ml-2 tabular-nums text-gray-500">{p.value}</span>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{total}</div>
                <div className="text-[11px] uppercase tracking-wide text-gray-400">
                  {fr ? 'factures' : 'invoices'}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <DollarSign className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-1" />
              <p className="text-xs text-gray-400">{fr ? 'Aucune facture' : 'No invoices yet'}</p>
            </div>
          )}
        </div>
        <ul className="space-y-1.5 text-sm min-w-[110px]">
          {data.map((d) => (
            <li key={d.key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.label}
              </span>
              <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{d.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ────────── Top customers ──────────
function TopCustomersCard({
  fr, lang, customers, loading,
}: {
  fr: boolean
  lang: 'fr' | 'en'
  customers: Array<{ name: string; total: number }>
  loading: boolean
}) {
  const max = customers[0]?.total || 0
  const gradients = [
    'from-indigo-500 to-violet-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-pink-500 to-rose-500',
    'from-sky-500 to-blue-500',
  ]
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-5">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
        {fr ? 'Meilleurs clients' : 'Top customers'}
      </h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        {fr ? 'Par revenu facturé' : 'By invoiced revenue'}
      </p>

      <div className="mt-4 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-2/3 rounded" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          ))
        ) : customers.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400">{fr ? 'Aucun client facturé' : 'No invoiced customers'}</p>
          </div>
        ) : (
          customers.map((c, i) => {
            const pct = max > 0 ? Math.max(4, (c.total / max) * 100) : 0
            return (
              <div key={c.name + i} className="flex items-center gap-3">
                <div className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradients[i % gradients.length]} text-white text-xs font-bold`}>
                  {initials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</span>
                    <span className="text-xs font-semibold tabular-nums text-gray-600 dark:text-gray-300 shrink-0">
                      {fmtMoney(c.total, lang)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ────────── Jobs by status (animated bars) ──────────
function JobsByStatusCard({
  fr, stats, loading, mounted, period, onPeriod, range,
}: {
  fr: boolean
  stats: { scheduled: number; in_progress: number; needs_completion: number; completed: number }
  loading: boolean
  mounted: boolean
  period: 'week' | 'month' | 'quarter'
  onPeriod: (v: 'week' | 'month' | 'quarter') => void
  range: { start: Date; end: Date }
}) {
  const rows = [
    { key: 'scheduled',        label: fr ? JOB_COLORS.scheduled.label.fr        : JOB_COLORS.scheduled.label.en,        value: stats.scheduled,        color: JOB_COLORS.scheduled.hex },
    { key: 'in_progress',      label: fr ? JOB_COLORS.in_progress.label.fr      : JOB_COLORS.in_progress.label.en,      value: stats.in_progress,      color: JOB_COLORS.in_progress.hex },
    { key: 'needs_completion', label: fr ? JOB_COLORS.needs_completion.label.fr : JOB_COLORS.needs_completion.label.en, value: stats.needs_completion, color: JOB_COLORS.needs_completion.hex },
    { key: 'completed',        label: fr ? JOB_COLORS.completed.label.fr        : JOB_COLORS.completed.label.en,        value: stats.completed,        color: JOB_COLORS.completed.hex },
  ]
  const max = Math.max(1, ...rows.map((r) => r.value))
  const rangeLabel = (() => {
    const s = range.start, e = range.end
    const fmt = fr ? 'fr-CA' : 'en-CA'
    if (period === 'week') return `${s.toLocaleDateString(fmt, { day: 'numeric', month: 'short' })} — ${e.toLocaleDateString(fmt, { day: 'numeric', month: 'short', year: 'numeric' })}`
    if (period === 'month') return s.toLocaleDateString(fmt, { month: 'long', year: 'numeric' })
    return `${s.toLocaleDateString(fmt, { month: 'short', day: 'numeric' })} — ${e.toLocaleDateString(fmt, { month: 'short', day: 'numeric', year: 'numeric' })}`
  })()
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {fr ? 'Interventions cette semaine' : 'Jobs this week'}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{rangeLabel}</p>
        </div>
        <PeriodSelector
          selected={period}
          onChange={(v) => onPeriod(v as 'week' | 'month' | 'quarter')}
          periods={[
            { value: 'week',    label: { fr: 'Cette semaine', en: 'This week' } },
            { value: 'month',   label: { fr: 'Ce mois',        en: 'This month' } },
            { value: 'quarter', label: { fr: '3 mois',         en: '3 months' } },
          ]}
        />
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-1/3 rounded" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))
        ) : (
          rows.map((r, idx) => {
            const target = mounted ? `${(r.value / max) * 100}%` : '0%'
            return (
              <div key={r.key}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{r.label}</span>
                  <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{r.value}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: target, transitionDelay: `${idx * 80}ms`, backgroundColor: r.color }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ────────── Pending bookings ──────────
function PendingBookingsCard({
  fr, bookings, onAction, acting, loading,
}: {
  fr: boolean
  bookings: Booking[]
  onAction: (id: string, status: 'accepted' | 'declined') => void
  acting: string | null
  loading: boolean
}) {
  const fmtPrefDate = (d: string | null) => {
    if (!d) return ''
    const dt = new Date(d.length === 10 ? d + 'T12:00:00' : d)
    if (isNaN(dt.getTime())) return d
    return dt.toLocaleDateString(fr ? 'fr-CA' : 'en-CA', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {fr ? 'Réservations en attente' : 'Pending bookings'}
          </h2>
          {bookings.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
              {bookings.length}
            </span>
          )}
        </div>
        <Link href="/bookings" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          {fr ? 'Tout voir →' : 'See all →'}
        </Link>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {fr ? 'Aucune réservation en attente' : 'No pending bookings'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {fr ? 'Tout est traité. Beau travail !' : "You're all caught up. Nice work!"}
            </p>
          </div>
        ) : (
          <ul className="p-3 space-y-2">
            {bookings.map((b) => {
              const busy = acting === b.id
              return (
                <li
                  key={b.id}
                  className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs font-bold">
                      {initials(b.customer_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {b.customer_name || (fr ? 'Client' : 'Customer')}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                          {fmtPrefDate(b.preferred_date)}
                          {b.preferred_time ? ` · ${b.preferred_time}` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 truncate">
                        {b.service_name || (fr ? 'Service' : 'Service')}
                      </p>
                      {b.notes && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
                          {b.notes.length > 60 ? b.notes.slice(0, 60) + '…' : b.notes}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onAction(b.id, 'accepted')}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-2.5 py-1 text-xs font-semibold transition-colors"
                        >
                          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                          {fr ? 'Accepter' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onAction(b.id, 'declined')}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 px-2.5 py-1 text-xs font-semibold transition-colors"
                        >
                          <X className="h-3 w-3" />
                          {fr ? 'Refuser' : 'Decline'}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

// ────────── Overdue invoices ──────────
function OverdueInvoicesCard({
  fr, lang, invoices, loading, today,
}: {
  fr: boolean
  lang: 'fr' | 'en'
  invoices: Invoice[]
  loading: boolean
  today: Date
}) {
  const totalOverdue = invoices.reduce((acc, i) => acc + toNum(i.amount), 0)
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {fr ? 'Factures en retard' : 'Overdue invoices'}
          </h2>
          {invoices.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-700 dark:text-red-400 tabular-nums">
              {fmtMoney(totalOverdue, lang)}
            </span>
          )}
        </div>
        <Link href="/invoices?status=overdue" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          {fr ? 'Tout voir →' : 'See all →'}
        </Link>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {fr ? 'Toutes les factures sont à jour ✓' : 'All invoices are up to date ✓'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {fr ? 'Aucun paiement en retard.' : 'No late payments.'}
            </p>
          </div>
        ) : (
          <ul className="p-3 space-y-2">
            {invoices.slice(0, 5).map((inv) => {
              const due = inv.due_date ? new Date(inv.due_date) : null
              const days = due ? Math.max(1, Math.floor((today.getTime() - due.getTime()) / (86_400_000))) : 0
              return (
                <li key={inv.id} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10">
                      <AlertCircle className="h-4.5 w-4.5 text-red-500 dark:text-red-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {inv.customers?.name || (fr ? 'Client' : 'Customer')}
                          {inv.invoice_number ? (
                            <span className="ml-1.5 text-xs font-normal text-gray-400">#{inv.invoice_number}</span>
                          ) : null}
                        </span>
                        <span className="text-sm font-bold tabular-nums text-red-600 dark:text-red-400 shrink-0">
                          {fmtMoney(toNum(inv.amount), lang)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {fr ? `En retard de ${days} jour${days > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''} overdue`}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Link
                          href={`/invoices/${inv.id}?remind=1`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 px-2.5 py-1 text-xs font-semibold transition-colors"
                        >
                          <Send className="h-3 w-3" />
                          {fr ? 'Relancer' : 'Remind'}
                        </Link>
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-semibold transition-colors"
                        >
                          <DollarSign className="h-3 w-3" />
                          {fr ? 'Marquer payée' : 'Mark paid'}
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

// ───── Inline styles for the waving emoji animation ─────
// Tailwind doesn't ship a wave keyframe by default.
// Placed at end so it doesn't visually crowd the components above.
const css = `
@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(14deg); }
  20%      { transform: rotate(-8deg); }
  40%      { transform: rotate(10deg); }
  50%      { transform: rotate(0deg); }
}
.animate-wave { animation: wave 2.4s ease-in-out 0.4s 2; display: inline-block; transform-origin: 70% 70%; }
`
if (typeof document !== 'undefined' && !document.getElementById('dashboard-inline-css')) {
  const s = document.createElement('style')
  s.id = 'dashboard-inline-css'
  s.textContent = css
  document.head.appendChild(s)
}
