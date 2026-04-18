'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'
import { fmtMoney, fmtDate } from '@/lib/format'
import {
  CheckCircle, FileText, Calendar, DollarSign, Loader2, Send,
  MessageSquare, Wrench, AlertCircle,
} from 'lucide-react'

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

interface ContractData {
  id: string
  title: string
  description: string | null
  status: string
  start_date: string
  end_date: string
  recurrence_type: string
  service_name: string
  service_description: string | null
  price_per_visit: number
  total_price: number
  approval_token: string
  notes: string | null
  org_id: string
  customers: { name: string; email: string | null } | null
}

interface OrgData {
  name: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
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

export default function ContractApprovalPage() {
  const { token } = useParams<{ token: string }>()
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const [contract, setContract] = useState<ContractData | null>(null)
  const [org, setOrg] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [approved, setApproved] = useState(false)
  const [approving, setApproving] = useState(false)
  const [name, setName] = useState('')
  const [showModify, setShowModify] = useState(false)
  const [comments, setComments] = useState('')
  const [modifySent, setModifySent] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabasePublic
        .from('contracts')
        .select('*, customers(name, email)')
        .eq('approval_token', token)
        .maybeSingle()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setContract(data)

      if (['approved', 'active'].includes(data.status)) {
        setApproved(true)
      }

      // Fetch org info
      const { data: orgData } = await supabasePublic
        .from('organizations')
        .select('name, phone, email, logo_url')
        .eq('id', data.org_id)
        .maybeSingle()

      if (orgData) setOrg(orgData)
      setLoading(false)
    }
    load()
  }, [token])

  const handleApprove = async () => {
    if (!name.trim() || !contract) return
    setApproving(true)
    try {
      const res = await fetch(`/api/contracts/${contract.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim() }),
      })
      if (res.ok) {
        setApproved(true)
      }
    } catch { /* ignore */ } finally {
      setApproving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {fr ? 'Contrat introuvable' : 'Contract not found'}
          </h1>
          <p className="text-gray-500">
            {fr ? 'Ce lien est invalide ou expir\u00e9.' : 'This link is invalid or expired.'}
          </p>
        </div>
      </div>
    )
  }

  if (!contract) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
              <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-gray-900">{org?.name || 'Gestivio'}</span>
          </div>
          <LanguageToggle />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {approved ? (
          // Success state
          <div className="rounded-2xl bg-white border border-gray-100 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {fr ? 'Contrat approuv\u00e9!' : 'Contract approved!'}
            </h1>
            <p className="text-gray-500 max-w-md mx-auto">
              {fr
                ? `Merci! Le contrat "${contract.title}" a \u00e9t\u00e9 approuv\u00e9 avec succ\u00e8s. ${org?.name || 'L\u2019entreprise'} vous contactera bient\u00f4t.`
                : `Thank you! The contract "${contract.title}" has been approved successfully. ${org?.name || 'The business'} will be in touch soon.`}
            </p>
          </div>
        ) : (
          // Contract details + approval form
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {fr ? 'Contrat de service' : 'Service contract'}
              </h1>
              <p className="text-gray-500">
                {fr
                  ? `${org?.name || 'L\u2019entreprise'} vous propose le contrat suivant`
                  : `${org?.name || 'The business'} is proposing the following contract`}
              </p>
            </div>

            {/* Contract info */}
            <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900">{contract.title}</h2>
              {contract.description && (
                <p className="text-sm text-gray-600">{contract.description}</p>
              )}

              <div className="grid gap-3">
                <InfoRow icon={FileText} label={fr ? 'Service' : 'Service'} value={contract.service_name} />
                {contract.service_description && (
                  <InfoRow icon={FileText} label={fr ? 'D\u00e9tails' : 'Details'} value={contract.service_description} />
                )}
                <InfoRow icon={Calendar} label={fr ? 'P\u00e9riode' : 'Period'} value={`${fmtDate(contract.start_date, lang)} - ${fmtDate(contract.end_date, lang)}`} />
                <InfoRow icon={Calendar} label={fr ? 'Fr\u00e9quence' : 'Frequency'} value={recurrenceLabel(contract.recurrence_type, fr)} />
              </div>
            </div>

            {/* Price breakdown */}
            <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-indigo-600" />
                {fr ? 'Tarification' : 'Pricing'}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{fr ? 'Prix par visite' : 'Price per visit'}</span>
                  <span className="font-medium text-gray-900">{fmtMoney(contract.price_per_visit, lang)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-base font-bold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-indigo-600">{fmtMoney(contract.total_price, lang)}</span>
                </div>
              </div>
            </div>

            {contract.notes && (
              <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                <p className="text-sm text-gray-600">{contract.notes}</p>
              </div>
            )}

            {/* Approve */}
            <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {fr ? 'Votre nom complet' : 'Your full name'} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={fr ? 'Pr\u00e9nom et nom' : 'First and last name'}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>
              <button
                onClick={handleApprove}
                disabled={!name.trim() || approving}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {fr ? 'Approuver le contrat' : 'Approve contract'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowModify(!showModify)}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {fr ? 'Demander des modifications' : 'Request modifications'}
                </button>
              </div>

              {showModify && !modifySent && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                    placeholder={fr ? 'D\u00e9crivez les modifications souhait\u00e9es...' : 'Describe the changes you would like...'}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => setModifySent(true)}
                    disabled={!comments.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {fr ? 'Envoyer la demande' : 'Send request'}
                  </button>
                </div>
              )}
              {modifySent && (
                <p className="text-sm text-emerald-600 text-center">
                  {fr ? 'Votre demande a \u00e9t\u00e9 envoy\u00e9e.' : 'Your request has been sent.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-xs text-gray-400">
            {fr ? 'Propuls\u00e9 par' : 'Powered by'}{' '}
            <a href="https://gestivio.ca" className="text-indigo-500 hover:underline">Gestivio</a>
          </p>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  )
}
