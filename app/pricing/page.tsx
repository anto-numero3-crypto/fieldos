'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, ArrowRight, Sparkles } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import { PLAN_PRICING } from '@/lib/plan-limits'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

type Cell = boolean | string | number
type Row = { label: string; starter: Cell; pro: Cell; business: Cell }
type Group = { title: string; rows: Row[] }

function CellView({ v }: { v: Cell }) {
  if (v === true) return <Check className="h-5 w-5 text-emerald-600 mx-auto" />
  if (v === false) return <X className="h-4 w-4 text-gray-300 mx-auto" />
  return <span className="text-sm font-medium text-gray-700">{v}</span>
}

export default function PricingPage() {
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly')
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const UNLIMITED = fr ? 'Illimité' : 'Unlimited'
  const MSG_PER_MONTH = fr ? '20 msg/mois' : '20 msg/month'

  const GROUPS: Group[] = [
    {
      title: fr ? 'Utilisateurs et limites' : 'Users and limits',
      rows: [
        { label: fr ? 'Utilisateurs'              : 'Users',              starter: '1',  pro: '5',       business: '15' },
        { label: fr ? 'Clients'                   : 'Customers',          starter: '50', pro: UNLIMITED, business: UNLIMITED },
        { label: fr ? 'Interventions par mois'    : 'Jobs per month',     starter: '30', pro: UNLIMITED, business: UNLIMITED },
        { label: fr ? 'Messages IA par mois'      : 'AI messages / month', starter: '20', pro: UNLIMITED, business: UNLIMITED },
      ],
    },
    {
      title: fr ? 'Fonctionnalités principales' : 'Core features',
      rows: [
        { label: fr ? 'Clients, interventions, calendrier' : 'Customers, jobs, calendar', starter: true, pro: true, business: true },
        { label: fr ? 'Facturation + devis'                : 'Invoicing + quotes',         starter: true, pro: true, business: true },
        { label: fr ? 'Paiements en ligne (Stripe)'        : 'Online payments (Stripe)',   starter: true, pro: true, business: true },
        { label: fr ? 'Courriels de confirmation'          : 'Confirmation emails',        starter: true, pro: true, business: true },
      ],
    },
    {
      title: fr ? 'IA' : 'AI',
      rows: [
        { label: fr ? 'Assistant IA'             : 'AI assistant',           starter: MSG_PER_MONTH, pro: UNLIMITED, business: UNLIMITED },
        { label: fr ? 'Recommandations IA'       : 'AI recommendations',     starter: false,         pro: true,      business: true },
        { label: fr ? 'Campagnes de réengagement': 'Re-engagement campaigns', starter: false,         pro: true,      business: true },
      ],
    },
    {
      title: fr ? "Gestion d'équipe" : 'Team management',
      rows: [
        { label: fr ? 'Invitation de techniciens'     : 'Invite technicians',   starter: false, pro: true, business: true },
        { label: fr ? 'Assignation des interventions' : 'Job assignment',       starter: false, pro: true, business: true },
        { label: fr ? 'Suivi du temps'                : 'Time tracking',        starter: false, pro: true, business: true },
      ],
    },
    {
      title: fr ? 'Portail de réservation' : 'Booking portal',
      rows: [
        { label: fr ? 'Portail en ligne 24/7'             : '24/7 online portal',              starter: false, pro: true,  business: true },
        { label: fr ? 'Personnalisation (logo, couleurs)' : 'Customization (logo, colors)',    starter: false, pro: true,  business: true },
        { label: fr ? 'Marque blanche (zéro Gestivio)'    : 'White-label (no Gestivio branding)', starter: false, pro: false, business: true },
      ],
    },
    {
      title: fr ? 'Automatisation' : 'Automation',
      rows: [
        { label: fr ? 'Rappels automatiques par courriel' : 'Automatic email reminders', starter: false, pro: true,  business: true },
        { label: fr ? "Règles d'automatisation avancées" : 'Advanced automation rules',  starter: false, pro: false, business: true },
        { label: fr ? 'Emplacements multiples'            : 'Multiple locations',         starter: false, pro: false, business: true },
      ],
    },
    {
      title: fr ? 'Rapports et exports' : 'Reports and exports',
      rows: [
        { label: fr ? 'Rapports et analyses'  : 'Reports and analytics',   starter: false, pro: true,  business: true },
        { label: fr ? 'Export CSV QuickBooks' : 'QuickBooks CSV export',   starter: false, pro: false, business: true },
      ],
    },
    {
      title: fr ? 'Communications' : 'Communications',
      rows: [
        { label: fr ? 'Courriels transactionnels'     : 'Transactional emails',     starter: true,  pro: true,  business: true },
        { label: fr ? 'Personnalisation des factures' : 'Invoice customization',    starter: false, pro: true,  business: true },
        { label: fr ? 'Notifications SMS'             : 'SMS notifications',        starter: false, pro: false, business: true },
      ],
    },
    {
      title: 'Support',
      rows: [
        { label: fr ? 'Support par courriel'     : 'Email support',         starter: true,  pro: true,  business: true },
        { label: fr ? 'Support prioritaire (24 h)' : 'Priority support (24h)', starter: false, pro: true,  business: true },
        { label: fr ? 'Support jour-même'        : 'Same-day support',      starter: false, pro: false, business: true },
      ],
    },
  ]

  const FAQS: Array<{ q: string; a: string }> = fr ? [
    { q: 'Puis-je changer de forfait à tout moment ?',              a: 'Oui. Vous pouvez monter ou descendre de forfait à tout moment depuis votre page de facturation. Les changements prennent effet immédiatement et sont facturés au prorata.' },
    { q: 'Que se passe-t-il si je rétrograde ?',                    a: "Aucune donnée n'est supprimée. Vous conservez l'accès à tous vos clients, interventions et factures — seules certaines fonctionnalités sont restreintes selon votre nouveau forfait." },
    { q: 'Y a-t-il un contrat ou un engagement ?',                  a: 'Non. Gestivio est sans engagement. Vous pouvez annuler à tout moment depuis votre compte.' },
    { q: 'Offrez-vous une remise pour la facturation annuelle ?',   a: 'Oui. La facturation annuelle vous fait économiser 20 % par rapport au mensuel sur tous les forfaits.' },
    { q: 'Quels moyens de paiement acceptez-vous ?',                a: 'Toutes les principales cartes de crédit via Stripe (Visa, Mastercard, American Express).' },
    { q: 'Y a-t-il un essai gratuit ?',                              a: 'Oui. Chaque nouvelle inscription inclut un essai Pro de 14 jours — aucune carte de crédit requise.' },
    { q: 'Mes données sont-elles hébergées au Canada ?',            a: 'Oui. Toutes les données sont hébergées au Canada, conformément à la LPRPDE et à la Loi 25 du Québec.' },
  ] : [
    { q: 'Can I change plans at any time?',                   a: 'Yes. You can upgrade or downgrade anytime from your billing page. Changes take effect immediately and are prorated.' },
    { q: 'What happens if I downgrade?',                       a: "No data is deleted. You keep access to all your customers, jobs, and invoices — only some features are restricted by your new plan." },
    { q: 'Is there a contract or commitment?',                 a: 'No. Gestivio is commitment-free. You can cancel anytime from your account.' },
    { q: 'Do you offer a discount for annual billing?',        a: 'Yes. Annual billing saves you 20% versus monthly on every plan.' },
    { q: 'What payment methods do you accept?',                a: 'All major credit cards via Stripe (Visa, Mastercard, American Express).' },
    { q: 'Is there a free trial?',                              a: 'Yes. Every new signup includes a 14-day Pro trial — no credit card required.' },
    { q: 'Is my data hosted in Canada?',                       a: 'Yes. All data is hosted in Canada, compliant with PIPEDA and Québec Law 25.' },
  ]

  const price = (m: number, a: number) => cycle === 'annual' ? a : m

  return (
    <MarketingShell>
      <div className="relative">
        <div className="absolute top-4 right-4 z-10"><LanguageToggle /></div>
      </div>
      {/* Hero + toggle */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">
            {fr ? 'Forfaits' : 'Plans'}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-3">
            {fr ? 'Des forfaits simples et transparents' : 'Simple, transparent pricing'}
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            {fr
              ? "14 jours d'essai gratuits, aucune carte de crédit. Annulable en tout temps."
              : '14-day free trial, no credit card. Cancel anytime.'}
          </p>

          <div className="mt-8 inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setCycle('monthly')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${cycle === 'monthly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >{fr ? 'Mensuel' : 'Monthly'}</button>
            <button
              onClick={() => setCycle('annual')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${cycle === 'annual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {fr ? 'Annuel' : 'Annual'}{' '}
              <span className={`rounded-full px-2 py-0.5 text-xs ${cycle === 'annual' ? 'bg-white/20' : 'bg-emerald-50 text-emerald-700'}`}>
                {fr ? 'Économisez 20%' : 'Save 20%'}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {(['starter', 'pro', 'business'] as const).map((p) => {
            const info = PLAN_PRICING[p]
            const isHighlighted = p === 'pro'
            return (
              <div
                key={p}
                className={`relative flex flex-col rounded-2xl p-7 ${isHighlighted ? 'bg-indigo-600 shadow-2xl shadow-indigo-200 ring-1 ring-indigo-500 text-white' : 'bg-white border border-gray-200 shadow-sm'}`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                      <Sparkles className="h-3 w-3" /> {fr ? 'Plus populaire' : 'Most popular'}
                    </span>
                  </div>
                )}
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isHighlighted ? 'text-indigo-200' : 'text-gray-500'}`}>{info.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-sm ${isHighlighted ? 'text-indigo-200' : 'text-gray-400'}`}>$</span>
                  <span className="text-4xl font-bold">{price(info.monthly, info.annual)}</span>
                  <span className={`text-sm ${isHighlighted ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {fr ? '/mois' : '/month'}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isHighlighted ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {cycle === 'annual'
                    ? (fr ? `Facturé ${info.annual * 12} $/an` : `Billed $${info.annual * 12}/year`)
                    : (fr ? 'Facturation mensuelle' : 'Billed monthly')}
                </p>
                <p className={`text-sm mt-3 ${isHighlighted ? 'text-indigo-100' : 'text-gray-600'}`}>{info.tagline}</p>
                <Link
                  href={`/signup?plan=${p}&cycle=${cycle}`}
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${isHighlighted ? 'bg-white text-indigo-700 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {fr ? 'Essai gratuit 14 jours' : 'Start 14-day free trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          {fr ? 'Comparaison complète' : 'Full comparison'}
        </h2>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="sticky top-0 z-10 bg-white border-b-2 border-gray-200">
                <tr>
                  <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {fr ? 'Fonctionnalité' : 'Feature'}
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Starter</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50/30 text-center">Pro</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Business</th>
                </tr>
              </thead>
              <tbody>
                {GROUPS.flatMap((group) => [
                  <tr key={`group-${group.title}`} className="bg-gray-50/70 border-t border-gray-100">
                    <td colSpan={4} className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-gray-700">{group.title}</td>
                  </tr>,
                  ...group.rows.map((r) => (
                    <tr key={`${group.title}-${r.label}`} className="border-t border-gray-50 hover:bg-gray-50/40">
                      <td className="px-5 py-3 text-sm text-gray-700">{r.label}</td>
                      <td className="px-5 py-3 text-center"><CellView v={r.starter} /></td>
                      <td className="px-5 py-3 text-center bg-indigo-50/20"><CellView v={r.pro} /></td>
                      <td className="px-5 py-3 text-center"><CellView v={r.business} /></td>
                    </tr>
                  )),
                ])}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center text-sm text-gray-600">
          {fr ? (
            <>Tous les forfaits incluent : <strong>essai gratuit 14 jours</strong> · aucune carte de crédit requise · annulable en tout temps · <strong>SSL</strong> · données hébergées au <strong>Canada</strong> · garantie satisfait ou remboursé de 30 jours.</>
          ) : (
            <>All plans include: <strong>14-day free trial</strong> · no credit card required · cancel anytime · <strong>SSL</strong> · data hosted in <strong>Canada</strong> · 30-day money-back guarantee.</>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          {fr ? 'Questions fréquentes' : 'Frequently asked questions'}
        </h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details key={i} className="group rounded-2xl border border-gray-100 bg-white p-5">
              <summary className="cursor-pointer font-semibold text-gray-900 flex items-start justify-between gap-3">
                <span>{f.q}</span>
                <span className="text-indigo-600 text-lg leading-none group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </MarketingShell>
  )
}
