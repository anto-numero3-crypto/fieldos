'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import { CheckCircle, Zap, Shield, Users, CreditCard, ArrowRight, Star } from 'lucide-react'

interface Plan {
  id: string; name: string; price: number; annualPrice: number; description: string
  color: string; badge?: string; features: string[]
  limits: { users: string; customers: string; jobs: string }
}

const PLANS: Plan[] = [
  {
    id: 'starter', name: 'Starter', price: 39, annualPrice: 31, description: 'Perfect for solo operators just getting started.',
    color: 'border-gray-200', badge: undefined,
    limits: { users: '1 user', customers: '50 customers', jobs: '100 jobs/month' },
    features: ['50 customers', '1 user', '100 jobs/month', 'Unlimited invoices', 'Basic AI assistant', 'Email support', 'Schedule view'],
  },
  {
    id: 'growth', name: 'Growth', price: 99, annualPrice: 79, description: 'For growing teams who need more power.',
    color: 'border-indigo-500 ring-2 ring-indigo-200', badge: 'Most Popular',
    limits: { users: '5 users', customers: 'Unlimited', jobs: 'Unlimited' },
    features: ['Unlimited customers', '5 users', 'Unlimited jobs & invoices', 'Advanced AI assistant', 'Quotes & estimates', 'Team management', 'Priority support', 'Reports & analytics', 'Custom branding'],
  },
  {
    id: 'pro', name: 'Pro', price: 199, annualPrice: 159, description: 'For established businesses with full needs.',
    color: 'border-gray-200', badge: undefined,
    limits: { users: '15 users', customers: 'Unlimited', jobs: 'Unlimited' },
    features: ['Everything in Growth', '15 users', 'GPS tracking', 'Route optimization', 'Stripe Connect payments', 'QuickBooks integration', 'Recurring jobs', 'API access', 'Dedicated support'],
  },
  {
    id: 'scale', name: 'Scale', price: 399, annualPrice: 319, description: 'For large operations that need everything.',
    color: 'border-gray-200', badge: undefined,
    limits: { users: 'Unlimited', customers: 'Unlimited', jobs: 'Unlimited' },
    features: ['Everything in Pro', 'Unlimited users', 'White-label option', 'Custom integrations', 'SSO / SAML', 'SLA guarantee', 'Audit logs', 'Dedicated account manager', 'Custom onboarding'],
  },
]

const fmt = (n: number) => `$${n}`

export default function BillingPage() {
  const [user, setUser]           = useState<{ id: string; email?: string } | null>(null)
  const [billing, setBilling]     = useState<'monthly' | 'annual'>('monthly')
  const [currentPlan]             = useState('starter')
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
    }
    init()
    // Check for Stripe redirect
    const params = new URLSearchParams(window.location.search)
    if (params.get('success')) setSuccessMsg('Your subscription has been activated!')
    if (params.get('canceled')) setSuccessMsg(null)
  }, [])

  const startCheckout = async (planId: string) => {
    if (!user) return
    setCheckoutLoading(planId)
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId: user.id, billingCycle: billing }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Checkout failed. Make sure STRIPE_SECRET_KEY and price IDs are configured.')
    } catch {
      alert('Checkout failed. Please try again.')
    }
    setCheckoutLoading(null)
  }

  const price = (plan: Plan) => billing === 'annual' ? plan.annualPrice : plan.price

  return (
    <AppLayout title="Billing">
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {successMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
          </div>
        )}

        {/* Current plan banner */}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-5 mb-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">You&apos;re on the <span className="text-indigo-600">Starter</span> plan</p>
              <p className="text-xs text-gray-500">14-day free trial · Ends April 24, 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-2">
              <p className="text-sm font-semibold text-gray-900">$39<span className="text-gray-400 font-normal">/month</span></p>
              <p className="text-xs text-gray-400">No payment on file</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-all shadow-sm">
              <CreditCard className="h-4 w-4" /> Add payment method
            </button>
          </div>
        </div>

        {/* Usage */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Current Usage</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Customers', used: 3, limit: 50, color: 'bg-blue-500' },
              { label: 'Jobs this month', used: 7, limit: 100, color: 'bg-violet-500' },
              { label: 'Team members', used: 1, limit: 1, color: 'bg-amber-500' },
            ].map((u) => {
              const pct = (u.used / u.limit) * 100
              return (
                <div key={u.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-gray-600">{u.label}</p>
                    <p className="text-xs text-gray-500">{u.used} / {u.limit}</p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${u.color} ${pct >= 90 ? 'animate-pulse' : ''}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  {pct >= 80 && <p className="text-xs text-amber-600 mt-0.5">⚠ Approaching limit</p>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Plan toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={['rounded-lg px-5 py-2 text-sm font-semibold transition-all', billing === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'].join(' ')}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={['rounded-lg px-5 py-2 text-sm font-semibold transition-all', billing === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'].join(' ')}
            >
              Annual
              <span className="ml-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs font-bold text-white">-20%</span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 bg-white p-5 shadow-sm flex flex-col ${plan.color} ${isCurrent ? 'border-indigo-500' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm flex items-center gap-1">
                    <Star className="h-3 w-3" />{plan.badge}
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-4 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">Current</div>
                )}

                <div className="mb-4">
                  <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">{fmt(price(plan))}</span>
                    <span className="text-sm text-gray-400">/mo</span>
                  </div>
                  {billing === 'annual' && (
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">Save ${(plan.price - plan.annualPrice) * 12}/year</p>
                  )}
                </div>

                <div className="mb-4 space-y-1">
                  {[plan.limits.users, plan.limits.customers, plan.limits.jobs].map((l) => (
                    <p key={l} className="text-xs font-semibold text-gray-700 flex items-center gap-1.5"><Zap className="h-3 w-3 text-indigo-500 shrink-0" />{l}</p>
                  ))}
                </div>

                <ul className="space-y-1.5 mb-5 flex-1">
                  {plan.features.slice(3).map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrent && startCheckout(plan.id)}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'border border-gray-200 bg-gray-50 text-gray-400 cursor-default'
                      : plan.badge
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={isCurrent || checkoutLoading === plan.id}
                >
                  {checkoutLoading === plan.id
                    ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> Processing…</>
                    : isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`
                  }
                </button>
              </div>
            )
          })}
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Shield, title: 'Secure Payments', desc: 'All payments processed securely via Stripe. Card data never touches our servers.' },
            { icon: CheckCircle, title: 'Cancel Anytime', desc: 'No long-term contracts. Cancel or downgrade at any time without penalty.' },
            { icon: Users, title: 'Priority Support', desc: 'Growth and above plans include priority support with guaranteed response times.' },
          ].map((t) => (
            <div key={t.title} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <t.icon className="h-5 w-5 text-indigo-500 mb-2" />
              <p className="text-sm font-semibold text-gray-900">{t.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
