'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import {
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Users, DollarSign, Briefcase, Zap, ArrowRight, RefreshCw,
  ChevronRight, Star, Clock, Target, Activity,
} from 'lucide-react'

interface Recommendation {
  id: string
  type: 'revenue' | 'customer' | 'operations' | 'pricing' | 'churn'
  impact: 'High' | 'Medium' | 'Low'
  title: string
  description: string
  estimatedRevenue: number | null
  action: string
  actionHref: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
}

interface WeeklySummary {
  revenueThisWeek: number
  revenueLastWeek: number
  jobsCompleted: number
  jobsScheduled: number
  topService: string | null
  worstService: string | null
  topCustomer: string | null
  mostOverdueInvoice: { number: string; amount: number; days: number } | null
  recommendation: string
}

interface Invoice {
  id: string
  amount: number
  status: string
  created_at: string
  due_date: string | null
  invoice_number?: string
  customers: { name: string } | null
  jobs?: { title: string } | null
}

interface Job {
  id: string
  title: string
  status: string
  created_at: string
  scheduled_date: string | null
  customers: { name: string } | null
}

interface Customer {
  id: string
  name: string
  created_at: string
}

const fmt = (n: number) => `$${n.toLocaleString('en', { minimumFractionDigits: 0 })}`

const impactColors: Record<string, string> = {
  High:   'bg-red-50 text-red-700 ring-red-100',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-100',
  Low:    'bg-blue-50 text-blue-700 ring-blue-100',
}

