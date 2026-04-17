'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, ArrowRight, Sparkles } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import { PLAN_PRICING } from '@/lib/plan-limits'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

type Cell = boolean | string | number
type Row = { label: string; demarrage: Cell; pro: Cell; croissance: Cell }
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
  const MSG_PER_MONTH = fr ? '30 msg/mois' : '30 msg/month'

  const GROUPS: Group[] = [
    {
      title: fr ? 'Utilisateurs et limites' : 'Users and limits',
      rows: [
        { label: fr ? 'Utilisateurs'              : 'Users',              demarrage: '1',  pro: '5',       croissance: '15' },
        { label: fr ? 'Clients'                   : 'Customers',          demarrage: '50', pro: UNLIMITED, croissance: UNLIMITED },
        { label: fr ? 'Interventions par mois'    : 'Jobs per month',     demarrage: '25', pro: UNLIMITED, croissance: UNLIMITED },
        { label: fr ? 'Messages IA par mois'      : 'AI messages / month', demarrage: '30', pro: UNLIMITED, croissance: UNLIMITED },
      ],
    },
    {
      title: fr ? 'Fonctionnalités principales' : 'Core features',
      rows: [
        { label: fr ? 'Clients, interventions, calendrier' : 'Customers, jobs, calendar', demarrage: true, pro: true, croissance: true },
        { label: fr ? 'Facturation illimitée + devis'      : 'Unlimited invoicing + quotes', demarrage: true, pro: true, croissance: true },
        { label: fr ? 'Paiements en ligne (Stripe)'        : 'Online payments (Stripe)',   demarrage: true, pro: true, croissance: true },
        { label: fr ? 'Google Calendar'                    : 'Google Calendar sync',       demarrage: true, pro: true, croissance: true },
        { label: fr ? 'Portail de réservation en ligne'    : 'Online booking portal',      demarrage: true, pro: true, croissance: true },
        { label: fr ? 'Interventions sur plusieurs jours'  : 'Multi-day jobs',             demarrage: false, pro: true, croissance: true },
        { label: fr ? 'Export CSV'                         : 'CSV export',                 demarrage: false, pro: true, croissance: true },
        { label: fr ? 'Rapports complets'                  : 'Full reports',               demarrage: false, pro: true, croissance: true },
        { label: fr ? 'Notifications de complétion'        : 'Completion notifications',   demarrage: false, pro: true, croissance: true },
      ],
    },
    {
      title: fr ? 'Image de marque' : 'Branding',
      rows: [
        { label: fr ? 'Mention « Propulsé par Gestivio » sur les factures' : '"Powered by Gestivio" on invoices', demarrage: true, pro: false, croissance: false },
        { label: fr ? 'Marque personnelle complète'      : 'Full personal branding',         demarrage: false, pro: true, croissance: true },
      ],
    },
    {
      title: fr ? 'Support' : 'Support',
      rows: [
        { label: fr ? 'Support par courriel (3 jours ouvrables)'   : 'Email support (3 business days)',  demarrage: true,  pro: false, croissance: false },
        { label: fr ? 'Support prioritaire (2 jours ouvrables)'    : 'Priority support (2 business days)', demarrage: false, pro: true,  croissance: false },
        { label: fr ? 'Support prioritaire (1 jour ouvrable)'      : 'Priority support (1 business day)',  demarrage: false, pro: false, croissance: true },
        { label: fr ? 'Onboarding vidéo 1 h'                       : '1h video onboarding',               demarrage: false, pro: false, croissance: true },
        { label: fr ? 'Accès anticipé aux nouvelles fonctions'     : 'Early access to new features',      demarrage: false, pro: false, croissance: true },
      ],
    },
  ]

  const FAQS: Array<{ q: string; a: string }> = fr ? [
    { q: 'Puis-je changer de forfait à tout moment ?',              a: 'Oui. Vous pouvez monter ou descendre de forfait à tout moment depuis votre page de facturation. Les changements prennent effet immédiatement et sont facturés au prorata.' },
    { q: 'Que se passe-t-il si je rétrograde ?',                    a: "Aucune donnée n'est supprimée. Vous conservez l'accès à tous vos clients, interventions et factures — seules certaines fonctionnalités sont restreintes selon votre nouveau forfait." },
    { q: 'Y a-t-il un contrat ou un engagement ?',                  a: 'Non. Gestivio est sans engagement. Vous pouvez annuler à tout moment depuis votre compte.' },
    { q: 'Offrez-vous une remise pour la facturation annuelle ?',   a: 'Oui. La facturation annuelle vous fait économiser 10 % par rapport au mensuel sur tous les forfaits.' },
    { q: 'Quels moyens de paiement acceptez-vous ?',                a: 'Toutes les principales cartes de crédit via Stripe (Visa, Mastercard, American Express).' },
    { q: 'Y a-t-il un essai gratuit ?',                              a: 'Oui. Chaque nouvelle inscription inclut un essai Pro de 14 jours — aucune carte de crédit requise.' },
    { q: 'Mes données sont-elles hébergées au Canada ?',            a: 'Oui. Toutes les données sont hébergées au Canada, conformément à la LPRPDE et à la Loi 25 du Québec.' },
  ] : [
    { q: 'Can I change plans at any time?',                   a: 'Yes. You can upgrade or downgrade anytime from your billing page. Changes take effect immediately and are prorated.' },
    { q: 'What happens if I downgrade?',                       a: "No data is deleted. You keep access to all your customers, jobs, and invoices — only some features are restricted by your new plan." },
    { q: 'Is there a contract or commitment?',                 a: 'No. Gestivio is commitment-free. You can cancel anytime from your account.' },
    { q: 'Do you offer a discount for annual billing?',        a: 'Yes. Annual billing saves you 10% versus monthly on every plan.' },
    { q: 'What payment methods do you accept?',                a: 'All major credit cards via Stripe (Visa, Mastercard, American Express).' },
    { q: 'Is there a free trial?',                              a: 'Yes. Every new signup includes a 14-day Pro trial — no credit card required.' },
    { q: 'Is my data hosted in Canada?',                       a: 'Yes. All data is hosted in Canada, compliant with PIPEDA and Québec Law 25.' },
  ]

  void (UNLIMITED + MSG_PER_MONTH) // referenced via GROUPS only

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
                {fr ? 'Économisez 10%' : 'Save 10%'}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {(['demarrage', 'pro', 'croissance'] as const).map((p) => {
            const info = PLAN_PRICING[p]
            const isHighlighted = p === 'pro'
            const price = cycle === 'annual' ? info.annual : info.monthly
            const label = fr ? info.label : info.labelEn
            const tagline = fr ? info.tagline : info.taglineEn
            return (
              <div
                key={p}
                className={`relative flex flex-col rounded-2xl p-7 ${isHighlighted ? 'bg-indigo-600 shadow-2xl shadow-indigo-200 ring-1 ring-indigo-500 text-white scale-[1.02]' : 'bg-white border border-gray-200 shadow-sm'}`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                      <Sparkles className="h-3 w-3" /> {fr ? 'Plus populaire' : 'Most popular'}
                    </span>
                  </div>
                )}
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isHighlighted ? 'text-indigo-200' : 'text-gray-500'}`}>{label}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-sm ${isHighlighted ? 'text-indigo-200' : 'text-gray-400'}`}>$</span>
                  <span className="text-4xl font-bold">{price}</span>
                  <span className={`text-sm ${isHighlighted ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {fr ? '/mois' : '/month'}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isHighlighted ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {cycle === 'annual'
                    ? (fr ? `Facturé ${info.annualTotal} $/an` : `Billed $${info.annualTotal}/year`)
                    : (fr ? 'Facturation mensuelle' : 'Billed monthly')}
                </p>
                <p className={`text-sm mt-3 ${isHighlighted ? 'text-indigo-100' : 'text-gray-600'}`}>{tagline}</p>
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
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">{fr ? 'Démarrage' : 'Starter'}</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50/30 text-center">Pro</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">{fr ? 'Croissance' : 'Growth'}</th>
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
                      <td className="px-5 py-3 text-center"><CellView v={r.demarrage} /></td>
                      <td className="px-5 py-3 text-center bg-indigo-50/20"><CellView v={r.pro} /></td>
                      <td className="px-5 py-3 text-center"><CellView v={r.croissance} /></td>
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

      {/* Industry links */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          {fr ? 'Gestivio pour votre industrie' : 'Gestivio for your industry'}
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: fr ? 'Plombiers' : 'Plumbers', href: '/logiciel-plombier' },
            { label: fr ? 'Électriciens' : 'Electricians', href: '/logiciel-electricien' },
            { label: 'CVC / HVAC', href: '/logiciel-cvc' },
            { label: fr ? 'Nettoyage' : 'Cleaning', href: '/logiciel-nettoyage' },
            { label: fr ? 'Paysagistes' : 'Landscapers', href: '/logiciel-paysagiste' },
            { label: fr ? 'Rénovation' : 'Renovation', href: '/logiciel-renovateur' },
          ].map((ind) => (
            <Link key={ind.href} href={ind.href} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
              {ind.label} <ArrowRight className="h-3.5 w-3.5 text-indigo-600" />
            </Link>
          ))}
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
