'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import EmptyState from '@/components/EmptyState'
import UpgradePrompt from '@/components/UpgradePrompt'
import { SkeletonListRow } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useLanguage } from '@/lib/LanguageContext'
import { isModuleEnabled } from '@/lib/modules'
import { fmtMoney, fmtDate } from '@/lib/format'
import { getRecurrenceLabel } from '@/lib/contract-labels'
import { supabase } from '../supabase'
import { toast } from 'sonner'
import {
  FileText, Plus, Search, Lock, Loader2, Calendar, DollarSign,
  RefreshCw, AlertTriangle, ChevronRight, Zap, Clock, CheckCircle,
  Send, XCircle,
} from 'lucide-react'

interface Contract {
  id: string
  title: string
  status: string
  start_date: string
  end_date: string
  recurrence_type: string
  recurrence_days: number[] | null
  service_name: string
  price_per_visit: number
  total_price: number
  jobs_generated_count: number
  next_job_date: string | null
  created_at: string
  customers: { id: string; name: string; email: string | null } | null
}

type StatusFilter = 'all' | 'draft' | 'sent' | 'approved' | 'active' | 'expired' | 'cancelled'

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  sent: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  client_signed: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  fully_executed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  active: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  expired: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_LABEL_FR: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoy\u00e9', approved: 'Approuv\u00e9',
  client_signed: 'Sign\u00e9 par le client', fully_executed: '\u2713 Enti\u00e8rement sign\u00e9',
  active: 'Actif', expired: 'Expir\u00e9', cancelled: 'Annul\u00e9',
}
const STATUS_LABEL_EN: Record<string, string> = {
  draft: 'Draft', sent: 'Sent', approved: 'Approved',
  client_signed: 'Signed by client', fully_executed: '\u2713 Fully signed',
  active: 'Active', expired: 'Expired', cancelled: 'Cancelled',
}

function recurrenceLabel(type: string, fr: boolean): string {
  return getRecurrenceLabel(type, fr ? 'fr' : 'en')
}

