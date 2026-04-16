'use client'

import Link from 'next/link'
import { Lock, ArrowRight, Sparkles } from 'lucide-react'
import type { PlanName } from '@/lib/plan-limits'

interface Props {
  feature: string
  requiredPlan: PlanName
  description?: string
  variant?: 'banner' | 'overlay' | 'inline'
  cta?: string
}

// Consistent upgrade-required surface — banner (top of page), overlay
// (replaces page content), inline (small pill).
export default function UpgradePrompt({
  feature,
  requiredPlan,
  description,
  variant = 'banner',
  cta,
}: Props) {
  const planLabel = requiredPlan === 'pro' ? 'Pro' : 'Business'
  const btnLabel = cta || `Passer au forfait ${planLabel}`

  if (variant === 'inline') {
    return (
      <Link
        href="/settings?tab=billing"
        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 text-xs font-semibold hover:bg-indigo-100"
      >
        <Lock className="h-3 w-3" /> Débloquer avec {planLabel}
      </Link>
    )
  }

  if (variant === 'overlay') {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-10 text-center max-w-2xl mx-auto">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white">
          <Lock className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-2">Forfait {planLabel} requis</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{feature}</h2>
        {description && <p className="text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">{description}</p>}
        <Link
          href="/settings?tab=billing"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 shadow-md"
        >
          <Sparkles className="h-4 w-4" /> {btnLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  // banner
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
        <Lock className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{feature}</p>
        {description && <p className="text-xs text-gray-600 mt-0.5">{description}</p>}
      </div>
      <Link
        href="/settings?tab=billing"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
      >
        {btnLabel} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
