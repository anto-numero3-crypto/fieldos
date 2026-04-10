'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import { useLanguage } from '@/lib/LanguageContext'
import { Users, Briefcase, FileText, DollarSign, TrendingUp, ArrowRight, Plus, Sparkles } from 'lucide-react'

interface Stats {
  customers: number; totalJobs: number; activeJobs: number
  totalInvoiced: number; paidAmount: number; unpaidCount: number
}
interface RecentJob {
  id: string; title: string; status: string
  scheduled_date: string | null; customers: { name: string } | null
}
interface RecentInvoice {
  id: string; amount: number; status: string
  due_date: string | null; customers: { name: string } | null
}

export default function Dashboard() {
  const { t } = useLanguage()
  const d = t.dashboard

  const statusConfig: Record<string, { label: string; className: string }> = {
    scheduled: { label: t.jobs.scheduled, className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
    in_progress: { label: t.jobs.inProgress, className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
    complete: { label: t.jobs.complete, className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
    cancelled: { label: t.jobs.cancelled, className: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
    unpaid: { label: t.invoices.unpaid, className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
    paid: { label: t.invoices.paid, className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
    overdue: { label: t.invoices.overdue, className: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
  }

  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [stats, setStats] = useState<Stats>({ customers: 0, totalJobs: 0, activeJobs: 0, totalInvoiced: 0, paidAmount: 0, unpaidCount: 0 })
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)

      const [{ count: customerCount }, { data: jobs }, { data: invoices }] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('user_id', data.user.id),
        supabase.from('jobs').select('id, title, status, scheduled_date, customers(name)').eq('user_id', data.user.id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('id, amount, status, due_date, customers(name)').eq('user_id', data.user.id).order('created_at', { ascending: false }),
      ])

      const totalInvoiced = (invoices || []).reduce((sum, inv) => sum + parseFloat(String(inv.amount)), 0)
      const paidAmount = (invoices || []).filter(i => i.status === 'paid').reduce((sum, inv) => sum + parseFloat(String(inv.amount)), 0)
      const unpaidCount = (invoices || []).filter(i => i.status === 'unpaid').length
      const activeJobs = (jobs || []).filter(j => j.status === 'scheduled' || j.status === 'in_progress').length

      setStats({ customers: customerCount || 0, totalJobs: (jobs || []).length, activeJobs, totalInvoiced, paidAmount, unpaidCount })
      setRecentJobs((jobs || []).slice(0, 5) as unknown as RecentJob[])
      setRecentInvoices((invoices || []).slice(0, 5) as unknown as RecentInvoice[])
      setLoading(false)
    }
    init()
  }, [])

  const today = new Date().toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const fmt = (n: number) => `$${n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (loading) return (
    <AppLayout>
      <div className="flex h-full items-center justify-center p-12">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
          <span className="text-sm">{d.loading}</span>
        </div>
      </div>
    </AppLayout>
  )

  const kpiCards = [
    { title: d.totalCustomers, value: stats.customers, icon: Users, href: '/customers', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', change: null },
    { title: d.activeJobs, value: stats.activeJobs, icon: Briefcase, href: '/jobs', iconBg: 'bg-violet-50', iconColor: 'text-violet-600', change: d.totalLabel(stats.totalJobs) },
    { title: d.totalInvoiced, value: fmt(stats.totalInvoiced), icon: DollarSign, href: '/invoices', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', change: null },
    { title: d.amountPaid, value: fmt(stats.paidAmount), icon: TrendingUp, href: '/invoices', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', change: stats.unpaidCount > 0 ? d.unpaidLabel(stats.unpaidCount) : d.allPaid },
  ]

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{d.greeting(user?.email?.split('@')[0] || '')}</h1>
          <p className="mt-1 text-gray-500">{d.greetingSub}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          {kpiCards.map((card) => (
            <Link key={card.title} href={card.href} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs font-medium text-gray-500 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              {card.change && <p className="mt-1 text-xs text-gray-400">{card.change}</p>}
            </Link>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">{d.quickActions}</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: d.newCustomer, href: '/customers', color: 'hover:border-blue-300 hover:bg-blue-50' },
              { label: d.newJob, href: '/jobs', color: 'hover:border-violet-300 hover:bg-violet-50' },
              { label: d.newInvoice, href: '/invoices', color: 'hover:border-emerald-300 hover:bg-emerald-50' },
              { label: d.askAI, href: '/assistant', color: 'hover:border-amber-300 hover:bg-amber-50' },
            ].map((action) => (
              <Link key={action.label} href={action.href} className={`inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-150 ${action.color}`}>
                <Plus className="h-4 w-4" />{action.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{d.recentJobs}</h2>
              <Link href="/jobs" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">{t.common.viewAll} <ArrowRight className="h-3 w-3" /></Link>
            </div>
            {recentJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-3"><Briefcase className="h-5 w-5 text-gray-400" /></div>
                <p className="text-sm text-gray-500">{d.noJobsYet}</p>
                <Link href="/jobs" className="mt-2 text-xs font-medium text-indigo-600 hover:underline">{d.addFirstJob}</Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentJobs.map((job) => (
                  <li key={job.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50"><Briefcase className="h-4 w-4 text-violet-600" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-400">{job.customers?.name || d.noCustomer}{job.scheduled_date ? ` · ${job.scheduled_date}` : ''}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[job.status]?.className || ''}`}>{statusConfig[job.status]?.label || job.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{d.recentInvoices}</h2>
              <Link href="/invoices" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">{t.common.viewAll} <ArrowRight className="h-3 w-3" /></Link>
            </div>
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-3"><FileText className="h-5 w-5 text-gray-400" /></div>
                <p className="text-sm text-gray-500">{d.noInvoicesYet}</p>
                <Link href="/invoices" className="mt-2 text-xs font-medium text-indigo-600 hover:underline">{d.createFirstInvoice}</Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentInvoices.map((inv) => (
                  <li key={inv.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50"><DollarSign className="h-4 w-4 text-emerald-600" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{fmt(parseFloat(String(inv.amount)))}</p>
                      <p className="text-xs text-gray-400">{inv.customers?.name || d.noCustomer}{inv.due_date ? ` · ${inv.due_date}` : ''}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[inv.status]?.className || ''}`}>{statusConfig[inv.status]?.label || inv.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
