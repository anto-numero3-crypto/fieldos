'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { useLanguage } from '@/lib/LanguageContext'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { fmtMoney, fmtDate } from '@/lib/format'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import {
  Loader2, FileText, Calendar, DollarSign, Briefcase, Send,
  Zap, ChevronRight, CheckCircle, Clock, XCircle, Edit,
  Trash2, ArrowLeft, Receipt,
} from 'lucide-react'

interface Contract {
  id: string
  title: string
  description: string | null
  status: string
  start_date: string
  end_date: string
  recurrence_type: string
  recurrence_days: number[] | null
  service_name: string
  service_description: string | null
  price_per_visit: number
  total_price: number
  billing_type: string
  billing_frequency: string
  approval_token: string
  approved_at: string | null
  approved_by_name: string | null
  notes: string | null
  internal_notes: string | null
  jobs_generated_count: number
  last_job_generated_at: string | null
  next_job_date: string | null
  created_at: string
  customers: { id: string; name: string; email: string | null; phone: string | null; address: string | null } | null
}

interface Job {
  id: string
  title: string
  status: string
  scheduled_date: string
  contract_id: string
}

type Tab = 'details' | 'jobs' | 'billing'

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-50 text-blue-700',
  approved: 'bg-emerald-50 text-emerald-700',
  active: 'bg-indigo-50 text-indigo-700',
  expired: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
}

const STATUS_LABEL_FR: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoy\u00e9', approved: 'Approuv\u00e9',
  active: 'Actif', expired: 'Expir\u00e9', cancelled: 'Annul\u00e9',
}
const STATUS_LABEL_EN: Record<string, string> = {
  draft: 'Draft', sent: 'Sent', approved: 'Approved',
  active: 'Active', expired: 'Expired', cancelled: 'Cancelled',
}

const JOB_STATUS_FR: Record<string, string> = {
  scheduled: 'Planifi\u00e9', in_progress: 'En cours', completed: 'Termin\u00e9', cancelled: 'Annul\u00e9',
}
const JOB_STATUS_EN: Record<string, string> = {
  scheduled: 'Scheduled', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled',
}
const JOB_STATUS_CLS: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
}