export default function ContractsPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const confirm = useConfirm()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [moduleEnabled, setModuleEnabled] = useState(false)
  const [planChecked, setPlanChecked] = useState(false)
  const [orgPlan, setOrgPlan] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [generating, setGenerating] = useState<string | null>(null)

  // Check module access and load contracts
  useEffect(() => {
    const init = async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return

      const { data: org } = await supabase
        .from('organizations')
        .select('id, plan, enabled_modules')
        .eq('owner_user_id', authData.user.id)
        .maybeSingle()

      setOrgPlan(org?.plan || null)
      setPlanChecked(true)

      if (org && isModuleEnabled(org.enabled_modules, org.plan, 'recurring_contracts')) {
        setModuleEnabled(true)
        await loadContracts()
      }
      setLoading(false)
    }
    init()
  }, [])

  const loadContracts = async () => {
    const res = await fetch('/api/contracts')
    if (res.ok) {
      const data = await res.json()
      setContracts(data.contracts || [])
    }
  }

  const handleGenerateJobs = async (contractId: string) => {
    setGenerating(contractId)
    try {
      const res = await fetch(`/api/contracts/${contractId}/generate-jobs`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(fr
          ? `${data.generated} intervention(s) g\u00e9n\u00e9r\u00e9e(s), ${data.skipped} ignor\u00e9e(s)`
          : `${data.generated} job(s) generated, ${data.skipped} skipped`)
        await loadContracts()
      } else {
        toast.error(fr ? (data.error || 'Impossible de g\u00e9n\u00e9rer les interventions') : (data.error || 'Could not generate jobs'))
      }
    } catch {
      toast.error(fr ? 'Erreur lors de la g\u00e9n\u00e9ration des interventions' : 'Failed to generate jobs')
    } finally {
      setGenerating(null)
    }
  }

  const filtered = useMemo(() => {
    let list = contracts
    if (filter !== 'all') list = list.filter((c) => c.status === filter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.customers?.name?.toLowerCase().includes(q) ||
          c.service_name.toLowerCase().includes(q),
      )
    }
    return list
  }, [contracts, filter, search])

  // Summary stats
  const activeCount = contracts.filter((c) => c.status === 'active').length
  const totalValue = contracts
    .filter((c) => ['active', 'approved'].includes(c.status))
    .reduce((sum, c) => sum + (c.total_price || 0), 0)
  const expiringSoon = contracts.filter((c) => {
    if (c.status !== 'active') return false
    const end = new Date(c.end_date + 'T12:00:00')
    const diff = (end.getTime() - Date.now()) / 86400000
    return diff > 0 && diff <= 30
  }).length
  const pendingApproval = contracts.filter((c) => c.status === 'sent').length

  // Loading
  if (loading) {
    return (
      <AppLayout title={fr ? 'Contrats' : 'Contracts'}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  // Module gate
  if (!moduleEnabled && planChecked) {
    const isDemarrage = !orgPlan || orgPlan.toLowerCase() === 'demarrage'
    if (isDemarrage) {
      return (
        <AppLayout title={fr ? 'Contrats' : 'Contracts'}>
          <div className="max-w-3xl mx-auto py-8">
            <UpgradePrompt
              feature={fr ? 'Contrats r\u00e9currents' : 'Recurring contracts'}
              requiredPlan="pro"
              description={fr
                ? 'G\u00e9rez des contrats saisonniers et g\u00e9n\u00e9rez des interventions r\u00e9currentes automatiquement.'
                : 'Manage seasonal contracts and automatically generate recurring jobs.'}
              variant="overlay"
            />
          </div>
        </AppLayout>
      )
    }
    return (
      <AppLayout title={fr ? 'Contrats' : 'Contracts'}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {fr ? 'Module non activ\u00e9' : 'Module not enabled'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
            {fr
              ? 'Activez les contrats r\u00e9currents dans Param\u00e8tres \u2192 Modules pour acc\u00e9der \u00e0 cette page.'
              : 'Enable recurring contracts in Settings \u2192 Modules to access this page.'}
          </p>
          <Link
            href="/settings"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            {fr ? 'Param\u00e8tres \u2192 Modules' : 'Settings \u2192 Modules'}
          </Link>
        </div>
      </AppLayout>
    )
  }

  const statusTabs: StatusFilter[] = ['all', 'draft', 'sent', 'approved', 'active', 'expired', 'cancelled']

  return (
    <AppLayout
      title={fr ? 'Contrats' : 'Contracts'}
      actions={
        <Link
          href="/contrats/nouveau"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {fr ? 'Nouveau contrat' : 'New contract'}
        </Link>
      }
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Renewal banner */}
        {expiringSoon > 0 && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-center gap-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40 shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              {fr
                ? `${expiringSoon} contrat(s) expire(nt) dans les 30 prochains jours`
                : `${expiringSoon} contract(s) expiring within 30 days`}
            </p>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon={CheckCircle} label={fr ? 'Actifs' : 'Active'} value={activeCount} color="text-emerald-600 bg-emerald-50" />
          <SummaryCard icon={DollarSign} label={fr ? 'Valeur totale' : 'Total value'} value={fmtMoney(totalValue, lang)} color="text-indigo-600 bg-indigo-50" />
          <SummaryCard icon={Clock} label={fr ? 'Expirent bient\u00f4t' : 'Expiring soon'} value={expiringSoon} color="text-amber-600 bg-amber-50" />
          <SummaryCard icon={Send} label={fr ? 'En attente' : 'Pending'} value={pendingApproval} color="text-blue-600 bg-blue-50" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={fr ? 'Rechercher par client ou titre...' : 'Search by client or title...'}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none dark:text-white transition-colors"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-0.5">
            {statusTabs.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={[
                  'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200',
                  filter === s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                ].join(' ')}
              >
                {s === 'all'
                  ? (fr ? 'Tous' : 'All')
                  : (fr ? STATUS_LABEL_FR[s] : STATUS_LABEL_EN[s])}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={fr ? 'Aucun contrat' : 'No contracts'}
            description={fr
              ? 'Cr\u00e9ez votre premier contrat r\u00e9current pour automatiser vos interventions.'
              : 'Create your first recurring contract to automate your jobs.'}
            actions={[{ label: fr ? 'Nouveau contrat' : 'New contract', href: '/contrats/nouveau' }]}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <ContractCard
                key={c.id}
                contract={c}
                fr={fr}
                lang={lang}
                generating={generating === c.id}
                onGenerateJobs={() => handleGenerateJobs(c.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; color: string }) {
  const [bg, fg] = color.split(' ').length >= 2 ? [color.split(' ')[1], color.split(' ')[0]] : ['bg-gray-50', 'text-gray-600']
  // Extract border color from the fg class
  const borderColor = fg.replace('text-', 'border-l-')
  return (
    <div className={`rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4 border-l-4 ${borderColor} hover:shadow-md transition-all duration-200`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`h-4 w-4 ${fg}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

function ContractCard({
  contract: c,
  fr,
  lang,
  generating,
  onGenerateJobs,
}: {
  contract: Contract
  fr: boolean
  lang: 'fr' | 'en'
  generating: boolean
  onGenerateJobs: () => void
}) {
  const isExpiringSoon = c.status === 'active' && (() => {
    const diff = (new Date(c.end_date + 'T12:00:00').getTime() - Date.now()) / 86400000
    return diff > 0 && diff <= 30
  })()

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5 hover:shadow-md active:scale-[0.99] transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link href={`/contrats/${c.id}`} className="text-base font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate">
              {c.title}
            </Link>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[c.status] || STATUS_BADGE.draft}`}>
              {fr ? STATUS_LABEL_FR[c.status] : STATUS_LABEL_EN[c.status]}
            </span>
            {isExpiringSoon && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {fr ? 'Expire bient\u00f4t' : 'Expiring soon'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {c.customers?.name || (fr ? 'Sans client' : 'No customer')}
            {' \u00b7 '}
            {recurrenceLabel(c.recurrence_type, fr)}
            {' \u00b7 '}
            {fmtDate(c.start_date, lang, 'short')} - {fmtDate(c.end_date, lang, 'short')}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
            <span className="tabular-nums font-medium">{fmtMoney(c.price_per_visit, lang)}/{fr ? 'visite' : 'visit'}</span>
            <span className="tabular-nums font-medium">{fmtMoney(c.total_price, lang)} total</span>
            <span className="tabular-nums">{c.jobs_generated_count} {fr ? 'g\u00e9n\u00e9r\u00e9es' : 'generated'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {['approved', 'active', 'client_signed', 'fully_executed'].includes(c.status) && (
            <button
              onClick={onGenerateJobs}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 disabled:opacity-50 active:scale-[0.98] transition-all duration-200"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              {fr ? 'G\u00e9n\u00e9rer' : 'Generate'}
            </button>
          )}
          {c.status === 'expired' && (
            <Link
              href={`/contrats/nouveau?renew=${c.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 active:scale-[0.98] transition-all duration-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {fr ? 'Renouveler' : 'Renew'}
            </Link>
          )}
          <Link
            href={`/contrats/${c.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98] transition-all duration-200"
          >
            {fr ? 'Voir' : 'View'}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
