'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Sparkles, AlertTriangle } from 'lucide-react'
import { usePlan } from '@/lib/hooks/usePlan'
import { useLanguage } from '@/lib/LanguageContext'

// Top-of-page trial banner. Dismissible per session. Color ramps up as
// trial expiry approaches.
export default function TrialBanner() {
  const plan = usePlan()
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const [dismissed, setDismissed] = useState(false)

  if (plan.loading || dismissed) return null

  // Expired → red banner
  if (plan.status === 'expired') {
    return (
      <div className="bg-red-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center gap-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="flex-1 font-medium">
            {fr
              ? 'Votre essai Pro est terminé. Vous êtes maintenant sur le forfait Démarrage — certaines fonctionnalités sont restreintes.'
              : 'Your Pro trial has ended. You are now on the Starter plan — some features are restricted.'}
          </p>
          <Link href="/subscribe" className="rounded-lg bg-white text-red-700 px-3 py-1.5 text-xs font-bold hover:bg-red-50 shrink-0">
            {fr ? 'Restaurer Pro' : 'Restore Pro'}
          </Link>
        </div>
      </div>
    )
  }

  if (plan.status !== 'trial') return null

  const days = plan.trialDaysLeft
  let bg = 'bg-indigo-600'
  const text = 'text-white'
  if (days <= 3) bg = 'bg-red-500'
  else if (days <= 7) bg = 'bg-orange-500'

  return (
    <div className={`${bg} ${text}`}>
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center gap-3 text-sm">
        <Sparkles className="h-4 w-4 shrink-0" />
        <p className="flex-1 font-medium">
          {days > 0
            ? (fr
              ? `Essai Pro gratuit — ${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`
              : `Free Pro trial — ${days} day${days > 1 ? 's' : ''} remaining`)
            : (fr
              ? "Votre essai Pro se termine aujourd'hui. Ajoutez un moyen de paiement pour ne pas perdre l'accès."
              : 'Your Pro trial ends today. Add a payment method to keep access.')}
        </p>
        <Link href="/subscribe" className="rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-bold shrink-0">
          {fr ? 'Choisir un plan' : 'Choose a plan'}
        </Link>
        <button
          type="button"
          aria-label={fr ? 'Fermer' : 'Close'}
          onClick={() => setDismissed(true)}
          className="rounded p-1 hover:bg-white/20 shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
