'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import {
  Users, Briefcase, FileText, DollarSign, TrendingUp, ArrowRight,
  Plus, Sparkles, Clock, CheckCircle, AlertCircle, Calendar,
  ArrowUpRight, ArrowDownRight, Zap,
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from 'recharts'

interface Stats {
  customers: number; totalJobs: number; activeJobs: number
  completedJobs: number; totalInvoiced: number; paidAmount: number
  unpaidAmount: number; unpaidCount: number; overdueCount: number
}
interface RecentJob {
  id: string; title: string; status: string
  scheduled_date: string | null; customers: { name: string } | null
}
interface RecentInvoice {
  id: string; amount: number; status: string
  due_date: string | null; customers: { name: string } | null; created_at: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled:   { label: 'Scheduled',   className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  in_progress: { label: 'In Progress', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  complete:    { label: 'Complete',    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  cancelled:   { label: 'Cancelled',   className: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  unpaid:      { label: 'Unpaid',      className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  paid:        { label: 'Paid',        className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  overdue:     { label: 'Overdue',     className: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
}

function buildRevenueChart(invoices: RecentInvoice[]) {
  const months: Record<string, number> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleDateString('en', { month: 'short' })
    months[key] = 0
  }
  invoices.forEach((inv) => {
    const key = new Date(inv.created_at).toLocaleDateString('en', { month: 'short' })
    if (key in months) months[key] += parseFloat(String(inv.amount))
  })
  return Object.entries(months).map(([month, revenue]) => ({ month, revenue }))
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg">
        <p className="text-xs text-gray-500">{label}</p>
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
  })
  const [recentJobs, setRecentJobs]       = useState<RecentJob[]>([])
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([])
  const [chartData, setChartData]         = useState<{ month: string; revenue: number }[]>([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)

      const [{ count: customerCount }, { data: jobs }, { data: invoices }] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('user_id', data.user.id),
        supabase.from('jobs').select('id, title, status, scheduled_date, customers(name)').eq('user_id', data.user.id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('id, amount, status, due_date, customers(name), created_at').eq('user_id', data.user.id).order('created_at', { ascending: false }),
      ])

      const allInvoices = (invoices || []) as unknown as RecentInvoice[]
      const totalInvoiced  = allInvoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0)
      const paidAmount     = allInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
      const unpaidAmount   = allInvoices.filter((i) => i.status === 'unpaid').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
      const unpaidCount    = allInvoices.filter((i) => i.status === 'unpaid').length
      const overdueCount   = allInvoices.filter((i) => i.status === 'overdue').length
      const activeJobs     = (jobs || []).filter((j) => j.status === 'scheduled' || j.status === 'in_progress').length
      const completedJobs  = (jobs || []).filter((j) => j.status === 'complete').length

      setStats({ customers: customerCount || 0, totalJobs: (jobs || []).length, activeJobs, completedJobs, totalInvoiced, paidAmount, unpaidAmount, unpaidCount, overdueCount })
      setRecentJobs((jobs || []).slice(0, 5) as unknown as RecentJob[])
      setRecentInvoices(allInvoices.slice(0, 5))
      setChartData(buildRevenueChart(allInvoices))
      setLoading(false)
    }
    init()
  }, [])

