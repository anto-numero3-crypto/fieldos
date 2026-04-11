'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
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
}
interface Job {
  id: string; title: string; status: string
  scheduled_date: string | null; customers: { name: string } | null
  priority?: string
}
interface Invoice {
  id: string; amount: number; status: string
  due_date: string | null; customers: { name: string } | null; created_at: string
  invoice_number?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled:   { label: 'Scheduled',   className: 'bg-blue-50 text-blue-700' },
  in_progress: { label: 'In Progress', className: 'bg-amber-50 text-amber-700' },
  complete:    { label: 'Complete',    className: 'bg-emerald-50 text-emerald-700' },
  cancelled:   { label: 'Cancelled',   className: 'bg-gray-50 text-gray-500' },
  unpaid:      { label: 'Unpaid',      className: 'bg-amber-50 text-amber-700' },
  paid:        { label: 'Paid',        className: 'bg-emerald-50 text-emerald-700' },
  overdue:     { label: 'Overdue',     className: 'bg-red-50 text-red-700' },
}

function buildMonthlyRevenue(invoices: Invoice[]) {
  const months: Record<string, number> = {}
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleDateString('en', { month: 'short', year: '2-digit' })
    months[key] = 0
  }
  invoices.forEach((inv) => {
    if (inv.status === 'paid') {
      const key = new Date(inv.created_at).toLocaleDateString('en', { month: 'short', year: '2-digit' })
      if (key in months) months[key] += parseFloat(String(inv.amount))
    }
  })
  return Object.entries(months).map(([month, revenue]) => ({ month, revenue }))
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
  })
  const [todayJobs, setTodayJobs]           = useState<Job[]>([])
  const [recentJobs, setRecentJobs]         = useState<Job[]>([])
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [chartData, setChartData]           = useState<{ month: string; revenue: number }[]>([])
  const [loading, setLoading]               = useState(true)

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
      { data: jobs },
      { data: invoices },
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('user_id', data.user.id),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('user_id', data.user.id).gte('created_at', thisMonthStart),
      supabase.from('jobs').select('id, title, status, scheduled_date, priority, customers(name)').eq('user_id', data.user.id).order('created_at', { ascending: false }).limit(100),
      supabase.from('invoices').select('id, amount, status, due_date, customers(name), created_at, invoice_number').eq('user_id', data.user.id).order('created_at', { ascending: false }).limit(500),
    ])

    const allInvoices = (invoices || []) as unknown as Invoice[]
    const allJobs     = (jobs || []) as unknown as Job[]

    const totalInvoiced  = allInvoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0)
    const paidAmount     = allInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
    const unpaidAmount   = allInvoices.filter((i) => i.status === 'unpaid').reduce((s, i) => s + parseFloat(String(i.amount)), 0)
    const unpaidCount    = allInvoices.filter((i) => i.status === 'unpaid').length
    const overdueCount   = allInvoices.filter((i) => i.status === 'overdue').length
    const activeJobs     = allJobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress').length
    const completedJobs  = allJobs.filter((j) => j.status === 'complete').length

    const revenueThisMonth = allInvoices
      .filter((i) => i.status === 'paid' && i.created_at >= thisMonthStart)
      .reduce((s, i) => s + parseFloat(String(i.amount)), 0)

    const revenueLastMonth = allInvoices
      .filter((i) => i.status === 'paid' && i.created_at >= lastMonthStart && i.created_at < thisMonthStart)
      .reduce((s, i) => s + parseFloat(String(i.amount)), 0)

    const jobsThisMonth = allJobs.filter((j) => {
      const d = j.scheduled_date || ''
      return d >= thisMonthStart.split('T')[0]
    }).length

    setStats({
      customers: customerCount || 0, totalJobs: allJobs.length, activeJobs, completedJobs,
      totalInvoiced, paidAmount, unpaidAmount, unpaidCount, overdueCount,
      revenueThisMonth, revenueLastMonth, jobsThisMonth,
      newCustomersThisMonth: newCustomers || 0,
    })

    // Today's jobs
    setTodayJobs(allJobs.filter((j) => j.scheduled_date === todayStr))

    setRecentJobs(allJobs.slice(0, 6))
    setRecentInvoices(allInvoices.slice(0, 6))
    setChartData(buildMonthlyRevenue(allInvoices))
    setLoading(false)
  }, [])

  useEffect(() => {
    init()
  }, [init])

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

  const fmt        = (n: number) => `$${n.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const hour       = new Date().getHours()
  const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name       = user?.email?.split('@')[0] || ''
  const revenueΔ   = stats.revenueLastMonth > 0 ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100 : null
  const collectionRate = stats.totalInvoiced > 0 ? (stats.paidAmount / stats.totalInvoiced) * 100 : 0
  const completionRate = stats.totalJobs > 0 ? (stats.completedJobs / stats.totalJobs) * 100 : 0

  if (loading) return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="h-9 w-64 rounded-xl bg-gray-100 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-72 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="h-72 rounded-2xl bg-gray-100 animate-pulse" />
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
              {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{greeting}, {name} 👋</h1>
            <p className="mt-1 text-sm text-gray-500">
              {stats.overdueCount > 0
                ? `⚠️ You have ${stats.overdueCount} overdue invoice${stats.overdueCount > 1 ? 's' : ''} that need attention.`
                : stats.activeJobs > 0
                ? `You have ${stats.activeJobs} active job${stats.activeJobs > 1 ? 's' : ''} in progress.`
                : `Here's an overview of your business today.`}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link href="/jobs" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
              <Plus className="h-4 w-4" /> New Job
            </Link>
            <Link href="/invoices" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors">
              <Plus className="h-4 w-4" /> New Invoice
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
                  ? `${stats.overdueCount} overdue invoice${stats.overdueCount > 1 ? 's' : ''} — ${fmt(stats.unpaidAmount)} outstanding`
                  : `${stats.unpaidCount} invoice${stats.unpaidCount > 1 ? 's' : ''} awaiting payment — ${fmt(stats.unpaidAmount)}`}
              </p>
              <p className={`text-xs mt-0.5 ${stats.overdueCount > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                Send reminders to get paid faster
              </p>
            </div>
            <Link href="/invoices" className={`shrink-0 text-xs font-semibold hover:underline ${stats.overdueCount > 0 ? 'text-red-700' : 'text-amber-700'}`}>
              View invoices →
            </Link>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Revenue This Month',
              value: fmt(stats.revenueThisMonth),
              icon: DollarSign, href: '/invoices',
              iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
              sub: revenueΔ !== null
                ? `${revenueΔ >= 0 ? '↑' : '↓'} ${Math.abs(revenueΔ).toFixed(0)}% vs last month`
                : `${fmt(stats.paidAmount)} total collected`,
              subColor: revenueΔ !== null ? (revenueΔ >= 0 ? 'text-emerald-600' : 'text-red-500') : 'text-gray-400',
              highlight: false,
            },
            {
              title: 'Jobs This Month',
              value: stats.jobsThisMonth.toString(),
              icon: Briefcase, href: '/jobs',
              iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
              sub: `${stats.activeJobs} active · ${stats.completedJobs} done`,
              subColor: 'text-gray-400',
              highlight: false,
            },
            {
              title: 'Outstanding',
              value: fmt(stats.unpaidAmount),
              icon: stats.overdueCount > 0 ? AlertCircle : Clock,
              href: '/invoices',
              iconBg: stats.overdueCount > 0 ? 'bg-red-100' : 'bg-amber-100',
              iconColor: stats.overdueCount > 0 ? 'text-red-600' : 'text-amber-600',
              sub: stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : `${stats.unpaidCount} unpaid`,
              subColor: stats.overdueCount > 0 ? 'text-red-500' : 'text-amber-500',
              highlight: stats.overdueCount > 0,
            },
            {
              title: 'New Customers',
              value: stats.newCustomersThisMonth.toString(),
              icon: Users, href: '/customers',
              iconBg: 'bg-violet-100', iconColor: 'text-violet-600',
              sub: `${stats.customers} total clients`,
              subColor: 'text-gray-400',
              highlight: false,
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
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
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
                <h2 className="text-sm font-semibold text-gray-900">Revenue</h2>
                <p className="text-xs text-gray-400 mt-0.5">Collected · Last 12 months</p>
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
                  <p className="text-sm text-gray-400">Revenue chart will appear once you have paid invoices</p>
                  <Link href="/invoices" className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:underline">Create an invoice →</Link>
                </div>
              </div>
            )}
          </div>

          {/* Job stats */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Performance</h2>
              <p className="text-xs text-gray-400 mt-0.5">All time</p>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Job completion', value: completionRate, color: 'bg-emerald-500', icon: Target },
                { label: 'Invoice collection', value: collectionRate, color: 'bg-indigo-500', icon: CheckCircle },
                { label: 'Active workload', value: stats.totalJobs > 0 ? (stats.activeJobs / stats.totalJobs) * 100 : 0, color: 'bg-blue-400', icon: Activity },
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
                <p className="text-xs text-gray-400">Total jobs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.customers}</p>
                <p className="text-xs text-gray-400">Customers</p>
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
                <h2 className="text-sm font-semibold text-indigo-900">Today&apos;s Schedule</h2>
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">{todayJobs.length}</span>
              </div>
              <Link href="/schedule" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Full calendar <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-indigo-100">
              {todayJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-indigo-50 transition-colors"
                >
                  <div className={`h-2 w-2 rounded-full shrink-0 ${job.status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.customers?.name || 'No customer'}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[job.status]?.className || ''}`}>
                    {statusConfig[job.status]?.label || job.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'New Customer', href: '/customers', color: 'hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700', icon: Users },
              { label: 'New Job',      href: '/jobs',      color: 'hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700', icon: Briefcase },
              { label: 'New Quote',    href: '/quotes',    color: 'hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700', icon: FileText },
              { label: 'New Invoice',  href: '/invoices',  color: 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700', icon: DollarSign },
              { label: 'Schedule',     href: '/schedule',  color: 'hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700', icon: Calendar },
              { label: 'Reports',      href: '/reports',   color: 'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700', icon: TrendingUp },
              { label: 'Ask AI',       href: '/assistant', color: 'hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700', icon: Sparkles },
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
              <h2 className="text-sm font-semibold text-gray-900">Recent Jobs</h2>
              <Link href="/jobs" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-3">
                  <Briefcase className="h-6 w-6 text-violet-300" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">No jobs yet</p>
                <p className="text-xs text-gray-400 mb-3">Create your first work order to get started</p>
                <Link href="/jobs" className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
                  <Plus className="h-3.5 w-3.5" /> Create job
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
                          {job.customers?.name || 'No customer'}
                          {job.scheduled_date ? ` · ${new Date(job.scheduled_date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[job.status]?.className || ''}`}>
                        {statusConfig[job.status]?.label || job.status}
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
              <h2 className="text-sm font-semibold text-gray-900">Recent Invoices</h2>
              <Link href="/invoices" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-emerald-300" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">No invoices yet</p>
                <p className="text-xs text-gray-400 mb-3">Create an invoice to start getting paid</p>
                <Link href="/invoices" className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
                  <Plus className="h-3.5 w-3.5" /> Create invoice
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
                          <p className="text-sm font-bold text-gray-900">${parseFloat(String(inv.amount)).toLocaleString('en', { minimumFractionDigits: 2 })}</p>
                          {inv.invoice_number && <span className="text-xs text-gray-400">{inv.invoice_number}</span>}
                        </div>
                        <p className="text-xs text-gray-400">
                          {inv.customers?.name || 'No customer'}
                          {inv.due_date ? ` · Due ${new Date(inv.due_date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[inv.status]?.className || ''}`}>
                        {statusConfig[inv.status]?.label || inv.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Revenue breakdown bar */}
        {chartData.some((d) => d.revenue > 0) && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Monthly Revenue Breakdown</h2>
                <p className="text-xs text-gray-400 mt-0.5">Collected revenue by month</p>
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
                <span className="text-sm font-semibold text-indigo-100">AI Business Insights</span>
              </div>
              <p className="text-base font-semibold mb-1">
                {stats.overdueCount > 0
                  ? `${stats.overdueCount} overdue invoice${stats.overdueCount > 1 ? 's' : ''} — want AI to draft payment reminders?`
                  : stats.unpaidCount > 0
                  ? `${stats.unpaidCount} invoice${stats.unpaidCount > 1 ? 's' : ''} pending. Ask AI to analyze your cash flow.`
                  : `Your business is running smoothly. Ask AI for insights or to create records.`}
              </p>
              <p className="text-sm text-indigo-200">Your AI assistant has real-time access to all your business data.</p>
            </div>
            <Link href="/assistant" className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
              Ask AI <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
