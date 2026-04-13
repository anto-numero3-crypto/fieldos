'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import UpgradePrompt from '@/components/UpgradePrompt'
import { usePlan } from '@/lib/hooks/usePlan'
import EmptyState from '@/components/EmptyState'
import { SkeletonChart, SkeletonKPICard } from '@/components/ui/skeleton'
import { BarChart3 } from 'lucide-react'
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

const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']

type Period = '7d' | '30d' | '90d' | 'ytd' | 'all'

const PERIOD_DAYS: Record<Period, number | null> = {
  '7d': 7, '30d': 30, '90d': 90, 'ytd': -1, 'all': null,
}

const fmt  = (n: number) => `$${n.toLocaleString('en', { minimumFractionDigits: 0 })}`
const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n)

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-bold text-gray-900">
            {p.name === 'revenue' ? fmt(p.value) : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function ReportsGate({ children }: { children: React.ReactNode }) {
  const plan = usePlan()
  if (plan.loading) return <>{children}</>
  if (!plan.isFeatureAvailable('hasAnalytics')) {
    return (
      <AppLayout title="Rapports">
        <div className="p-6 sm:p-10">
          <UpgradePrompt
            variant="overlay"
            feature="Rapports et analyses"
            requiredPlan="pro"
            description="Suivez vos revenus, vos interventions et vos clients les plus fidèles avec des tableaux de bord complets — disponibles dès le forfait Pro."
          />
        </div>
      </AppLayout>
    )
  }
  return <>{children}</>
}

function ReportsPageInner() {
  const { lang } = useLanguage()
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
        const name = (li.description || 'Sans description').trim().slice(0, 60)
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
      { name: 'Planifié',   value: counts.scheduled,   color: '#3b82f6' },
      { name: 'En cours',   value: counts.in_progress, color: '#f59e0b' },
      { name: 'Terminé',    value: counts.complete,    color: '#10b981' },
      { name: 'Annulé',     value: counts.cancelled,   color: '#d1d5db' },
    ].filter((d) => d.value > 0)
  }

  // Top customers by revenue
  const topCustomers = () => {
    const map: Record<string, { name: string; revenue: number; invoices: number }> = {}
    filteredInvoices.forEach((inv) => {
      const name = inv.customers?.name || 'Unknown'
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
    const periodLabel = period === '7d' ? '7 jours' : period === '30d' ? '30 jours' : period === '90d' ? '90 jours' : period === 'ytd' ? 'Cette année' : 'Tout'
    rows.push(['=== RAPPORT GESTIVIO ==='])
    rows.push([`Période: ${periodLabel}`])
    rows.push([`${fmtDate(new Date().toISOString().slice(0,10), lang)}`])
    rows.push([])

    // Revenue summary
    rows.push(['=== RÉSUMÉ DES REVENUS ==='])
    rows.push(['Métrique', 'Valeur'])
    rows.push(['Revenus totaux', fmt(filteredInvoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0))])
    rows.push(['Encaissé', fmt(filteredInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + parseFloat(String(i.amount)), 0))])
    rows.push(['Impayés', fmt(filteredInvoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + parseFloat(String(i.amount)), 0))])
    rows.push(['Taux de recouvrement', `${collectionRatePct}%`])
    rows.push(['Délai moyen de paiement (j)', String(avgDSO)])
    rows.push(['Valeur moyenne de facture', fmt(avgInvoiceValue)])
    rows.push(['Nb interventions', String(filteredJobs.length)])
    rows.push(['Nb nouveaux clients', String(filteredCustomers.length)])
    rows.push([])

    // Invoices detail
    rows.push(['=== FACTURES ==='])
    rows.push(['Client', 'Montant', 'Statut', 'Date'])
    filteredInvoices.forEach((inv) => {
      rows.push([
        inv.customers?.name || 'Inconnu',
        fmt(parseFloat(String(inv.amount))),
        inv.status,
        fmtDate(inv.created_at, lang),
      ])
    })
    rows.push([])

    // Jobs detail
    rows.push(['=== INTERVENTIONS ==='])
    rows.push(['Client', 'Statut', 'Date'])
    filteredJobs.forEach((j) => {
      rows.push([
        j.customers?.name || 'Inconnu',
        j.status,
        fmtDate(j.created_at, lang),
      ])
    })

    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-gestivio-${new Date().toISOString().split('T')[0]}.csv`
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
    <AppLayout title="Rapports">
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
      <AppLayout title="Rapports">
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white">
            <EmptyState
              icon={BarChart3}
              title="Pas encore de données"
              description="Les rapports apparaîtront une fois que vous aurez des factures et emplois."
            />
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Rapports">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

        {/* Period selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
            {([['7d', '7 jours'], ['30d', '30 jours'], ['90d', '90 jours'], ['ytd', "Cette année"], ['all', 'Tout']] as [Period, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={['rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all', period === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" /> Exporter CSV
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Revenus totaux', value: fmt(totalRevenue),
              icon: DollarSign, bg: 'bg-emerald-50', color: 'text-emerald-600',
              change: revenueChange ? `${revenueChange > '0' ? '+' : ''}${revenueChange}% vs période précédente` : null,
              up: revenueChange ? parseInt(revenueChange) >= 0 : null,
            },
            {
              label: 'Encaissé', value: fmt(collectedRev),
              icon: TrendingUp, bg: 'bg-indigo-50', color: 'text-indigo-600',
              change: `${totalRevenue > 0 ? (collectedRev / totalRevenue * 100).toFixed(0) : 0}% taux de recouvrement`, up: null,
            },
            {
              label: 'Impayés', value: fmt(outstandingRev),
              icon: DollarSign, bg: 'bg-amber-50', color: 'text-amber-600',
              change: `${filteredInvoices.filter((i) => i.status !== 'paid').length} factures non payées`, up: null,
            },
            {
              label: 'Interventions créées', value: filteredJobs.length,
              icon: Briefcase, bg: 'bg-violet-50', color: 'text-violet-600',
              change: `${completionRate}% taux de complétion`, up: null,
            },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.bg} mb-3`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-xs font-medium text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{card.value}</p>
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
          <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Tendance des revenus</h2>
            <p className="text-xs text-gray-400 mb-5">Montant total facturé par mois</p>
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
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Statut des interventions</h2>
            <p className="text-xs text-gray-400 mb-4">Répartition pour la période</p>
            {jobStatusDist().length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={jobStatusDist()} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {jobStatusDist().map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(val, name) => [`${val} jobs`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {jobStatusDist().map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: d.color }} />{d.name}</span>
                      <span className="font-semibold text-gray-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Aucune donnée pour cette période</div>
            )}
          </div>
        </div>

        {/* Jobs per month + AR aging */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Emplois terminés par mois</h2>
            <p className="text-xs text-gray-400 mb-5">12 derniers mois · status = Terminé (par updated_at)</p>
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
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Vieillissement des créances</h2>
            <p className="text-xs text-gray-400 mb-4">Factures impayées par ancienneté (jours)</p>
            <div className="space-y-3">
              {arAging().map(({ bucket, amount }) => {
                const isOverdue = bucket !== 'current'
                return (
                  <div key={bucket} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full ${bucket === 'current' ? 'bg-blue-400' : bucket === '1-30' ? 'bg-amber-400' : bucket === '31-60' ? 'bg-orange-500' : 'bg-red-500'}`} />
                      <span className="text-gray-600">{bucket === 'current' ? 'Courant' : `${bucket} jours`}</span>
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
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Taux de recouvrement</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{collectionRatePct}%</p>
            <p className="text-xs text-gray-400 mt-1">{paidInvoices.length} payées sur {filteredInvoices.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Délai moyen de paiement</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{avgDSO} <span className="text-base font-medium text-gray-500">jours</span></p>
            <p className="text-xs text-gray-400 mt-1">Création → paiement</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Valeur moyenne</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{fmt(avgInvoiceValue)}</p>
            <p className="text-xs text-gray-400 mt-1">Par facture payée</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Nouveaux clients</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{filteredCustomers.length}</p>
            <p className="text-xs text-gray-400 mt-1">Sur la période</p>
          </div>
        </div>

        {/* Revenue by service + New customers per month */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Revenus par service</h2>
            <p className="text-xs text-gray-400 mb-5">Top 5 · factures payées</p>
            {revenueByService().length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Aucune facture payée pour le moment</div>
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

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Nouveaux clients par mois</h2>
            <p className="text-xs text-gray-400 mb-5">12 derniers mois</p>
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
            <h2 className="text-sm font-semibold text-gray-900">Top 10 clients par revenu</h2>
          </div>
          {topCustomers().length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">Aucune donnée de revenus pour cette période</div>
          ) : (
            <table className="min-w-full">
              <thead><tr className="bg-gray-50">{['Client', 'Factures', 'Revenus', '% du total'].map((c) => <th key={c} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {topCustomers().map((c, i) => (
                  <tr key={c.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                        <span className="text-sm font-medium text-gray-900">{c.name}</span>
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
