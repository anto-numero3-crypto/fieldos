'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/LanguageContext'
import { PLAN_PRICING } from '@/lib/plan-limits'
import { Check, Loader2, Sparkles, Tag, X } from 'lucide-react'
import GestivioLogo from '@/components/GestivioLogo'

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

  const choose = async (planId: 'demarrage' | 'pro' | 'croissance') => {
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

  const features: Record<'demarrage' | 'pro' | 'croissance', string[]> = {
    demarrage: fr
      ? [
          '1 utilisateur',
          "Jusqu'à 50 clients",
          '25 interventions par mois',
          '30 messages IA par mois',
          'Facturation et devis illimités',
          'Paiements en ligne (Stripe)',
          'Portail de réservation public',
          'Synchronisation Google Calendar',
          'Catalogue de produits et services',
          'Support par courriel (3 j ouvrables)',
        ]
      : [
          '1 user',
          'Up to 50 customers',
          '25 jobs per month',
          '30 AI messages per month',
          'Unlimited invoicing and quotes',
          'Online payments (Stripe)',
          'Public booking portal',
          'Google Calendar sync',
          'Product & service catalog',
          'Email support (3 business days)',
        ],
    pro: fr
      ? [
          'Tout Démarrage, plus :',
          "Jusqu'à 5 utilisateurs (équipe)",
          'Clients, interventions et IA illimités',
          'App mobile employé et assignations',
          'Interventions sur plusieurs jours',
          'Interventions simultanées côte-à-côte',
          'Contrats récurrents',
          'Suivi du temps (poinçonnage mobile)',
          'Campagnes marketing clients',
          'Rapports complets et analyses IA',
          'Export CSV et notifications de complétion',
          'Aucune marque Gestivio',
          'Support prioritaire (2 j ouvrables)',
        ]
      : [
          'Everything in Starter, plus:',
          'Up to 5 users (team)',
          'Unlimited customers, jobs and AI',
          'Employee mobile app and assignments',
          'Multi-day jobs',
          'Side-by-side overlapping jobs',
          'Recurring contracts',
          'Time tracking (mobile punch in/out)',
          'Customer marketing campaigns',
          'Full reports and AI Insights',
          'CSV export and completion notifications',
          'No Gestivio branding',
          'Priority support (2 business days)',
        ],
    croissance: fr
      ? [
          'Tout Pro, plus :',
          "Jusqu'à 15 utilisateurs",
          'Accompagnement migration de données',
          'Support prioritaire (1 j ouvrable)',
          'Accès anticipé aux nouvelles fonctionnalités',
          'Formation à la demande : 100 $/h',
        ]
      : [
          'Everything in Pro, plus:',
          'Up to 15 users',
          'Data migration assistance',
          'Priority support (1 business day)',
          'Early access to new features',
          'On-demand training: $100/hr',
        ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <GestivioLogo size="lg" />
        </div>

        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 px-4 py-1.5 mb-4">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {fr ? 'Essai gratuit 14 jours' : '14-day free trial'}
            </span>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {fr ? 'Aucune carte requise' : 'No card required'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {fr ? 'Votre essai gratuit est terminé' : 'Your free trial has ended'}
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-300">
            {fr ? 'Choisissez un plan pour continuer à utiliser Gestivio' : 'Choose a plan to continue using Gestivio'}
          </p>
        </div>

        <div className="max-w-md mx-auto mb-8">
          {redeeming ? (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {fr ? 'Accès gratuit activé ! Redirection en cours…' : 'Free access activated! Redirecting…'}
              </p>
            </div>
          ) : promoValid && !promoValid.is_free_access ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
              <Tag className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <p className="flex-1 text-sm text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold">{promoValid.code}</span> — {fr ? `−${promoValid.discount_percent}% sur votre premier paiement` : `−${promoValid.discount_percent}% on first payment`}
              </p>
              <button onClick={clearPromo} className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value); setPromoError(null) }}
                  placeholder={fr ? 'Code promo (facultatif)' : 'Promo code (optional)'}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button
                  onClick={applyPromo}
                  disabled={promoLoading || !promoInput.trim()}
                  className="rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-60 transition-colors"
                >
                  {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (fr ? 'Appliquer' : 'Apply')}
                </button>
              </div>
              {promoError && <p className="mt-2 text-xs text-red-600">{promoError}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCycle('monthly')}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${cycle === 'monthly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
            >
              {fr ? 'Mensuel' : 'Monthly'}
            </button>
            <button
              onClick={() => setCycle('annual')}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${cycle === 'annual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
            >
              {fr ? 'Annuel' : 'Annual'} <span className="ml-1 text-xs text-emerald-500">{fr ? '−10%' : '−10%'}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-start">
          {(['demarrage', 'pro', 'croissance'] as const).map((key) => {
            const p = PLAN_PRICING[key]
            const highlighted = key === 'pro'
            const price = cycle === 'annual' ? p.annual : p.monthly
            const label = fr ? p.label : p.labelEn
            const tagline = fr ? p.tagline : p.taglineEn
            return (
              <div
                key={key}
                className={`relative rounded-2xl p-6 shadow-sm border transition-all ${highlighted ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800 shadow-xl shadow-indigo-100 dark:shadow-indigo-950 scale-[1.03]' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}
              >
                {highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                    <Sparkles className="h-3 w-3" /> {fr ? 'Plus populaire' : 'Most popular'}
                  </span>
                )}
                <h3 className={`text-lg font-bold mb-1 ${highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{label}</h3>
                <p className={`text-sm mb-4 ${highlighted ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>{tagline}</p>
                <div className="mb-5">
                  {promoValid && !promoValid.is_free_access && promoValid.discount_percent ? (
                    <>
                      <span className={`text-sm line-through mr-2 ${highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>${price}</span>
                      <span className={`text-4xl font-bold ${highlighted ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>${Math.round(price * (1 - promoValid.discount_percent / 100))}</span>
                      <span className={`text-sm ${highlighted ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>{fr ? ' / mois' : ' / mo'}</span>
                      <p className={`text-xs mt-1 ${highlighted ? 'text-indigo-100' : 'text-emerald-600 dark:text-emerald-400'}`}>{fr ? `Économie de ${promoValid.discount_percent}%` : `${promoValid.discount_percent}% off`}</p>
                    </>
                  ) : (
                    <>
                      <span className={`text-4xl font-bold ${highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>${price}</span>
                      <span className={`text-sm ${highlighted ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>{fr ? ' / mois' : ' / mo'}</span>
                      {cycle === 'annual' && (
                        <p className={`text-xs mt-1 ${highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>{fr ? `Facturé ${p.annualTotal} $/an` : `Billed $${p.annualTotal}/year`}</p>
                      )}
                    </>
                  )}
                </div>
                <ul className="space-y-2 mb-6">
                  {features[key].map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${highlighted ? 'text-indigo-50' : 'text-gray-700 dark:text-gray-300'}`}>
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${highlighted ? 'text-white' : 'text-emerald-500'}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => choose(key)}
                  disabled={loading !== null}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.99] ${
                    highlighted
                      ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                      : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
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
          <button onClick={signOut} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline transition-colors">
            {fr ? 'Se déconnecter' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  )
}