  const fmt  = (n: number) => `$${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = user?.email?.split('@')[0] || ''

  if (loading) return (
    <AppLayout>
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <div className="h-8 w-48 skeleton" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-64 skeleton rounded-2xl" />
          <div className="h-64 skeleton rounded-2xl" />
        </div>
      </div>
    </AppLayout>
  )

  const collectionRate = stats.totalInvoiced > 0 ? (stats.paidAmount / stats.totalInvoiced) * 100 : 0
  const completionRate = stats.totalJobs > 0 ? (stats.completedJobs / stats.totalJobs) * 100 : 0

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{greeting}, {name} 👋</h1>
          <p className="mt-1 text-gray-500 text-sm">Here&apos;s an overview of your business today.</p>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Total Customers', value: stats.customers.toLocaleString(),
              icon: Users, href: '/customers', iconBg: 'bg-blue-50', iconColor: 'text-blue-600',
              sub: 'active clients', trend: null,
            },
            {
              title: 'Active Jobs', value: stats.activeJobs.toLocaleString(),
              icon: Briefcase, href: '/jobs', iconBg: 'bg-violet-50', iconColor: 'text-violet-600',
              sub: `${stats.completedJobs} completed`,
              trend: completionRate > 0 ? `${completionRate.toFixed(0)}% completion rate` : null,
            },
            {
              title: 'Total Revenue', value: fmt(stats.totalInvoiced),
              icon: DollarSign, href: '/invoices', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
              sub: fmt(stats.paidAmount) + ' collected',
              trend: collectionRate > 0 ? `${collectionRate.toFixed(0)}% collection rate` : null,
            },
            {
              title: 'Outstanding', value: fmt(stats.unpaidAmount),
              icon: stats.overdueCount > 0 ? AlertCircle : Clock,
              href: '/invoices', iconBg: stats.overdueCount > 0 ? 'bg-red-50' : 'bg-amber-50',
              iconColor: stats.overdueCount > 0 ? 'text-red-600' : 'text-amber-600',
              sub: stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : `${stats.unpaidCount} unpaid`,
              trend: null,
            },
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs font-medium text-gray-500 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{card.value}</p>
              <p className="mt-1 text-xs text-gray-400">{card.sub}</p>
            </Link>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue chart */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Revenue Trend</h2>
                <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">Revenue</span>
              </div>
            </div>
            {chartData.length > 0 && chartData.some((d) => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#colorRevenue)"
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, fill: '#6366f1' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-44">
                <div className="text-center">
                  <TrendingUp className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Revenue chart will appear once you have invoices</p>
                </div>
              </div>
            )}
          </div>

          {/* Job status donut + quick stats */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Job Status</h2>
              <p className="text-xs text-gray-400 mt-0.5">All time</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Scheduled',   value: stats.totalJobs > 0 ? (stats.activeJobs / stats.totalJobs) * 100 : 0, color: 'bg-blue-500', count: stats.activeJobs },
                { label: 'Completed',   value: stats.totalJobs > 0 ? (stats.completedJobs / stats.totalJobs) * 100 : 0, color: 'bg-emerald-500', count: stats.completedJobs },
                { label: 'Cancelled',   value: stats.totalJobs > 0 ? ((stats.totalJobs - stats.activeJobs - stats.completedJobs) / stats.totalJobs) * 100 : 0, color: 'bg-gray-300', count: Math.max(0, stats.totalJobs - stats.activeJobs - stats.completedJobs) },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">{row.label}</span>
                    <span className="text-xs font-semibold text-gray-900">{row.count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full progress-fill ${row.color}`}
                      style={{ width: `${Math.min(100, row.value)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" /> Collection rate</span>
                <span className="font-semibold text-gray-900">{collectionRate.toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1.5"><Zap className="h-4 w-4 text-amber-500" /> Active jobs</span>
                <span className="font-semibold text-gray-900">{stats.activeJobs}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Quick actions</h2>
          <div className="flex flex-wrap gap-2.5">
            {[
              { label: 'New Customer', href: '/customers', color: 'hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700', icon: Users },
              { label: 'New Job',      href: '/jobs',      color: 'hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700', icon: Briefcase },
              { label: 'New Quote',    href: '/quotes',    color: 'hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700', icon: FileText },
              { label: 'New Invoice',  href: '/invoices',  color: 'hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700', icon: DollarSign },
              { label: 'Ask AI',       href: '/assistant', color: 'hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700', icon: Sparkles },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-150 ${action.color}`}
              >
                <Plus className="h-4 w-4" />{action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent rows */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent jobs */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Recent Jobs</h2>
              <Link href="/jobs" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <div className="h-10 w-10 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                  <Briefcase className="h-5 w-5 text-violet-400" />
                </div>
                <p className="text-sm text-gray-500">No jobs yet</p>
                <Link href="/jobs" className="mt-2 text-xs font-medium text-indigo-600 hover:underline">Create your first job →</Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentJobs.map((job) => (
                  <li key={job.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50">
                      <Briefcase className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-400">
                        {job.customers?.name || 'No customer'}
                        {job.scheduled_date ? ` · ${new Date(job.scheduled_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}` : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[job.status]?.className || ''}`}>
                      {statusConfig[job.status]?.label || job.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent invoices */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Recent Invoices</h2>
              <Link href="/invoices" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <FileText className="h-5 w-5 text-emerald-400" />
                </div>
                <p className="text-sm text-gray-500">No invoices yet</p>
                <Link href="/invoices" className="mt-2 text-xs font-medium text-indigo-600 hover:underline">Create your first invoice →</Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentInvoices.map((inv) => (
                  <li key={inv.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{fmt(parseFloat(String(inv.amount)))}</p>
                      <p className="text-xs text-gray-400">
                        {inv.customers?.name || 'No customer'}
                        {inv.due_date ? ` · Due ${new Date(inv.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}` : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[inv.status]?.className || ''}`}>
                      {statusConfig[inv.status]?.label || inv.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* AI nudge */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-indigo-200" />
                <span className="text-sm font-semibold text-indigo-100">AI Business Insights</span>
              </div>
              <p className="text-base font-semibold mb-1">
                {stats.overdueCount > 0
                  ? `You have ${stats.overdueCount} overdue invoice${stats.overdueCount > 1 ? 's' : ''} — want me to draft reminder emails?`
                  : stats.unpaidCount > 0
                  ? `${stats.unpaidCount} invoice${stats.unpaidCount > 1 ? 's' : ''} awaiting payment. Ask me to analyze your cash flow.`
                  : 'Your business is on track. Ask me anything about your operations.'}
              </p>
              <p className="text-sm text-indigo-200">Your AI assistant has full access to your business data.</p>
            </div>
            <Link
              href="/assistant"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              Ask AI <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
