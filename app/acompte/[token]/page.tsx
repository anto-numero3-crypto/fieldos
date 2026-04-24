'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Wallet, Loader2, AlertCircle } from 'lucide-react'
import { fmtMoney } from '@/lib/format'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

interface JobRow {
  id: string
  title: string
  description: string | null
  deposit_amount: number | null
  deposit_paid_at: string | null
  customers: { name: string; email?: string } | null
}
interface OrgRow {
  name: string | null
  email: string | null
  phone: string | null
  logo_url: string | null
  stripe_connect_charges_enabled: boolean | null
}

export default function StandaloneDepositPage() {
  const { token } = useParams<{ token: string }>()
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const [job, setJob] = useState<JobRow | null>(null)
  const [org, setOrg] = useState<OrgRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/jobs/public/deposit/${token}`)
        if (!res.ok) { setNotFound(true); return }
        const data = await res.json()
        setJob(data.job as JobRow)
        setOrg(data.org as OrgRow)
      } finally { setLoading(false) }
    })()
  }, [token])

  const handlePay = async () => {
    setPaying(true); setError(null)
    try {
      const res = await fetch('/api/stripe/deposit-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'job', token }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
      setPaying(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  if (notFound || !job) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{fr ? 'Lien invalide' : 'Invalid link'}</h1>
        <p className="text-sm text-gray-500 mt-1">{fr ? 'Ce lien d\'acompte n\'existe pas ou a expiré.' : 'This deposit link does not exist or has expired.'}</p>
      </div>
    </div>
  )

  const justPaid = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('paid') === 'true'
  const paid = !!job.deposit_paid_at || justPaid

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="fixed top-4 right-4 z-10"><LanguageToggle /></div>
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-6 border-b border-gray-100 dark:border-gray-800">
            {org?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logo_url} alt={org.name || ''} className="h-10 mb-3" />
            )}
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{org?.name}</p>
          </div>
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-600">
              <Wallet className="h-4 w-4" /> {fr ? 'Demande d\'acompte' : 'Deposit request'}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{fr ? 'Pour' : 'For'}</p>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{job.title}</h1>
              {job.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{job.description}</p>}
            </div>
            <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 p-5 text-center">
              <p className="text-xs text-violet-700 dark:text-violet-300 font-semibold uppercase tracking-wider">{fr ? 'Montant de l\'acompte' : 'Deposit amount'}</p>
              <p className="mt-1 text-3xl font-black text-violet-900 dark:text-violet-200">
                {fmtMoney(Number(job.deposit_amount || 0), lang)}
              </p>
            </div>

            {paid ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{fr ? 'Acompte versé — Merci !' : 'Deposit paid — Thank you!'}</p>
                </div>
              </div>
            ) : (
              <>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {!org?.stripe_connect_charges_enabled ? (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                    {fr ? 'Ce prestataire n\'a pas encore activé les paiements en ligne. Veuillez le contacter directement.' : 'This provider has not yet enabled online payments. Please contact them directly.'}
                  </div>
                ) : (
                  <button
                    onClick={handlePay}
                    disabled={paying}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60 transition-all"
                  >
                    {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                    {fr ? `Payer l'acompte de ${fmtMoney(Number(job.deposit_amount || 0), lang)}` : `Pay deposit of ${fmtMoney(Number(job.deposit_amount || 0), lang)}`}
                  </button>
                )}
                <p className="text-[11px] text-gray-400 text-center">{fr ? 'Paiement sécurisé par Stripe' : 'Secure payment by Stripe'}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