export default function InsightsPage() {
  const [loading, setLoading]               = useState(true)
  const [generating, setGenerating]         = useState(false)
  const [summary, setSummary]               = useState<WeeklySummary | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [lastUpdated, setLastUpdated]       = useState<Date | null>(null)

  const analyze = useCallback(async () => {
    setGenerating(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { window.location.href = '/login'; return }
      const uid = auth.user.id

      const now = new Date()
      const weekAgo  = new Date(now.getTime() - 7  * 86400000).toISOString()
      const twoWeeks = new Date(now.getTime() - 14 * 86400000).toISOString()
      const sixtyDays = new Date(now.getTime() - 60 * 86400000).toISOString()

      const [
        { data: allInvoices },
        { data: allJobs },
        { data: allCustomers },
      ] = await Promise.all([
        supabase.from('invoices').select('id, amount, status, created_at, due_date, invoice_number, customers(name)').eq('user_id', uid).order('created_at', { ascending: false }).limit(200),
        supabase.from('jobs').select('id, title, status, created_at, scheduled_date, customers(name)').eq('user_id', uid).order('created_at', { ascending: false }).limit(200),
        supabase.from('customers').select('id, name, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(200),
      ])

      const invoices  = (allInvoices  || []) as unknown as Invoice[]
      const jobs      = (allJobs      || []) as unknown as Job[]
      const customers = (allCustomers || []) as Customer[]

      // ── Weekly summary ────────────────────────────────────────
      const thisWeekInvoices = invoices.filter((i) => new Date(i.created_at) >= new Date(weekAgo))
      const lastWeekInvoices = invoices.filter((i) => {
        const d = new Date(i.created_at)
        return d >= new Date(twoWeeks) && d < new Date(weekAgo)
      })

      const revenueThisWeek = thisWeekInvoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0)
      const revenueLastWeek = lastWeekInvoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0)

      const thisWeekJobs = jobs.filter((j) => new Date(j.created_at) >= new Date(weekAgo))
      const jobsCompleted = thisWeekJobs.filter((j) => j.status === 'complete').length
      const jobsScheduled = thisWeekJobs.filter((j) => j.status === 'scheduled').length

      // Service frequency
      const serviceCounts: Record<string, number> = {}
      jobs.forEach((j) => {
        const key = j.title?.split(' ').slice(0, 3).join(' ') || 'Unknown'
        serviceCounts[key] = (serviceCounts[key] || 0) + 1
      })
      const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])
      const topService  = sortedServices[0]?.[0] || null
      const worstService = sortedServices[sortedServices.length - 1]?.[0] || null

      // Top customer by invoice amount
      const customerRevenue: Record<string, number> = {}
      invoices.forEach((inv) => {
        const name = inv.customers?.name || 'Unknown'
        customerRevenue[name] = (customerRevenue[name] || 0) + parseFloat(String(inv.amount))
      })
      const topCustomer = Object.entries(customerRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] || null

      // Most overdue invoice
      const overdueInvoices = invoices
        .filter((i) => i.status !== 'paid' && i.due_date && new Date(i.due_date) < now)
        .map((i) => ({
          number: i.invoice_number || i.id.slice(0, 8),
          amount: parseFloat(String(i.amount)),
          days: Math.floor((now.getTime() - new Date(i.due_date!).getTime()) / 86400000),
        }))
        .sort((a, b) => b.days - a.days)
      const mostOverdueInvoice = overdueInvoices[0] || null

      const revTrend = revenueLastWeek > 0
        ? revenueThisWeek >= revenueLastWeek
          ? `Revenue is up ${((revenueThisWeek - revenueLastWeek) / revenueLastWeek * 100).toFixed(0)}% vs last week — great momentum.`
          : `Revenue dipped ${((revenueLastWeek - revenueThisWeek) / revenueLastWeek * 100).toFixed(0)}% vs last week. Consider following up on outstanding invoices.`
        : 'Start invoicing completed jobs to build your revenue baseline.'

      setSummary({
        revenueThisWeek, revenueLastWeek, jobsCompleted, jobsScheduled,
        topService, worstService, topCustomer, mostOverdueInvoice,
        recommendation: revTrend,
      })

      // ── Recommendations engine ────────────────────────────────
      const recs: Recommendation[] = []

      // 1. Churn predictor — customers inactive 60+ days
      const activeCustomerIds = new Set(
        jobs
          .filter((j) => new Date(j.created_at) >= new Date(sixtyDays))
          .map((j) => (j.customers as unknown as { name: string } | null)?.name)
          .filter(Boolean)
      )
      const churnRisk = customers.filter((c) => !activeCustomerIds.has(c.name) && new Date(c.created_at) < new Date(sixtyDays))
      if (churnRisk.length > 0) {
        recs.push({
          id: 'churn',
          type: 'churn',
          impact: churnRisk.length >= 5 ? 'High' : 'Medium',
          title: `${churnRisk.length} customer${churnRisk.length > 1 ? 's' : ''} haven't booked in 60+ days`,
          description: `${churnRisk.slice(0, 3).map((c) => c.name).join(', ')}${churnRisk.length > 3 ? ` and ${churnRisk.length - 3} more` : ''} are at risk of churning. A targeted re-engagement campaign could recover significant revenue.`,
          estimatedRevenue: churnRisk.length * 250,
          action: 'Launch re-engagement campaign',
          actionHref: '/customers/campaigns',
          icon: Users,
          color: 'text-red-600',
          bg: 'bg-red-50',
        })
      }

      // 2. Overdue invoices
      const overdueTotal = invoices.filter((i) => i.status !== 'paid' && i.due_date && new Date(i.due_date) < now)
        .reduce((s, i) => s + parseFloat(String(i.amount)), 0)
      if (overdueTotal > 0) {
        recs.push({
          id: 'overdue',
          type: 'revenue',
          impact: overdueTotal > 2000 ? 'High' : 'Medium',
          title: `${fmt(overdueTotal)} in overdue invoices`,
          description: `You have ${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''}. The oldest is ${mostOverdueInvoice?.days || 0} days past due. Sending automated reminders can improve collection rates by up to 30%.`,
          estimatedRevenue: overdueTotal,
          action: 'View overdue invoices',
          actionHref: '/invoices',
          icon: DollarSign,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
        })
      }

      // 3. Upsell opportunity
      const completedNoInvoice = jobs.filter((j) => j.status === 'complete')
      const invoicedJobCustomers = new Set(invoices.map((i) => i.customers?.name))
      const uninvoiced = completedNoInvoice.filter((j) => !invoicedJobCustomers.has(j.customers?.name || ''))
      if (uninvoiced.length > 2) {
        recs.push({
          id: 'uninvoiced',
          type: 'revenue',
          impact: 'High',
          title: `${uninvoiced.length} completed jobs may not be invoiced`,
          description: `There are ${uninvoiced.length} completed jobs where the customer has no recent invoice. Review these jobs and send invoices to capture revenue before it slips.`,
          estimatedRevenue: uninvoiced.length * 300,
          action: 'Create invoices',
          actionHref: '/invoices',
          icon: Briefcase,
          color: 'text-indigo-600',
          bg: 'bg-indigo-50',
        })
      }

      // 4. Top customer concentration
      const totalRevenue = invoices.reduce((s, i) => s + parseFloat(String(i.amount)), 0)
      const sortedRevCustomers = Object.entries(customerRevenue).sort((a, b) => b[1] - a[1])
      if (sortedRevCustomers.length > 0 && totalRevenue > 0) {
        const topShare = sortedRevCustomers[0][1] / totalRevenue
        if (topShare > 0.4) {
          recs.push({
            id: 'concentration',
            type: 'customer',
            impact: 'Medium',
            title: `${sortedRevCustomers[0][0]} represents ${(topShare * 100).toFixed(0)}% of your revenue`,
            description: `High customer concentration is a business risk. If this customer reduces spending, your revenue could drop significantly. Focus on growing other customer segments to diversify.`,
            estimatedRevenue: null,
            action: 'View customer details',
            actionHref: '/customers',
            icon: Target,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          })
        }
      }

      // 5. Average payment time
      const paidInvoices = invoices.filter((i) => i.status === 'paid')
      if (paidInvoices.length >= 3) {
        const avgDays = paidInvoices.reduce((s, i) => {
          const days = (now.getTime() - new Date(i.created_at).getTime()) / 86400000
          return s + Math.min(days, 90)
        }, 0) / paidInvoices.length
        if (avgDays > 14) {
          recs.push({
            id: 'payment-time',
            type: 'operations',
            impact: 'Medium',
            title: `Average invoice payment takes ~${Math.round(avgDays)} days`,
            description: `Offering a 2% early payment discount for invoices paid within 7 days can significantly speed up cash flow. At your current volume, this could free up ${fmt(totalRevenue * 0.15)} in working capital per month.`,
            estimatedRevenue: Math.round(totalRevenue * 0.05),
            action: 'Update invoice settings',
            actionHref: '/settings',
            icon: Clock,
            color: 'text-cyan-600',
            bg: 'bg-cyan-50',
          })
        }
      }

      // 6. Job completion rate
      const completedCount = jobs.filter((j) => j.status === 'complete').length
      const totalJobsCount = jobs.length
      if (totalJobsCount > 5) {
        const rate = completedCount / totalJobsCount
        if (rate < 0.7) {
          recs.push({
            id: 'completion',
            type: 'operations',
            impact: 'Medium',
            title: `Job completion rate is ${(rate * 100).toFixed(0)}% — below target`,
            description: `Your job completion rate is below the 70% industry benchmark. Review cancelled and stalled jobs to identify patterns. Common causes: unclear scope, parts availability, or scheduling conflicts.`,
            estimatedRevenue: null,
            action: 'Review all jobs',
            actionHref: '/jobs',
            icon: Activity,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
          })
        }
      }

      // 7. Growth momentum
      if (revenueLastWeek > 0 && revenueThisWeek > revenueLastWeek * 1.2) {
        recs.push({
          id: 'momentum',
          type: 'revenue',
          impact: 'Low',
          title: `Revenue grew ${((revenueThisWeek - revenueLastWeek) / revenueLastWeek * 100).toFixed(0)}% this week`,
          description: `You're on a strong growth trajectory. This is a great time to consider increasing prices by 5–10% for new customers, or introducing a premium service tier.`,
          estimatedRevenue: Math.round(revenueThisWeek * 0.08),
          action: 'Review pricing',
          actionHref: '/settings',
          icon: TrendingUp,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
        })
      }

      setRecommendations(recs.sort((a, b) => {
        const order = { High: 0, Medium: 1, Low: 2 }
        return order[a.impact] - order[b.impact]
      }))
      setLastUpdated(new Date())
    } finally {
      setGenerating(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => { analyze() }, [analyze])

  if (loading) return (
    <AppLayout title="AI Insights">
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <div className="h-40 skeleton rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      </div>
    </AppLayout>
  )

  const revChange = summary && summary.revenueLastWeek > 0
    ? ((summary.revenueThisWeek - summary.revenueLastWeek) / summary.revenueLastWeek * 100)
    : null

  return (
    <AppLayout title="AI Insights">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Business Intelligence</h2>
            </div>
            {lastUpdated && (
              <p className="text-xs text-gray-400 ml-10">
                Last analyzed {lastUpdated.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <button
            onClick={analyze}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Analyzing…' : 'Refresh'}
          </button>
        </div>

        {/* Weekly summary card */}
        {summary && (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-indigo-900">Weekly Business Summary</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div className="rounded-xl bg-white/70 p-3">
                <p className="text-xs text-gray-500 mb-0.5">Revenue this week</p>
                <p className="text-lg font-bold text-gray-900">{fmt(summary.revenueThisWeek)}</p>
                {revChange !== null && (
                  <p className={`text-xs font-medium flex items-center gap-0.5 mt-0.5 ${revChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {revChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {revChange >= 0 ? '+' : ''}{revChange.toFixed(0)}% vs last week
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-white/70 p-3">
                <p className="text-xs text-gray-500 mb-0.5">Jobs completed</p>
                <p className="text-lg font-bold text-gray-900">{summary.jobsCompleted}</p>
                <p className="text-xs text-gray-400">{summary.jobsScheduled} scheduled</p>
              </div>
              <div className="rounded-xl bg-white/70 p-3">
                <p className="text-xs text-gray-500 mb-0.5">Top service</p>
                <p className="text-sm font-bold text-gray-900 truncate">{summary.topService || '—'}</p>
                <p className="text-xs text-gray-400">Most frequent</p>
              </div>
              <div className="rounded-xl bg-white/70 p-3">
                <p className="text-xs text-gray-500 mb-0.5">Top customer</p>
                <p className="text-sm font-bold text-gray-900 truncate">{summary.topCustomer || '—'}</p>
                <p className="text-xs text-gray-400">By revenue</p>
              </div>
            </div>
            {summary.mostOverdueInvoice && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 mb-4 flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">
                  Invoice #{summary.mostOverdueInvoice.number} is <strong>{summary.mostOverdueInvoice.days} days overdue</strong> for {fmt(summary.mostOverdueInvoice.amount)}
                </p>
                <a href="/invoices" className="ml-auto text-xs font-semibold text-red-600 hover:text-red-800 whitespace-nowrap">
                  Review →
                </a>
              </div>
            )}
            <div className="rounded-xl bg-white/70 px-4 py-3 flex items-start gap-3">
              <Zap className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
              <p className="text-sm text-indigo-900"><strong>Recommended action:</strong> {summary.recommendation}</p>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Recommendations
              {recommendations.length > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{recommendations.length}</span>
              )}
            </h3>
            <span className="text-xs text-gray-400">Sorted by impact</span>
          </div>

          {recommendations.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center">
              <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-900 mb-1">Everything looks great!</p>
              <p className="text-sm text-gray-400">No critical recommendations right now. Keep up the great work.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className="rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-xl ${rec.bg}`}>
                      <rec.icon className={`h-5 w-5 ${rec.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${impactColors[rec.impact]}`}>
                          {rec.impact} Impact
                        </span>
                        {rec.estimatedRevenue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            <DollarSign className="h-2.5 w-2.5" />
                            ~{fmt(rec.estimatedRevenue)} opportunity
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">{rec.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{rec.description}</p>
                    </div>
                    <a
                      href={rec.actionHref}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
                    >
                      {rec.action} <ChevronRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ask AI section */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-gray-900">Ask about your business</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Use the AI Assistant in the bottom-right corner to ask specific questions about your data —
            "What was my best month?", "Which customer owes the most?", "How many jobs did I complete last quarter?"
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'What is my revenue this month?',
              'Which customers are overdue?',
              'How many jobs this week?',
              'Who is my best customer?',
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  const el = document.querySelector('[data-ai-input]') as HTMLInputElement
                  if (el) { el.value = q; el.focus(); el.dispatchEvent(new Event('input', { bubbles: true })) }
                }}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
