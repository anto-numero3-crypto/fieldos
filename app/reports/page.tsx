'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { TrendingUp, DollarSign, Briefcase, Users, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react'

interface Invoice { id: string; amount: number; status: string; created_at: string; customers: { name: string } | null }
interface Job { id: string; status: string; created_at: string; customers: { name: string } | null }
interface Customer { id: string; name: string; created_at: string }

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

type Period = '30d' | '90d' | '1y' | 'all'

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

export default function ReportsPage() {
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
        supabase.from('invoices').select('id, amount, status, created_at, customers(name)').eq('user_id', auth.user.id).order('created_at'),
        supabase.from('jobs').select('id, status, created_at, customers(name)').eq('user_id', auth.user.id).order('created_at'),
        supabase.from('customers').select('id, name, created_at').eq('user_id', auth.user.id).order('created_at'),
      ])
      setInvoices((inv || []) as unknown as Invoice[])
      setJobs((j || []) as unknown as Job[])
      setCustomers(c || [])
      setLoading(false)
    }
    init()
  }, [])

  const filterByPeriod = <T extends { created_at: string }>(data: T[]) => {
    if (period === 'all') return data
    const days = period === '30d' ? 30 : period === '90d' ? 90 : 365
    const cutoff = new Date(Date.now() - days * 86400000)
    return data.filter((d) => new Date(d.created_at) >= cutoff)
  }

  const filteredInvoices  = filterByPeriod(invoices)
  const filteredJobs      = filterByPeriod(jobs)
  const filteredCustomers = filterByPeriod(customers)

  // Revenue by month
  const revenueByMonth = () => {
    const months: Record<string, number> = {}
    const numMonths = period === '30d' ? 3 : period === '90d' ? 3 : period === '1y' ? 12 : 6
    const now = new Date()
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months[`${MONTHS_SHORT[d.getMonth()]} '${d.getFullYear().toString().slice(2)}`] = 0
    }
    filteredInvoices.forEach((inv) => {
      const d = new Date(inv.created_at)
      const key = `${MONTHS_SHORT[d.getMonth()]} '${d.getFullYear().toString().slice(2)}`
      if (key in months) months[key] += parseFloat(String(inv.amount))
    })
    return Object.entries(months).map(([month, revenue]) => ({ month, revenue }))
  }

  // Jobs by month
  const jobsByMonth = () => {
    const months: Record<string, number> = {}
    const numMonths = period === '30d' ? 3 : period === '90d' ? 3 : period === '1y' ? 12 : 6
    const now = new Date()
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months[`${MONTHS_SHORT[d.getMonth()]}`] = 0
    }
    filteredJobs.forEach((j) => {
      const key = MONTHS_SHORT[new Date(j.created_at).getMonth()]
      if (key in months) months[key]++
    })
    return Object.entries(months).map(([month, jobs]) => ({ month, jobs }))
  }

  // Job status distribution
  const jobStatusDist = () => {
    const counts: Record<string, number> = { scheduled: 0, in_progress: 0, complete: 0, cancelled: 0 }
    filteredJobs.forEach((j) => { counts[j.status] = (counts[j.status] || 0) + 1 })
    return [
      { name: 'Scheduled',   value: counts.scheduled,   color: '#3b82f6' },
      { name: 'In Progress', value: counts.in_progress, color: '#f59e0b' },
      { name: 'Complete',    value: counts.complete,    color: '#10b981' },
      { name: 'Cancelled',   value: counts.cancelled,   color: '#d1d5db' },
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
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  }

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

  const totalRevenue  = filteredInvoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0)
  const collectedRev  = filteredInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
  const outstandingRev = totalRevenue - collectedRev
  const completedJobs = filteredJobs.filter((j) => j.status === 'complete').length
  const completionRate = filteredJobs.length > 0 ? (completedJobs / filteredJobs.length * 100).toFixed(0) : '0'

  const prevInvoices  = invoices.filter((i) => {
    const days = period === '30d' ? 30 : period === '90d' ? 90 : period === '1y' ? 365 : 9999
    const d = new Date(i.created_at)
    const now = new Date()
    const diffDays = (now.getTime() - d.getTime()) / 86400000
    return diffDays > days && diffDays <= days * 2
  })
  const prevRevenue = prevInvoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0)
  const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(0) : null

  if (loading) return (
    <AppLayout title="Reports">
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    </AppLayout>
  )

  return (
    <AppLayout title="Reports">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

        {/* Period selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {([['30d', 'Last 30 days'], ['90d', 'Last 90 days'], ['1y', 'Last year'], ['all', 'All time']] as [Period, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={['rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all', period === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Revenue', value: fmt(totalRevenue),
              icon: DollarSign, bg: 'bg-emerald-50', color: 'text-emerald-600',
              change: revenueChange ? `${revenueChange > '0' ? '+' : ''}${revenueChange}% vs prev period` : null,
              up: revenueChange ? parseInt(revenueChange) >= 0 : null,
            },
            {
              label: 'Collected', value: fmt(collectedRev),
              icon: TrendingUp, bg: 'bg-indigo-50', color: 'text-indigo-600',
              change: `${totalRevenue > 0 ? (collectedRev / totalRevenue * 100).toFixed(0) : 0}% collection rate`, up: null,
            },
            {
              label: 'Outstanding', value: fmt(outstandingRev),
              icon: DollarSign, bg: 'bg-amber-50', color: 'text-amber-600',
              change: `${filteredInvoices.filter((i) => i.status !== 'paid').length} unpaid invoices`, up: null,
            },
            {
              label: 'Jobs Created', value: filteredJobs.length,
              icon: Briefcase, bg: 'bg-violet-50', color: 'text-violet-600',
              change: `${completionRate}% completion rate`, up: null,
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
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Revenue Trend</h2>
            <p className="text-xs text-gray-400 mb-5">Total invoiced amount by month</p>
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
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Job Status</h2>
            <p className="text-xs text-gray-400 mb-4">Distribution for period</p>
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
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No job data for this period</div>
            )}
          </div>
        </div>

        {/* Jobs per month + AR aging */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Jobs Created per Month</h2>
            <p className="text-xs text-gray-400 mb-5">Volume of new work orders</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={jobsByMonth()} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="jobs" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AR aging */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Accounts Receivable Aging</h2>
            <p className="text-xs text-gray-400 mb-4">Outstanding invoices by age (days)</p>
            <div className="space-y-3">
              {arAging().map(({ bucket, amount }) => {
                const isOverdue = bucket !== 'current'
                return (
                  <div key={bucket} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full ${bucket === 'current' ? 'bg-blue-400' : bucket === '1-30' ? 'bg-amber-400' : bucket === '31-60' ? 'bg-orange-500' : 'bg-red-500'}`} />
                      <span className="text-gray-600">{bucket === 'current' ? 'Current' : `${bucket} days`}</span>
                    </div>
                    <span className={`text-sm font-semibold ${isOverdue && amount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{fmt(amount)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top customers */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Top Customers by Revenue</h2>
          </div>
          {topCustomers().length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">No revenue data for this period</div>
          ) : (
            <table className="min-w-full">
              <thead><tr className="bg-gray-50">{['Customer', 'Invoices', 'Revenue', '% of Total'].map((c) => <th key={c} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{c}</th>)}</tr></thead>
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