function recurrenceLabel(type: string, fr: boolean): string {
  const map: Record<string, [string, string]> = {
    none: ['Ponctuel', 'One-time'],
    daily: ['Quotidien', 'Daily'],
    weekly: ['Hebdomadaire', 'Weekly'],
    biweekly: ['Aux 2 semaines', 'Biweekly'],
    monthly: ['Mensuel', 'Monthly'],
    custom: ['Personnalis\u00e9', 'Custom'],
  }
  return (map[type] || map.none)![fr ? 0 : 1]
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const confirm = useConfirm()

  const [contract, setContract] = useState<Contract | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('details')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadContract()
  }, [id])

  const loadContract = async () => {
    const res = await fetch(`/api/contracts/${id}`)
    if (res.ok) {
      const data = await res.json()
      setContract(data.contract)
    }
    // Load jobs for this contract
    const { data: authData } = await supabase.auth.getUser()
    if (authData.user) {
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, title, status, scheduled_date, contract_id')
        .eq('contract_id', id)
        .order('scheduled_date', { ascending: true })
      if (jobsData) setJobs(jobsData)
    }
    setLoading(false)
  }

  const handleSend = async () => {
    setSending(true)
    try {
      const res = await fetch(`/api/contracts/${id}/send`, { method: 'POST' })
      if (res.ok) {
        toast.success(fr ? 'Contrat envoy\u00e9 au client!' : 'Contract sent to customer!')
        await loadContract()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error')
      }
    } catch {
      toast.error(fr ? 'Erreur lors de l\'envoi' : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/contracts/${id}/generate-jobs`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(fr
          ? `${data.generated} intervention(s) g\u00e9n\u00e9r\u00e9e(s)`
          : `${data.generated} job(s) generated`)
        await loadContract()
      } else {
        toast.error(data.error || 'Error')
      }
    } catch {
      toast.error(fr ? 'Erreur' : 'Error')
    } finally {
      setGenerating(false)
    }
  }

  const handleCancel = async () => {
    const { confirmed } = await confirm({
      title: fr ? 'Annuler ce contrat ?' : 'Cancel this contract?',
      description: fr ? 'Cette action est irr\u00e9versible.' : 'This action cannot be undone.',
      destructive: true,
    })
    if (!confirmed) return
    const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success(fr ? 'Contrat annul\u00e9' : 'Contract cancelled')
      router.push('/contrats')
    }
  }

  if (loading) {
    return (
      <AppLayout title={fr ? 'Contrat' : 'Contract'}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (!contract) {
    return (
      <AppLayout title={fr ? 'Contrat' : 'Contract'}>
        <div className="text-center py-20 text-gray-500">
          {fr ? 'Contrat introuvable' : 'Contract not found'}
        </div>
      </AppLayout>
    )
  }

  const completedJobs = jobs.filter((j) => j.status === 'completed').length
  const totalJobs = jobs.length

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'details', label: fr ? 'D\u00e9tails' : 'Details', icon: FileText },
    { key: 'jobs', label: fr ? 'Interventions' : 'Jobs', icon: Briefcase },
    { key: 'billing', label: fr ? 'Facturation' : 'Billing', icon: Receipt },
  ]

  return (
    <AppLayout title={contract.title}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back */}
        <Link href="/contrats" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {fr ? 'Tous les contrats' : 'All contracts'}
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{contract.title}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[contract.status] || STATUS_BADGE.draft}`}>
                {fr ? STATUS_LABEL_FR[contract.status] : STATUS_LABEL_EN[contract.status]}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {contract.customers?.name || ''} {contract.customers?.email ? `(${contract.customers.email})` : ''}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {contract.status === 'draft' && (
              <button
                onClick={handleSend}
                disabled={sending}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {fr ? 'Envoyer au client' : 'Send to client'}
              </button>
            )}
            {['approved', 'active'].includes(contract.status) && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {fr ? 'G\u00e9n\u00e9rer interventions' : 'Generate jobs'}
              </button>
            )}
            {!['cancelled', 'expired'].includes(contract.status) && (
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-100 dark:border-gray-800">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={[
                'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                tab === key
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {label}
              {key === 'jobs' && totalJobs > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{totalJobs}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'details' && (
          <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 p-6 space-y-4">
            <DetailRow label={fr ? 'Service' : 'Service'} value={contract.service_name} />
            {contract.service_description && (
              <DetailRow label={fr ? 'Description' : 'Description'} value={contract.service_description} />
            )}
            <DetailRow label={fr ? 'P\u00e9riode' : 'Period'} value={`${fmtDate(contract.start_date, lang)} - ${fmtDate(contract.end_date, lang)}`} />
            <DetailRow label={fr ? 'R\u00e9currence' : 'Recurrence'} value={recurrenceLabel(contract.recurrence_type, fr)} />
            {contract.recurrence_days && contract.recurrence_days.length > 0 && (
              <DetailRow
                label={fr ? 'Jours' : 'Days'}
                value={contract.recurrence_days.map((d) => {
                  const labels = fr
                    ? ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
                    : ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                  return labels[d] || String(d)
                }).join(', ')}
              />
            )}
            <DetailRow label={fr ? 'Prix par visite' : 'Price per visit'} value={fmtMoney(contract.price_per_visit, lang)} />
            <DetailRow label={fr ? 'Total' : 'Total'} value={fmtMoney(contract.total_price, lang)} />
            <DetailRow label={fr ? 'Facturation' : 'Billing'} value={contract.billing_type} />
            {contract.approved_at && (
              <DetailRow label={fr ? 'Approuv\u00e9 le' : 'Approved on'} value={fmtDate(contract.approved_at, lang)} />
            )}
            {contract.approved_by_name && (
              <DetailRow label={fr ? 'Approuv\u00e9 par' : 'Approved by'} value={contract.approved_by_name} />
            )}
            {contract.notes && (
              <DetailRow label={fr ? 'Notes client' : 'Client notes'} value={contract.notes} />
            )}
            {contract.internal_notes && (
              <DetailRow label={fr ? 'Notes internes' : 'Internal notes'} value={contract.internal_notes} />
            )}
            {contract.next_job_date && (
              <DetailRow label={fr ? 'Prochaine intervention' : 'Next job'} value={fmtDate(contract.next_job_date, lang)} />
            )}
          </div>
        )}

        {tab === 'jobs' && (
          <div className="space-y-4">
            {['approved', 'active'].includes(contract.status) && (
              <div className="flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  {fr ? 'G\u00e9n\u00e9rer les interventions' : 'Generate jobs'}
                </button>
              </div>
            )}

            {jobs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Briefcase className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">{fr ? 'Aucune intervention g\u00e9n\u00e9r\u00e9e' : 'No jobs generated yet'}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs?id=${job.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{job.title}</p>
                      <p className="text-xs text-gray-500">{fmtDate(job.scheduled_date, lang)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_CLS[job.status] || 'bg-gray-100 text-gray-600'}`}>
                      {fr ? (JOB_STATUS_FR[job.status] || job.status) : (JOB_STATUS_EN[job.status] || job.status)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                  </Link>
                ))}
              </div>
            )}

            {totalJobs > 0 && (
              <div className="text-xs text-gray-400 text-center">
                {completedJobs}/{totalJobs} {fr ? 'termin\u00e9es' : 'completed'}
              </div>
            )}
          </div>
        )}

        {tab === 'billing' && (
          <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 p-6 space-y-6">
            <div className="space-y-3">
              <DetailRow label={fr ? 'Valeur du contrat' : 'Contract value'} value={fmtMoney(contract.total_price, lang)} />
              <DetailRow label={fr ? 'Type de facturation' : 'Billing type'} value={contract.billing_type} />
              <DetailRow label={fr ? 'Fr\u00e9quence' : 'Frequency'} value={contract.billing_frequency} />
              <DetailRow label={fr ? 'Interventions g\u00e9n\u00e9r\u00e9es' : 'Jobs generated'} value={String(contract.jobs_generated_count || 0)} />
            </div>

            {/* Progress */}
            {totalJobs > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">{fr ? 'Progression' : 'Progress'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {completedJobs}/{totalJobs} ({totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Billing estimate */}
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {fr ? 'Estimation de facturation' : 'Billing estimate'}
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{fr ? 'Valeur compl\u00e9t\u00e9e' : 'Completed value'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {fmtMoney(completedJobs * contract.price_per_visit, lang)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{fr ? 'Restant' : 'Remaining'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {fmtMoney((totalJobs - completedJobs) * contract.price_per_visit, lang)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 sm:w-48 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}
