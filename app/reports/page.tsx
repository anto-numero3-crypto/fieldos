'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import { usePlan } from '@/lib/hooks/usePlan'
import { normalizePlan } from '@/lib/plan-limits'
import EmptyState from '@/components/EmptyState'
import { SkeletonChart, SkeletonKPICard } from '@/components/ui/skeleton'
import { BarChart3, Lock } from 'lucide-react'
import Link from 'next/link'
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { TrendingUp, DollarSign, Briefcase, Users, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtDate } from '@/lib/format'

interface LineItem { description: string; qty: number; unit_price: number }
interface Invoice {
  id: string; amount: number; status: string
  created_at: string; paid_at: string | null
  line_items: LineItem[] | null
  customers: { name: string } | null
}
interface Job { id: string; status: string; created_at: string; updated_at: string | null; customers: { name: string } | null }
interface Customer { id: string; name: string; created_at: string }

const MONTHS_SHORT_FR = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']
const MONTHS_SHORT_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

type Period = '7d' | '30d' | '90d' | 'ytd' | 'all'

const PERIOD_DAYS: Record<Period, number | null> = {
  '7d': 7, '30d': 30, '90d': 90, 'ytd': -1, 'all': null,
}

const fmt  = (n: number) => `$${n.toLocaleString('en', { minimumFractionDigits: 0 })}`
const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n)

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 shadow-lg">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-bold text-gray-900 dark:text-white">
            {p.name === 'revenue' ? fmt(p.value) : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function DemarrageBasicReports() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const [revenue, setRevenue] = useState(0)
  const [jobCount, setJobCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      // Importing here to avoid the top-level ordering rules with the inner component
      const { supabase } = await import('../supabase')
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { window.location.href = '/login'; return }
      const [{ data: inv }, { count: jc }] = await Promise.all([
        supabase.from('invoices').select('amount, status').eq('user_id', auth.user.id),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('user_id', auth.user.id),
      ])
      const total = (inv || []).filter((i) => i.status === 'paid').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
      setRevenue(total)
      setJobCount(jc || 0)
      setLoading(false)
    })()
  }, [])

  if (loading) return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-2">
      {[...Array(2)].map((_, i) => <SkeletonKPICard key={i} />)}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">{fr ? 'Revenus encaissés (à vie)' : 'Collected revenue (all time)'}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">${revenue.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">{fr ? 'Interventions totales' : 'Total jobs'}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{jobCount}</p>
        </div>
      </div>

      {/* Locked advanced section */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
          <Lock className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {fr ? 'Débloquez les rapports complets avec Pro' : 'Unlock full reports with Pro'}
        </h2>
        <p className="text-sm text-gray-600 max-w-lg mx-auto mb-5">
          {fr
            ? 'Tendances de revenus, taux de recouvrement, top clients, vieillissement des créances, export CSV et plus encore.'
            : 'Revenue trends, collection rate, top customers, AR aging, CSV export, and more.'}
        </p>
        <Link
          href="/subscribe"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md"
        >
          {fr ? 'Passer au Pro' : 'Upgrade to Pro'}
        </Link>
      </div>
    </div>
  )
}

function ReportsGate({ children }: { children: React.ReactNode }) {
  const plan = usePlan()
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  if (plan.loading) return <>{children}</>
  // Démarrage gets a simplified "basic stats only" view plus an upsell card.
  if (normalizePlan(plan.plan) === 'demarrage' || !plan.isFeatureAvailable('fullReports')) {
    return (
      <AppLayout title={fr ? 'Rapports' : 'Reports'}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          <DemarrageBasicReports />
        </div>
      </AppLayout>
    )
  }
  return <>{children}</>
}

