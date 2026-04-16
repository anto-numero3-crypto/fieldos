'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Plus, Check, X } from 'lucide-react'

interface Code {
  id: string
  code: string
  plan: 'demarrage' | 'pro' | 'croissance'
  duration_days: number
  max_uses: number
  uses_count: number
  is_active: boolean
  description: string | null
  expires_at: string | null
  created_at: string
}
interface Redemption {
  id: string
  user_id: string
  org_id: string | null
  redeemed_at: string
  plan_expires_at: string | null
  promo_code_id: string
  promo_codes: { code: string; plan: string } | null
}

export default function PromoAdminPage() {
  const [secret, setSecret] = useState('')
  const [entered, setEntered] = useState<string | null>(null)
  const [codes, setCodes] = useState<Code[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Create form
  const [newCode, setNewCode] = useState('')
  const [newPlan, setNewPlan] = useState<Code['plan']>('croissance')
  const [newDuration, setNewDuration] = useState('30')
  const [newMaxUses, setNewMaxUses] = useState('1')
  const [newDesc, setNewDesc] = useState('')

  // Pull secret from URL on mount (allows ?secret=... bookmarking)
  useEffect(() => {
    const urlSecret = new URLSearchParams(window.location.search).get('secret')
    if (urlSecret) { setSecret(urlSecret); setEntered(urlSecret) }
  }, [])

  const load = useCallback(async (s: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/promo?secret=${encodeURIComponent(s)}`)
      if (!res.ok) {
        setError('Clé admin invalide.')
        setEntered(null)
        return
      }
      const data = await res.json()
      setCodes(data.codes || [])
      setRedemptions(data.redemptions || [])
    } catch {
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (entered) load(entered)
  }, [entered, load])

  const createCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entered || !newCode.trim()) return
    const res = await fetch(`/api/admin/promo?secret=${encodeURIComponent(entered)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: newCode.trim().toUpperCase(),
        plan: newPlan,
        duration_days: parseInt(newDuration) || 30,
        max_uses: parseInt(newMaxUses) || 1,
        description: newDesc || null,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Erreur')
      return
    }
    setNewCode(''); setNewDesc(''); setNewDuration('30'); setNewMaxUses('1')
    load(entered)
  }

  const toggleActive = async (c: Code) => {
    if (!entered) return
    await fetch(`/api/admin/promo?id=${c.id}&secret=${encodeURIComponent(entered)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !c.is_active }),
    })
    load(entered)
  }

  if (!entered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); if (secret.trim()) setEntered(secret.trim()) }}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 w-full max-w-md"
        >
          <h1 className="text-xl font-bold text-gray-900 mb-1">Gestivio — Admin</h1>
          <p className="text-sm text-gray-500 mb-5">Entrez la clé administrateur.</p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="ADMIN_SECRET"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <button type="submit" className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            Se connecter
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Codes promotionnels</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez vos codes de beta / partenaires / démos.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          <>
            {/* Create form */}
            <form onSubmit={createCode} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-600" /> Nouveau code
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="GESTIVIO-XXX"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono md:col-span-2 uppercase"
                />
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as Code['plan'])}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                >
                  <option value="demarrage">Démarrage</option>
                  <option value="pro">Pro</option>
                  <option value="croissance">Croissance</option>
                </select>
                <input
                  type="number" min="1" value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  placeholder="Jours"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  type="number" min="1" value={newMaxUses}
                  onChange={(e) => setNewMaxUses(e.target.value)}
                  placeholder="Max usages"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optionnel)"
                className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" /> Créer
              </button>
            </form>

            {/* Codes list */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Codes actifs et passés ({codes.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-left">Forfait</th>
                      <th className="px-4 py-3 text-left">Durée</th>
                      <th className="px-4 py-3 text-left">Utilisations</th>
                      <th className="px-4 py-3 text-left">Statut</th>
                      <th className="px-4 py-3 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((c) => (
                      <tr key={c.id} className="border-t border-gray-50">
                        <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                        <td className="px-4 py-3 capitalize">{c.plan}</td>
                        <td className="px-4 py-3">{c.duration_days} j</td>
                        <td className="px-4 py-3">{c.uses_count}/{c.max_uses}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(c)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                          >
                            {c.is_active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {c.is_active ? 'Actif' : 'Inactif'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{c.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent redemptions */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Redemptions récentes ({redemptions.length})</h2>
              </div>
              {redemptions.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-gray-400">Aucune utilisation pour le moment.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Code</th>
                        <th className="px-4 py-3 text-left">Utilisateur</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Expire</th>
                      </tr>
                    </thead>
                    <tbody>
                      {redemptions.map((r) => (
                        <tr key={r.id} className="border-t border-gray-50">
                          <td className="px-4 py-3 font-mono">{r.promo_codes?.code || '—'}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.user_id.slice(0, 8)}…</td>
                          <td className="px-4 py-3">{new Date(r.redeemed_at).toLocaleDateString('fr-CA')}</td>
                          <td className="px-4 py-3">{r.plan_expires_at ? new Date(r.plan_expires_at).toLocaleDateString('fr-CA') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
