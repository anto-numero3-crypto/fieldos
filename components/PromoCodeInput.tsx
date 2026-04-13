'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Gift, Check, Loader2 } from 'lucide-react'

interface Props {
  userId: string
  onApplied?: () => void
}

export default function PromoCodeInput({ userId, onApplied }: Props) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState<{ plan: string; durationDays: number; expiresAt: string } | null>(null)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!code.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), userId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Impossible d\'appliquer le code')
        return
      }
      setApplied({ plan: data.plan, durationDays: data.durationDays, expiresAt: data.expiresAt })
      toast.success(`Code appliqué ! Plan ${data.plan} pendant ${data.durationDays} jours.`)
      onApplied?.()
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (applied) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-emerald-700">
          <Check className="h-5 w-5" />
          <p className="font-semibold">Code appliqué !</p>
        </div>
        <p className="text-sm text-gray-700 mt-1">
          Accès au forfait <strong className="capitalize">{applied.plan}</strong> pendant {applied.durationDays} jours —
          expire le {new Date(applied.expiresAt).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
          <Gift className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Code promotionnel</h3>
          <p className="text-xs text-gray-500 mt-0.5">Entrez un code pour activer un forfait gratuit ou prolonger votre accès.</p>
        </div>
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
          placeholder="GESTIVIO-XXX"
          className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-mono tracking-wider focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Appliquer'}
        </button>
      </form>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  )
}