function ReportsPageInner() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const MONTHS_SHORT = fr ? MONTHS_SHORT_FR : MONTHS_SHORT_EN
  const [period, setPeriod]     = useState<Period>('90d')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [jobs, setJobs]         = useState<Job[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { window.location.href = '/login'; return }
      const [{ data: inv }, { data: j }, { data: c }] = await Promise.all([
        supabase.from('invoices').select('id, amount, status, created_at, paid_at, line_items, customers(name)').eq('user_id', auth.user.id).order('created_at'),
        supabase.from('jobs').select('id, status, created_at, updated_at, customers(name)').eq('user_id', auth.user.id).order('created_at'),
        supabase.from('customers').select('id, name, created_at').eq('user_id', auth.user.id).order('created_at'),
      ])
      setInvoices((inv || []) as unknown as Invoice[])
      setJobs((j || []) as unknown as Job[])
      setCustomers(c || [])
      setLoading(false)
    }
    init()
  }, [])

  const periodCutoff = (): Date | null => {
    const d = PERIOD_DAYS[period]
    if (d === null) return null
    if (d === -1) return new Date(new Date().getFullYear(), 0, 1) // YTD
    return new Date(Date.now() - d * 86400000)
  }
  const filterByPeriod = <T extends { created_at: string }>(data: T[]) => {
    const cutoff = periodCutoff()
    if (!cutoff) return data
    return data.filter((d) => new Date(d.created_at) >= cutoff)
  }

  const filteredInvoices  = filterByPeriod(invoices)
  const filteredJobs      = filterByPeriod(jobs)
  const filteredCustomers = filterByPeriod(customers)

  // Revenue by month (always last 12 months from PAID invoices via paid_at).
  // Independent of period filter so the trend always shows the full year.
  const revenueByMonth = () => {
    const now = new Date()
    const months: { key: string; label: string; revenue: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: `${MONTHS_SHORT[d.getMonth()]} '${d.getFullYear().toString().slice(2)}`,
        revenue: 0,
      })
    }
    const idx = new Map(months.map((m, i) => [m.key, i]))
    invoices.forEach((inv) => {
      if (inv.status !== 'paid') return
      const ts = inv.paid_at || inv.created_at
      if (!ts) return
      const d = new Date(ts)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const i = idx.get(key)
      if (i !== undefined) months[i].revenue += parseFloat(String(inv.amount))
    })
    return months.map((m) => ({ month: m.label, revenue: m.revenue }))
  }

  // Jobs COMPLETED per month (last 12 months, by updated_at fallback created_at)
  const completedJobsByMonth = () => {
    const now = new Date()
    const months: { key: string; label: string; jobs: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: MONTHS_SHORT[d.getMonth()],
        jobs: 0,
      })
    }
    const idx = new Map(months.map((m, i) => [m.key, i]))
    jobs.forEach((j) => {
      if (j.status !== 'complete') return
      const ts = j.updated_at || j.created_at
      const d = new Date(ts)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const i = idx.get(key)
      if (i !== undefined) months[i].jobs += 1
    })
    return months.map((m) => ({ month: m.label, jobs: m.jobs }))
  }

  // Revenue by service (top 5) — pulled from invoices.line_items JSONB
  const revenueByService = () => {
    const map = new Map<string, number>()
    for (const inv of invoices) {
      if (inv.status !== 'paid') continue
      const items = Array.isArray(inv.line_items) ? inv.line_items : []
      for (const li of items) {
        const name = (li.description || (fr ? 'Sans description' : 'No description')).trim().slice(0, 60)
        const total = (Number(li.qty) || 1) * (Number(li.unit_price) || 0)
        map.set(name, (map.get(name) || 0) + total)
      }
    }
    return Array.from(map.entries())
      .map(([service, total]) => ({ service, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }

  // New customers per month (last 12 months)
  const newCustomersByMonth = () => {
    const now = new Date()
    const months: { key: string; label: string; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: MONTHS_SHORT[d.getMonth()],
        count: 0,
      })
    }
    const idx = new Map(months.map((m, i) => [m.key, i]))
    customers.forEach((c) => {
      const d = new Date(c.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const i = idx.get(key)
      if (i !== undefined) months[i].count += 1
    })
    return months.map((m) => ({ month: m.label, count: m.count }))
  }

  // Job status distribution
  const jobStatusDist = () => {
    const counts: Record<string, number> = { scheduled: 0, in_progress: 0, complete: 0, cancelled: 0 }
    filteredJobs.forEach((j) => { counts[j.status] = (counts[j.status] || 0) + 1 })
    return [
      { name: fr ? 'Planifi\u00e9e' : 'Scheduled',     value: counts.scheduled,   color: '#3b82f6' },
      { name: fr ? 'En cours' : 'In progress',       value: counts.in_progress, color: '#f59e0b' },
      { name: fr ? 'Compl\u00e9t\u00e9e' : 'Completed', value: counts.complete,    color: '#10b981' },
      { name: fr ? 'Annul\u00e9e' : 'Cancelled',     value: counts.cancelled,   color: '#d1d5db' },
    ].filter((d) => d.value > 0)
  }

  // Top customers by revenue
  const topCustomers = () => {
    const map: Record<string, { name: string; revenue: number; invoices: number }> = {}
    filteredInvoices.forEach((inv) => {
      const name = inv.customers?.name || (fr ? 'Inconnu' : 'Unknown')
      if (!map[name]) map[name] = { name, revenue: 0, invoices: 0 }
      map[name].revenue += parseFloat(String(inv.amount))
      map[name].invoices++
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
  }

  // Key metrics ----------------------------------------------------------
  const paidInvoices       = filteredInvoices.filter((i) => i.status === 'paid')
  const collectionRatePct  = filteredInvoices.length > 0
    ? Math.round((paidInvoices.length / filteredInvoices.length) * 100)
    : 0
  // Days to payment: average across paid invoices that have both timestamps
  const paymentDelays = paidInvoices
    .map((i) => {
      const created = new Date(i.created_at).getTime()
      const paid = i.paid_at ? new Date(i.paid_at).getTime() : null
      return paid && paid > created ? (paid - created) / 86400000 : null
    })
    .filter((d): d is number => d !== null && Number.isFinite(d))
  const avgDSO = paymentDelays.length > 0
    ? Math.round(paymentDelays.reduce((s, d) => s + d, 0) / paymentDelays.length)
    : 0
  const avgInvoiceValue = paidInvoices.length > 0
    ? paidInvoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0) / paidInvoices.length
    : 0

  // AR aging
  const arAging = () => {
    const buckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
    const now = Date.now()
    invoices.filter((i) => i.status !== 'paid').forEach((inv) => {
      const age = Math.floor((now - new Date(inv.created_at).getTime()) / 86400000)
      const amt = parseFloat(String(inv.amount))
      if (age <= 0) buckets.current += amt
      else if (age <= 30) buckets['1-30'] += amt
      else if (age <= 60) buckets['31-60'] += amt
      else if (age <= 90) buckets['61-90'] += amt
      else buckets['90+'] += amt
    })
    return Object.entries(buckets).map(([bucket, amount]) => ({ bucket, amount }))
  }

  const exportCSV = () => {
    const rows: string[][] = []
    const periodLabel = fr
      ? (period === '7d' ? '7 jours' : period === '30d' ? '30 jours' : period === '90d' ? '90 jours' : period === 'ytd' ? 'Cette année' : 'Tout')
      : (period === '7d' ? '7 days' : period === '30d' ? '30 days' : period === '90d' ? '90 days' : period === 'ytd' ? 'Year to date' : 'All')
    rows.push([fr ? '=== RAPPORT GESTIVIO ===' : '=== GESTIVIO REPORT ==='])
    rows.push([fr ? `Période: ${periodLabel}` : `Period: ${periodLabel}`])
    rows.push([`${fmtDate(new Date().toISOString().slice(0,10), lang)}`])
    rows.push([])

    // Revenue summary
    rows.push([fr ? '=== RÉSUMÉ DES REVENUS ===' : '=== REVENUE SUMMARY ==='])
    rows.push([fr ? 'Métrique' : 'Metric', fr ? 'Valeur' : 'Value'])
    rows.push([fr ? 'Revenus totaux' : 'Total revenue', fmt(filteredInvoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0))])
    rows.push([fr ? 'Encaissé' : 'Collected', fmt(filteredInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + parseFloat(String(i.amount)), 0))])
    rows.push([fr ? 'Impayés' : 'Unpaid', fmt(filteredInvoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + parseFloat(String(i.amount)), 0))])
    rows.push([fr ? 'Taux de recouvrement' : 'Collection rate', `${collectionRatePct}%`])
    rows.push([fr ? 'Délai moyen de paiement (j)' : 'Average payment time (days)', String(avgDSO)])
    rows.push([fr ? 'Valeur moyenne de facture' : 'Average invoice value', fmt(avgInvoiceValue)])
    rows.push([fr ? 'Nb interventions' : 'Jobs count', String(filteredJobs.length)])
    rows.push([fr ? 'Nb nouveaux clients' : 'New customers count', String(filteredCustomers.length)])
    rows.push([])

    // Invoices detail
    rows.push([fr ? '=== FACTURES ===' : '=== INVOICES ==='])
    rows.push([fr ? 'Client' : 'Customer', fr ? 'Montant' : 'Amount', fr ? 'Statut' : 'Status', 'Date'])
    filteredInvoices.forEach((inv) => {
      rows.push([
        inv.customers?.name || (fr ? 'Inconnu' : 'Unknown'),
        fmt(parseFloat(String(inv.amount))),
        inv.status,
        fmtDate(inv.created_at, lang),
      ])
    })
    rows.push([])

    // Jobs detail
    rows.push([fr ? '=== INTERVENTIONS ===' : '=== JOBS ==='])
    rows.push([fr ? 'Client' : 'Customer', fr ? 'Statut' : 'Status', 'Date'])
    filteredJobs.forEach((j) => {
      rows.push([
        j.customers?.name || (fr ? 'Inconnu' : 'Unknown'),
        j.status,
        fmtDate(j.created_at, lang),
      ])
    })

    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fr ? 'rapport' : 'report'}-gestivio-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalRevenue  = filteredInvoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0)
  const collectedRev  = filteredInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
  const outstandingRev = totalRevenue - collectedRev
  const completedJobs = filteredJobs.filter((j) => j.status === 'complete').length
  const completionRate = filteredJobs.length > 0 ? (completedJobs / filteredJobs.length * 100).toFixed(0) : '0'

  const prevInvoices  = invoices.filter((i) => {
    const d = PERIOD_DAYS[period]
    if (d === null) return false
    const days = d === -1
      ? Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000)
      : d
    const t = new Date(i.created_at).getTime()
    const diffDays = (Date.now() - t) / 86400000
    return diffDays > days && diffDays <= days * 2
  })
  const prevRevenue = prevInvoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0)
  const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(0) : null

  if (loading) return (
    <AppLayout title={fr ? 'Rapports' : 'Reports'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <SkeletonKPICard key={i} />)}
        </div>
        <SkeletonChart className="h-72" />
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonChart className="h-64" />
          <SkeletonChart className="h-64" />
        </div>
      </div>
    </AppLayout>
  )

  if (invoices.length === 0 && jobs.length === 0) {
    return (
      <AppLayout title={fr ? 'Rapports' : 'Reports'}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <EmptyState
              icon={BarChart3}
              title={fr ? 'Pas encore de données' : 'No data yet'}
              description={fr ? 'Les rapports apparaîtront une fois que vous aurez des factures et interventions.' : 'Reports will appear once you have invoices and jobs.'}
            />
          </div>
        </div>
      </AppLayout>
    )
  }

  const periodOptions: [Period, string][] = fr
    ? [['7d', '7 jours'], ['30d', '30 jours'], ['90d', '90 jours'], ['ytd', "Cette année"], ['all', 'Tout']]
    : [['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days'], ['ytd', 'Year to date'], ['all', 'All']]

  return (
    <AppLayout title={fr ? 'Rapports' : 'Reports'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

        {/* Period selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex-wrap">
            {periodOptions.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={['rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all', period === key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" /> {fr ? 'Exporter CSV' : 'Export CSV'}
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: fr ? 'Revenus totaux' : 'Total revenue', value: fmt(totalRevenue),
              icon: DollarSign, bg: 'bg-emerald-50', color: 'text-emerald-600',
              change: revenueChange ? `${revenueChange > '0' ? '+' : ''}${revenueChange}% ${fr ? 'vs période précédente' : 'vs previous period'}` : null,
              up: revenueChange ? parseInt(revenueChange) >= 0 : null,
            },
            {
              label: fr ? 'Encaissé' : 'Collected', value: fmt(collectedRev),
              icon: TrendingUp, bg: 'bg-indigo-50', color: 'text-indigo-600',
              change: `${totalRevenue > 0 ? (collectedRev / totalRevenue * 100).toFixed(0) : 0}% ${fr ? 'taux de recouvrement' : 'collection rate'}`, up: null,
            },
            {
              label: fr ? 'Impayés' : 'Unpaid', value: fmt(outstandingRev),
              icon: DollarSign, bg: 'bg-amber-50', color: 'text-amber-600',
              change: fr
                ? `${filteredInvoices.filter((i) => i.status !== 'paid').length} factures non payées`
                : `${filteredInvoices.filter((i) => i.status !== 'paid').length} unpaid invoices`, up: null,
            },
            {
              label: fr ? 'Interventions créées' : 'Jobs created', value: filteredJobs.length,
              icon: Briefcase, bg: 'bg-violet-50', color: 'text-violet-600',
              change: `${completionRate}% ${fr ? 'taux de complétion' : 'completion rate'}`, up: null,
            },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.bg} mb-3`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-xs font-medium text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{card.value}</p>
              {card.change && (
                <p className={`mt-1 text-xs flex items-center gap-0.5 ${card.up === true ? 'text-emerald-600' : card.up === false ? 'text-red-500' : 'text-gray-400'}`}>
                  {card.up === true && <ArrowUpRight className="h-3 w-3" />}
                  {card.up === false && <ArrowDownRight className="h-3 w-3" />}
                  {card.change}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue trend */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{fr ? 'Tendance des revenus' : 'Revenue trend'}</h2>
            <p className="text-xs text-gray-400 mb-5">{fr ? 'Montant total facturé par mois' : 'Total invoiced amount per month'}</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueByMonth()}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Job status pie */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{fr ? 'Statut des interventions' : 'Job status'}</h2>
            <p className="text-xs text-gray-400 mb-4">{fr ? 'Répartition pour la période' : 'Breakdown for the period'}</p>
            {jobStatusDist().length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={jobStatusDist()} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {jobStatusDist().map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(val, name) => [`${val} ${fr ? 'interventions' : 'jobs'}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {jobStatusDist().map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: d.color }} />{d.name}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">{fr ? 'Aucune donnée pour cette période' : 'No data for this period'}</div>
            )}
          </div>
        </div>

        {/* Jobs per month + AR aging */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{fr ? 'Interventions compl\u00e9t\u00e9es par mois' : 'Completed jobs per month'}</h2>
            <p className="text-xs text-gray-400 mb-5">{fr ? '12 derniers mois \u00b7 statut = Compl\u00e9t\u00e9e (par updated_at)' : 'Last 12 months \u00b7 status = Completed (by updated_at)'}</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={completedJobsByMonth()} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="jobs" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AR aging */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{fr ? 'Vieillissement des créances' : 'AR aging'}</h2>
            <p className="text-xs text-gray-400 mb-4">{fr ? 'Factures impayées par ancienneté (jours)' : 'Unpaid invoices by age (days)'}</p>
            <div className="space-y-3">
              {arAging().map(({ bucket, amount }) => {
                const isOverdue = bucket !== 'current'
                return (
                  <div key={bucket} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full ${bucket === 'current' ? 'bg-blue-400' : bucket === '1-30' ? 'bg-amber-400' : bucket === '31-60' ? 'bg-orange-500' : 'bg-red-500'}`} />
                      <span className="text-gray-600">{bucket === 'current' ? (fr ? 'Courant' : 'Current') : `${bucket} ${fr ? 'jours' : 'days'}`}</span>
                    </div>
                    <span className={`text-sm font-semibold ${isOverdue && amount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{fmt(amount)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Key metrics strip */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500">{fr ? 'Taux de recouvrement' : 'Collection rate'}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums mt-1">{collectionRatePct}%</p>
            <p className="text-xs text-gray-400 mt-1">{paidInvoices.length} {fr ? 'payées sur' : 'paid of'} {filteredInvoices.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500">{fr ? 'Délai moyen de paiement' : 'Average payment time'}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums mt-1">{avgDSO} <span className="text-base font-medium text-gray-500">{fr ? 'jours' : 'days'}</span></p>
            <p className="text-xs text-gray-400 mt-1">{fr ? 'Création → paiement' : 'Created → paid'}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500">{fr ? 'Valeur moyenne' : 'Average value'}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums mt-1">{fmt(avgInvoiceValue)}</p>
            <p className="text-xs text-gray-400 mt-1">{fr ? 'Par facture payée' : 'Per paid invoice'}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500">{fr ? 'Nouveaux clients' : 'New customers'}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums mt-1">{filteredCustomers.length}</p>
            <p className="text-xs text-gray-400 mt-1">{fr ? 'Sur la période' : 'Over the period'}</p>
          </div>
        </div>

        {/* Revenue by service + New customers per month */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{fr ? 'Revenus par service' : 'Revenue by service'}</h2>
            <p className="text-xs text-gray-400 mb-5">{fr ? 'Top 5 · factures payées' : 'Top 5 · paid invoices'}</p>
            {revenueByService().length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">{fr ? 'Aucune facture payée pour le moment' : 'No paid invoices yet'}</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueByService()} layout="vertical" barSize={18} margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="service" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{fr ? 'Nouveaux clients par mois' : 'New customers per month'}</h2>
            <p className="text-xs text-gray-400 mb-5">{fr ? '12 derniers mois' : 'Last 12 months'}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={newCustomersByMonth()} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top customers */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{fr ? 'Top 10 clients par revenu' : 'Top 10 customers by revenue'}</h2>
          </div>
          {topCustomers().length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">{fr ? 'Aucune donnée de revenus pour cette période' : 'No revenue data for this period'}</div>
          ) : (
            <table className="min-w-full">
              <thead><tr className="bg-gray-50 dark:bg-gray-800/50">{(fr ? ['Client', 'Factures', 'Revenus', '% du total'] : ['Customer', 'Invoices', 'Revenue', '% of total']).map((c) => <th key={c} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{c}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {topCustomers().map((c, i) => (
                  <tr key={c.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.invoices}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">{fmt(c.revenue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 w-24">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${totalRevenue > 0 ? (c.revenue / totalRevenue * 100) : 0}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{totalRevenue > 0 ? (c.revenue / totalRevenue * 100).toFixed(0) : 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </AppLayout>
  )
}

export default function ReportsPage() {
  return (
    <ReportsGate>
      <ReportsPageInner />
    </ReportsGate>
  )
}
