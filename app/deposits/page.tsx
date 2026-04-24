'use client'

import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { supabase } from '../supabase'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtMoney, fmtDate } from '@/lib/format'
import { Wallet, CheckCircle, RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm-dialog'

interface DepositRow {
  id: string
  amount: number
  status: string
  source: string
  paid_at: string | null
  refunded_at: string | null
  refunded_amount: number
  refund_reason: string | null
  quote_id: string | null
  contract_id: string | null
  job_id: string | null
  invoice_id: string | null
  customer_id: string | null
  customers?: { name: string } | null
}

export default function DepositsPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const confirm = useConfirm()
  const [deposits, setDeposits] = useState<DepositRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refunding, setRefunding] = useState<string | null>(null)

  const load = async () => {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { window.location.href = '/login'; return }
    const { data } = await supabase
      .from('deposits')
      .select('*, customers(name)')
      .eq('user_id', auth.user.id)
      .order('paid_at', { ascending: false })
    setDeposits((data || []) as unknown as DepositRow[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const totals = useMemo(() => {
    const collected = deposits.filter((d) => d.status === 'paid' || d.status === 'partial_refunded').reduce((s, d) => s + Number(d.amount) - Number(d.refunded_amount || 0), 0)
    const refunded = deposits.reduce((s, d) => s + Number(d.refunded_amount || 0), 0)
    const pending = deposits.filter((d) => d.status === 'pending').length
    return { collected, refunded, pending }
  }, [deposits])

  const refund = async (d: DepositRow, partial: boolean) => {
    let amount: number | undefined
    if (partial) {
      const max = Number(d.amount) - Number(d.refunded_amount || 0)
      const val = window.prompt(fr ? `Montant à rembourser (max ${max.toFixed(2)} $)` : `Amount to refund (max ${max.toFixed(2)})`)
      if (!val) return
      amount = Number(val)
      if (!Number.isFinite(amount) || amount <= 0 || amount > max) {
        toast.error(fr ? 'Montant invalide' : 'Invalid amount')
        return
      }
    } else {
      const { confirmed } = await confirm({
        title: fr ? 'Rembourser cet acompte ?' : 'Refund this deposit?',
        description: fr ? `Le client sera remboursé de ${fmtMoney(Number(d.amount) - Number(d.refunded_amount || 0), lang)}.` : `The customer will be refunded ${fmtMoney(Number(d.amount) - Number(d.refunded_amount || 0), lang)}.`,
        confirmLabel: fr ? 'Confirmer le remboursement' : 'Confirm refund',
      })
      if (!confirmed) return
    }

    const reason = window.prompt(fr ? 'Motif (optionnel)' : 'Reason (optional)') || undefined

    setRefunding(d.id)
    try {
      const res = await fetch(`/api/deposits/${d.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Refund failed'); return }
      toast.success(fr ? 'Remboursement effectué' : 'Refund issued')
      await load()
    } finally { setRefunding(null) }
  }

  return (
    <AppLayout title={fr ? 'Acomptes' : 'Deposits'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/30 mb-2"><Wallet className="h-4 w-4 text-violet-600" /></div>
            <p className="text-xs text-gray-500">{fr ? 'Encaissé (net)' : 'Collected (net)'}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{fmtMoney(totals.collected, lang)}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30 mb-2"><RotateCcw className="h-4 w-4 text-amber-600" /></div>
            <p className="text-xs text-gray-500">{fr ? 'Remboursé' : 'Refunded'}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{fmtMoney(totals.refunded, lang)}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 mb-2"><CheckCircle className="h-4 w-4 text-gray-500" /></div>
            <p className="text-xs text-gray-500">{fr ? 'En attente' : 'Pending'}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{totals.pending}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : deposits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 text-center">
            <Wallet className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{fr ? 'Aucun acompte' : 'No deposits yet'}</h2>
            <p className="mt-1 text-sm text-gray-500">{fr ? 'Les acomptes versés par vos clients apparaîtront ici.' : 'Deposits paid by your customers will appear here.'}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
              <thead><tr className="bg-gray-50 dark:bg-gray-800/50">
                {(fr ? ['Date', 'Client', 'Source', 'Montant', 'Statut', ''] : ['Date', 'Customer', 'Source', 'Amount', 'Status', '']).map((c) => (
                  <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{c}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {deposits.map((d) => {
                  const netCollected = Number(d.amount) - Number(d.refunded_amount || 0)
                  const statusLabel = d.status === 'paid' ? (fr ? 'Versé' : 'Paid')
                    : d.status === 'refunded' ? (fr ? 'Remboursé' : 'Refunded')
                    : d.status === 'partial_refunded' ? (fr ? 'Partiellement remboursé' : 'Partial refund')
                    : (fr ? 'En attente' : 'Pending')
                  const statusCls = d.status === 'paid' ? 'bg-violet-50 text-violet-700'
                    : d.status === 'refunded' ? 'bg-gray-100 text-gray-500'
                    : d.status === 'partial_refunded' ? 'bg-amber-50 text-amber-700'
                    : 'bg-gray-50 text-gray-500'
                  return (
                    <tr key={d.id}>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{d.paid_at ? fmtDate(d.paid_at, lang) : '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{d.customers?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 capitalize">{d.source}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {fmtMoney(netCollected, lang)}
                        {Number(d.refunded_amount || 0) > 0 && (
                          <span className="ml-1 text-xs text-gray-400">({fmtMoney(Number(d.amount), lang)} − {fmtMoney(Number(d.refunded_amount), lang)})</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCls}`}>{statusLabel}</span></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(d.status === 'paid' || d.status === 'partial_refunded') && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => refund(d, false)}
                              disabled={refunding === d.id}
                              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 disabled:opacity-50"
                            >{fr ? 'Rembourser' : 'Refund'}</button>
                            <button
                              onClick={() => refund(d, true)}
                              disabled={refunding === d.id}
                              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                            >{fr ? 'Partiel' : 'Partial'}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
