'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { useLanguage } from '@/lib/LanguageContext'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { fmtMoney, fmtDate } from '@/lib/format'
import { getBillingTypeLabel, getBillingFrequencyLabel, getRecurrenceLabel, getDayLabels } from '@/lib/contract-labels'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import {
  Loader2, FileText, Calendar, DollarSign, Briefcase, Send,
  Zap, ChevronRight, CheckCircle, Clock, XCircle, Edit,
  Trash2, ArrowLeft, Receipt, Printer, Eye, PenLine, X, Type,
} from 'lucide-react'
import SignaturePad from '@/components/SignaturePad'

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
  owner_signature: string | null
  owner_signed_at: string | null
  owner_signed_name: string | null
  client_signature: string | null
  client_signed_at: string | null
  client_signed_name: string | null
  fully_executed_at: string | null
  notes: string | null
  internal_notes: string | null
  jobs_generated_count: number
  last_job_generated_at: string | null
  next_job_date: string | null
  include_tps: boolean
  include_tvq: boolean
  created_at: string
  customers: { id: string; name: string; email: string | null; phone: string | null; address: string | null } | null
}

interface Job {
  id: string
  title: string
  status: string
  scheduled_date: string
  contract_id: string
  invoice_id: string | null
}

interface ContractInvoice {
  id: string
  invoice_number: string | null
  amount: number
  status: string
  created_at: string
  token: string
}

type Tab = 'details' | 'jobs' | 'billing'

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-50 text-blue-700',
  approved: 'bg-emerald-50 text-emerald-700',
  client_signed: 'bg-blue-50 text-blue-700',
  fully_executed: 'bg-emerald-50 text-emerald-700',
  active: 'bg-indigo-50 text-indigo-700',
  expired: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
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

