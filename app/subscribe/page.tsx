'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/LanguageContext'
import { PLAN_PRICING } from '@/lib/plan-limits'
import { Wrench, Check, Loader2, Sparkles, Tag, X } from 'lucide-react'

interface ValidPromo {
  code: string
  code_type: string
  discount_percent: number | null
  description: string | null
  is_free_access: boolean
}

export default function SubscribePage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoValid, setPromoValid] = useState<ValidPromo | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      setEmail(data.user.email || null)
    })
  }, [])

  const applyPromo = async () => {
    setPromoError(null)
    if (!promoInput.trim()) return
    setPromoLoading(true)
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput }),
      })
      const data = await res.json() as ValidPromo & { valid: boolean; error?: string }
      if (!data.valid) {
        setPromoError(fr ? 'Code invalide ou expiré' : 'Invalid or expired code')
        setPromoValid(null)
        return
      }
      setPromoValid(data)
      if (data.is_free_access) {
        setRedeeming(true)
        const r = await fetch('/api/promo/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: data.code }),
        })
        const rd = await r.json()
        if (!r.ok) {
          setPromoError(rd.error || (fr ? "Impossible d'appliquer le code" : 'Unable to apply code'))
          setPromoValid(null)
          setRedeeming(false)
          return
        }
        toast.success(fr ? 'Code appliqué — Accès gratuit activé !' : 'Code applied — Free access activated!')
        setTimeout(() => { window.location.href = '/dashboard?subscribed=true' }, 1500)
      }
    } catch (err) {
      console.error('[promo validate]', err)
      setPromoError(fr ? 'Erreur de validation' : 'Validation error')
    } finally {
      setPromoLoading(false)
    }
  }

  const clearPromo = () => { setPromoValid(null); setPromoInput(''); setPromoError(null) }

  const choose = async (planId: 'starter' | 'pro' | 'business') => {
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, cycle, promoCode: promoValid && !promoValid.is_free_access ? promoValid.code : undefined }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast.error(data.error || (fr ? 'Erreur' : 'Error'))
        setLoading(null)
        return
      }
      window.location.href = data.url
    } catch (err) {
      console.error('[subscribe]', err)
      toast.error(fr ? 'Erreur' : 'Error')
      setLoading(null)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const features: Record<'starter' | 'pro' | 'business', string[]> = {
    starter: fr
      ? ['1 utilisateur', "Jusqu'à 50 clients", '30 interventions par mois', 'Facturation et paiements', 'Portail de réservation']
      : ['1 user', 'Up to 50 customers', '30 jobs per month', 'Invoicing and payments', 'Booking portal'],
    pro: fr
      ? ['5 utilisateurs', 'Clients illimités', 'Interventions illimitées', 'Assistant IA', 'Analyses avancées', 'Campagnes marketing']
      : ['5 users', 'Unlimited customers', 'Unlimited jobs', 'AI assistant', 'Advanced analytics', 'Marketing campaigns'],
    business: fr
      ? ['15 utilisateurs', 'Tout dans Pro', 'SMS automatisés', 'Export QuickBooks', 'Marque blanche', 'Support prioritaire']
      : ['15 users', 'Everything in Pro', 'Automated SMS', 'QuickBooks export', 'White-label branding', 'Priority support'],
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
            <Wrench className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-gray-900">Gestivio</span>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {fr ? 'Votre essai gratuit est terminé' : 'Your free trial has ended'}
          </h1>
          <p className="text-base text-gray-600">
            {fr ? 'Choisissez un plan pour continuer à utiliser Gestivio' : 'Choose a plan to continue using Gestivio'}
          </p>
        </div>

        <div className="max-w-md mx-auto mb-8">
          {redeeming ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-800">
                {fr ? 'Accès gratuit activé ! Redirection en cours…' : 'Free access activated! Redirecting…'}
              </p>
            </div>
          ) : promoValid && !promoValid.is_free_access ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
              <Tag className="h-4 w-4 text-emerald-700" />
              <p className="flex-1 text-sm text-emerald-800">
                <span className="font-semibold">{promoValid.code}</span> — {fr ? `−${promoValid.discount_percent}% sur votre premier paiement` : `−${promoValid.discount_percent}% on first payment`}
              </p>
              <button onClick={clearPromo} className="text-emerald-700 hover:text-emerald-900"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value); setPromoError(null) }}
                  placeholder={fr ? 'Code promo (facultatif)' : 'Promo code (optional)'}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  onClick={applyPromo}
                  disabled={promoLoading || !promoInput.trim()}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (fr ? 'Appliquer' : 'Apply')}
                </button>
              </div>
              {promoError && <p className="mt-2 text-xs text-red-600">{promoError}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1 mb-8">
          <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setCycle('monthly')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${cycle === 'monthly' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {fr ? 'Mensuel' : 'Monthly'}
            </button>
            <button
              onClick={() => setCycle('annual')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${cycle === 'annual' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {fr ? 'Annuel' : 'Annual'} <span className="ml-1 text-xs text-emerald-300">−20%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(['starter', 'pro', 'business'] as const).map((key) => {
            const p = PLAN_PRICING[key]
            const highlighted = key === 'pro'
            const price = cycle === 'annual' ? p.annual : p.monthly
            return (
              <div
                key={key}
                className={`relative rounded-2xl bg-white p-6 shadow-sm border ${highlighted ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200'}`}
              >
                {highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                    <Sparkles className="h-3 w-3" /> {fr ? 'Populaire' : 'Popular'}
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{p.label}</h3>
                <p className="text-sm text-gray-500 mb-4">{p.tagline}</p>
                <div className="mb-5">
                  {promoValid && !promoValid.is_free_access && promoValid.discount_percent ? (
                    <>
                      <span className="text-sm text-gray-400 line-through mr-2">${price}</span>
                      <span className="text-4xl font-bold text-emerald-600">${Math.round(price * (1 - promoValid.discount_percent / 100))}</span>
                      <span className="text-sm text-gray-500">{fr ? ' / mois' : ' / mo'}</span>
                      <p className="text-xs text-emerald-600 mt-1">{fr ? `Économie de ${promoValid.discount_percent}%` : `${promoValid.discount_percent}% off`}</p>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-gray-900">${price}</span>
                      <span className="text-sm text-gray-500">{fr ? ' / mois' : ' / mo'}</span>
                      {cycle === 'annual' && (
                        <p className="text-xs text-gray-400 mt-1">{fr ? 'Facturé annuellement' : 'Billed annually'}</p>
                      )}
                    </>
                  )}
                </div>
                <ul className="space-y-2 mb-6">
                  {features[key].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => choose(key)}
                  disabled={loading !== null}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    highlighted
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-60`}
                >
                  {loading === key
                    ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{fr ? 'Redirection...' : 'Redirecting...'}</span>
                    : (fr ? 'Choisir ce plan' : 'Choose this plan')}
                </button>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-10 text-xs text-gray-400">
          {email && <p className="mb-2">{fr ? 'Connecté en tant que' : 'Signed in as'} {email}</p>}
          <button onClick={signOut} className="text-gray-500 hover:text-gray-700 underline">
            {fr ? 'Se déconnecter' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  )
}