const INV_STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-50 text-blue-700',
  paid: 'bg-emerald-50 text-emerald-700',
  overdue: 'bg-red-50 text-red-700',
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const confirm = useConfirm()

  const [contract, setContract] = useState<Contract | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [invoices, setInvoices] = useState<ContractInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('details')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)

  // Billing tab state
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const [creatingInvoice, setCreatingInvoice] = useState(false)

  // Signature state
  const [showSignModal, setShowSignModal] = useState(false)
  const [signatureName, setSignatureName] = useState('')
  const [signingOwner, setSigningOwner] = useState(false)

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
        .select('id, title, status, scheduled_date, contract_id, invoice_id')
        .eq('contract_id', id)
        .order('scheduled_date', { ascending: true })
      if (jobsData) setJobs(jobsData)

      // Load invoices linked to this contract
      const { data: invData } = await supabase
        .from('invoices')
        .select('id, invoice_number, amount, status, created_at, token')
        .eq('contract_id', id)
        .order('created_at', { ascending: false })
      if (invData) setInvoices(invData)
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

  const handleCreateInvoice = async () => {
    if (selectedJobs.length === 0 || !contract) return
    setCreatingInvoice(true)
    try {
      const res = await fetch(`/api/contracts/${id}/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: selectedJobs }),
      })
      const data = await res.json()
      if (res.ok && data.invoiceId) {
        toast.success(fr ? 'Facture cr\u00e9\u00e9e!' : 'Invoice created!')
        router.push(`/invoices?id=${data.invoiceId}`)
      } else {
        toast.error(data.error || 'Error')
      }
    } catch {
      toast.error(fr ? 'Erreur' : 'Error')
    } finally {
      setCreatingInvoice(false)
    }
  }

  const handleOwnerSign = async (signatureDataUrl: string) => {
    if (!signatureName.trim() || !contract) return
    setSigningOwner(true)
    try {
      const res = await fetch(`/api/contracts/${id}/owner-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: signatureDataUrl, name: signatureName.trim() }),
      })
      if (res.ok) {
        toast.success(fr ? 'Contrat signé!' : 'Contract signed!')
        setShowSignModal(false)
        await loadContract()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error')
      }
    } catch {
      toast.error(fr ? 'Erreur' : 'Error')
    } finally {
      setSigningOwner(false)
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

  // Tax calculations
  const includeTps = contract.include_tps !== false
  const includeTvq = contract.include_tvq !== false
  const subtotal = contract.price_per_visit * (totalJobs || 1)
  const tpsAmount = includeTps ? subtotal * 0.05 : 0
  const tvqAmount = includeTvq ? subtotal * 0.09975 : 0
  const totalWithTaxes = subtotal + tpsAmount + tvqAmount

  // Billing progress
  const billedAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const billedPercent = totalWithTaxes > 0 ? Math.min(100, Math.round((billedAmount / totalWithTaxes) * 100)) : 0

  // Unbilled completed jobs
  const unbilledJobs = jobs.filter((j) => j.status === 'completed' && !j.invoice_id)

  // Selected jobs total
  const selectedTotal = unbilledJobs.filter((j) => selectedJobs.includes(j.id)).length * contract.price_per_visit
  const selectedTps = includeTps ? selectedTotal * 0.05 : 0
  const selectedTvq = includeTvq ? selectedTotal * 0.09975 : 0
  const selectedGrandTotal = selectedTotal + selectedTps + selectedTvq

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
            {/* Print button */}
            {contract.approval_token && (
              <Link
                href={`/contrat/${contract.approval_token}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-4 w-4" />
                {fr ? 'Imprimer' : 'Print'}
              </Link>
            )}
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
            {['approved', 'active', 'client_signed', 'fully_executed'].includes(contract.status) && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {fr ? 'G\u00e9n\u00e9rer interventions' : 'Generate jobs'}
              </button>
            )}
            {!contract.owner_signed_at && !['cancelled', 'expired', 'draft'].includes(contract.status) && (
              <button
                onClick={() => setShowSignModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                <PenLine className="h-4 w-4" />
                {fr ? 'Signer le contrat' : 'Sign contract'}
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
          <div className="space-y-6">
            {/* SERVICE */}
            <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 p-6">
              <SectionTitle label={fr ? 'SERVICE' : 'SERVICE'} />
              <DetailRow label={fr ? 'Nom du service' : 'Service name'} value={contract.service_name} />
              {contract.service_description && (
                <DetailRow label={fr ? 'Description' : 'Description'} value={contract.service_description} />
              )}
            </div>

            {/* PERIODE */}
            <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 p-6">
              <SectionTitle label={fr ? 'P\u00c9RIODE' : 'PERIOD'} />
              <DetailRow label={fr ? 'D\u00e9but' : 'Start'} value={fmtDate(contract.start_date, lang)} />
              <DetailRow label={fr ? 'Fin' : 'End'} value={fmtDate(contract.end_date, lang)} />
            </div>

            {/* RECURRENCE */}
            <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 p-6">
              <SectionTitle label={fr ? 'R\u00c9CURRENCE' : 'RECURRENCE'} />
              <DetailRow label={fr ? 'Type' : 'Type'} value={getRecurrenceLabel(contract.recurrence_type, lang)} />
              {contract.recurrence_days && contract.recurrence_days.length > 0 && (
                <DetailRow label={fr ? 'Jours' : 'Days'} value={getDayLabels(contract.recurrence_days, lang)} />
              )}
              {contract.next_job_date && (
                <DetailRow label={fr ? 'Prochaine intervention' : 'Next job'} value={fmtDate(contract.next_job_date, lang)} />
              )}
            </div>

            {/* TARIFICATION */}
            <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 p-6">
              <SectionTitle label={fr ? 'TARIFICATION' : 'PRICING'} />
              <DetailRow label={fr ? 'Prix par visite' : 'Price per visit'} value={fmtMoney(contract.price_per_visit, lang)} />
              <DetailRow label={fr ? 'Nombre de visites' : 'Number of visits'} value={String(totalJobs || '-')} />
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{fr ? 'Sous-total' : 'Subtotal'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{fmtMoney(subtotal, lang)}</span>
                </div>
                {includeTps && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">TPS (5%)</span>
                    <span className="text-gray-700 dark:text-gray-300">{fmtMoney(tpsAmount, lang)}</span>
                  </div>
                )}
                {includeTvq && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">TVQ (9,975%)</span>
                    <span className="text-gray-700 dark:text-gray-300">{fmtMoney(tvqAmount, lang)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-indigo-600">{fmtMoney(totalWithTaxes, lang)}</span>
                </div>
              </div>
            </div>

            {/* FACTURATION */}
            <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 p-6">
              <SectionTitle label={fr ? 'FACTURATION' : 'BILLING'} />
              <DetailRow label={fr ? 'Type' : 'Type'} value={getBillingTypeLabel(contract.billing_type, lang)} />
              <DetailRow label={fr ? 'Fr\u00e9quence' : 'Frequency'} value={getBillingFrequencyLabel(contract.billing_frequency, lang)} />
            </div>

            {/* APPROBATION */}
            <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 p-6">
              <SectionTitle label={fr ? 'APPROBATION' : 'APPROVAL'} />
              {contract.approved_at ? (
                <>
                  <DetailRow label={fr ? 'Approuv\u00e9 le' : 'Approved on'} value={fmtDate(contract.approved_at, lang)} />
                  {contract.approved_by_name && (
                    <DetailRow label={fr ? 'Approuv\u00e9 par' : 'Approved by'} value={contract.approved_by_name} />
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400 py-2">{fr ? 'Non approuv\u00e9' : 'Not yet approved'}</p>
              )}
            </div>

            {/* SIGNATURES */}
            <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 p-6">
              <SectionTitle label="SIGNATURES" />
              {contract.fully_executed_at ? (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 mb-4">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {fr ? 'Entièrement signé' : 'Fully signed'}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                    {fmtDate(contract.fully_executed_at, lang)}
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Owner signature */}
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
                    {fr ? 'Votre signature' : 'Your signature'}
                  </p>
                  {contract.owner_signed_at ? (
                    <>
                      <img src={contract.owner_signature!} alt="Signature" className="max-h-[60px] object-contain mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        {contract.owner_signed_name}
                      </p>
                      <p className="text-xs text-gray-500">{fmtDate(contract.owner_signed_at, lang)}</p>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">{fr ? 'Aucune signature' : 'Not signed'}</p>
                      <button
                        onClick={() => setShowSignModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
                      >
                        <PenLine className="h-3.5 w-3.5" />
                        {fr ? 'Signez maintenant' : 'Sign now'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Client signature */}
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
                    {fr ? 'Signature du client' : 'Client signature'}
                  </p>
                  {contract.client_signed_at ? (
                    <>
                      <img src={contract.client_signature!} alt="Client signature" className="max-h-[60px] object-contain mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        {contract.client_signed_name}
                      </p>
                      <p className="text-xs text-gray-500">{fmtDate(contract.client_signed_at, lang)}</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">
                      {fr ? 'En attente du client' : 'Awaiting client'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {(contract.notes || contract.internal_notes) && (
              <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 p-6">
                <SectionTitle label="NOTES" />
                {contract.notes && (
                  <DetailRow label={fr ? 'Notes client' : 'Client notes'} value={contract.notes} />
                )}
                {contract.internal_notes && (
                  <DetailRow label={fr ? 'Notes internes' : 'Internal notes'} value={contract.internal_notes} />
                )}
              </div>
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
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 p-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">{fr ? 'Factur\u00e9' : 'Billed'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {fmtMoney(billedAmount, lang)} / {fmtMoney(totalWithTaxes, lang)} ({billedPercent}%)
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${billedPercent}%` }}
                />
              </div>
            </div>

            {/* Linked invoices */}
            {invoices.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 p-6">
                <SectionTitle label={fr ? 'FACTURES' : 'INVOICES'} />
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {inv.invoice_number || inv.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">{fmtDate(inv.created_at, lang)} - {fmtMoney(inv.amount, lang)}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${INV_STATUS_BADGE[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                        {inv.status === 'paid' ? (fr ? 'Pay\u00e9e' : 'Paid') :
                         inv.status === 'sent' ? (fr ? 'Envoy\u00e9e' : 'Sent') :
                         inv.status === 'overdue' ? (fr ? 'En retard' : 'Overdue') :
                         (fr ? 'Brouillon' : 'Draft')}
                      </span>
                      <Link
                        href={`/invoice/${inv.token}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {fr ? 'Voir' : 'View'}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create invoice section */}
            <div className="rounded-2xl border border-gray-100 bg-white dark:bg-gray-900 dark:border-gray-800 p-6">
              <SectionTitle label={fr ? 'CR\u00c9ER UNE FACTURE' : 'CREATE INVOICE'} />

              {unbilledJobs.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  {fr ? 'Aucune intervention compl\u00e9t\u00e9e non factur\u00e9e' : 'No completed unbilled jobs'}
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    {fr
                      ? 'S\u00e9lectionnez les interventions compl\u00e9t\u00e9es \u00e0 facturer:'
                      : 'Select completed jobs to invoice:'}
                  </p>
                  <div className="space-y-2">
                    {/* Select all */}
                    <label className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedJobs.length === unbilledJobs.length && unbilledJobs.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedJobs(unbilledJobs.map((j) => j.id))
                          } else {
                            setSelectedJobs([])
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {fr ? 'Tout s\u00e9lectionner' : 'Select all'} ({unbilledJobs.length})
                      </span>
                    </label>
                    {unbilledJobs.map((job) => (
                      <label key={job.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedJobs.includes(job.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedJobs((prev) => [...prev, job.id])
                            } else {
                              setSelectedJobs((prev) => prev.filter((jid) => jid !== job.id))
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white">{job.title}</p>
                          <p className="text-xs text-gray-500">{fmtDate(job.scheduled_date, lang)}</p>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {fmtMoney(contract.price_per_visit, lang)}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Selected total */}
                  {selectedJobs.length > 0 && (
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{fr ? 'Sous-total' : 'Subtotal'} ({selectedJobs.length} {fr ? 'visites' : 'visits'})</span>
                        <span className="font-medium text-gray-900 dark:text-white">{fmtMoney(selectedTotal, lang)}</span>
                      </div>
                      {includeTps && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">TPS (5%)</span>
                          <span className="text-gray-700 dark:text-gray-300">{fmtMoney(selectedTps, lang)}</span>
                        </div>
                      )}
                      {includeTvq && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">TVQ (9,975%)</span>
                          <span className="text-gray-700 dark:text-gray-300">{fmtMoney(selectedTvq, lang)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-base font-bold">
                        <span className="text-gray-900 dark:text-white">Total</span>
                        <span className="text-indigo-600">{fmtMoney(selectedGrandTotal, lang)}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCreateInvoice}
                    disabled={selectedJobs.length === 0 || creatingInvoice}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {creatingInvoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                    {fr ? 'Cr\u00e9er la facture' : 'Create invoice'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {fr ? 'Signer le contrat' : 'Sign the contract'}
              </h2>
              <button onClick={() => setShowSignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {fr ? 'Votre nom' : 'Your name'} *
              </label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder={fr ? 'Votre nom complet' : 'Your full name'}
                className="w-full rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {fr ? 'Votre signature' : 'Your signature'}
              </label>
              <SignaturePad
                onSave={(dataUrl) => handleOwnerSign(dataUrl)}
                onClear={() => {}}
              />
            </div>
            {signingOwner && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
              </div>
            )}
            {!signingOwner && signatureName.trim() && (
              <button
                type="button"
                disabled={!signatureName.trim()}
                onClick={() => {
                  // Quick typed signature fallback
                  const canvas = document.createElement('canvas')
                  canvas.width = 400
                  canvas.height = 150
                  const ctx = canvas.getContext('2d')
                  if (ctx) {
                    ctx.fillStyle = '#ffffff'
                    ctx.fillRect(0, 0, 400, 150)
                    ctx.fillStyle = '#000000'
                    ctx.font = 'italic 32px Georgia, "Times New Roman", serif'
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillText(signatureName.trim(), 200, 75)
                    handleOwnerSign(canvas.toDataURL('image/png'))
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <Type className="h-3.5 w-3.5" />
                {fr ? 'Ou signer avec votre nom tap\u00e9' : 'Or sign with your typed name'}
              </button>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}

function SectionTitle({ label }: { label: string }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{label}</p>
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
