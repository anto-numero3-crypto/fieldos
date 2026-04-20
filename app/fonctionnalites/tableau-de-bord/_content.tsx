'use client'

import Link from 'next/link'
import { ArrowRight, LayoutDashboard, Calendar, Users, MapPin, Clock, FileText, RefreshCw, Moon, ChevronDown } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import { useLanguage } from '@/lib/LanguageContext'
import { useState } from 'react'

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left text-base font-medium text-gray-900">
        {question}
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-gray-600 leading-relaxed">{answer}</p>}
    </div>
  )
}

export default function TableauDeBordContent() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: LayoutDashboard, label: fr ? 'KPIs en un coup d\'oeil' : 'KPIs at a glance' },
    { icon: Calendar, label: fr ? 'Interventions du jour' : 'Today\'s jobs' },
    { icon: Users, label: fr ? 'Activite de l\'equipe' : 'Team activity' },
    { icon: MapPin, label: fr ? 'Vue carte' : 'Map view' },
    { icon: Clock, label: fr ? 'Reservations en attente' : 'Pending bookings' },
    { icon: FileText, label: fr ? 'Factures en retard' : 'Overdue invoices' },
    { icon: RefreshCw, label: fr ? 'Mises a jour en temps reel' : 'Live updates' },
    { icon: Moon, label: fr ? 'Mode sombre' : 'Dark mode' },
  ]

  const steps = [
    { num: '1', title: fr ? 'Ouvrez Gestivio' : 'Open Gestivio', desc: fr ? 'Le tableau de bord est la premiere chose que vous voyez en ouvrant l\'application.' : 'The dashboard is the first thing you see when opening the app.' },
    { num: '2', title: fr ? 'Voyez tout' : 'See everything', desc: fr ? 'KPIs, interventions du jour, activite de l\'equipe et factures en attente — tout en un seul ecran.' : 'KPIs, today\'s jobs, team activity, and pending invoices — all on one screen.' },
    { num: '3', title: fr ? 'Agissez immediatement' : 'Take action immediately', desc: fr ? 'Cliquez sur n\'importe quel element pour agir : confirmer, assigner, relancer ou facturer.' : 'Click on any item to take action: confirm, assign, follow up, or invoice.' },
  ]

  const faqs = [
    {
      q: fr ? 'Quelles informations sont affichees sur le tableau de bord ?' : 'What information is displayed on the dashboard?',
      a: fr ? 'Vos KPIs cles (revenus, interventions completees, paiements recus), les interventions du jour, l\'activite de votre equipe, les reservations en attente et les factures en retard.' : 'Your key KPIs (revenue, completed jobs, received payments), today\'s jobs, your team\'s activity, pending bookings, and overdue invoices.',
    },
    {
      q: fr ? 'Le tableau de bord se met-il a jour en temps reel ?' : 'Does the dashboard update in real time?',
      a: fr ? 'Oui. Toutes les donnees sont mises a jour en continu sans avoir a rafraichir la page.' : 'Yes. All data is updated continuously without having to refresh the page.',
    },
    {
      q: fr ? 'Y a-t-il un mode sombre ?' : 'Is there a dark mode?',
      a: fr ? 'Oui. Activez le mode sombre depuis vos parametres pour une interface plus reposante en soiree ou en conditions de faible luminosite.' : 'Yes. Enable dark mode from your settings for a more comfortable interface in the evening or low-light conditions.',
    },
    {
      q: fr ? 'Puis-je personnaliser ce qui est affiche ?' : 'Can I customize what is displayed?',
      a: fr ? 'Le tableau de bord affiche les elements les plus importants pour votre activite. Les widgets sont organises par priorite pour une prise de decision rapide.' : 'The dashboard displays the most important elements for your activity. Widgets are organized by priority for quick decision-making.',
    },
  ]

  const related = [
    { href: '/fonctionnalites/rapports', label: fr ? 'Rapports' : 'Reports' },
    { href: '/fonctionnalites/interventions', label: fr ? 'Interventions' : 'Jobs' },
    { href: '/fonctionnalites/equipe', label: fr ? 'Equipe' : 'Team' },
  ]

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Votre business en un coup d\'oeil des que vous ouvrez l\'app' : 'Your business at a glance as soon as you open the app'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Fini de verifier plusieurs endroits. Tout ce qui compte est sur un seul ecran : KPIs, interventions, equipe et paiements.' : 'No more checking multiple places. Everything that matters is on one screen: KPIs, jobs, team, and payments.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Apercu de la fonctionnalite' : 'Feature preview'}
            </div>
          </div>
        </div>
      </section>

      {/* Avant / Apres */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Avant : verifier plusieurs endroits' : 'Before: checking multiple places'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Votre calendrier est quelque part, vos factures ailleurs, l\'activite de votre equipe nulle part. Vous perdez du temps a assembler les informations.' : 'Your calendar is somewhere, your invoices elsewhere, your team\'s activity nowhere. You waste time piecing information together.'}
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Apres : tout sur un seul ecran' : 'After: everything on one screen'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Ouvrez Gestivio et voyez instantanement vos KPIs, les taches du jour, les factures en retard et l\'activite de votre equipe. Agissez sans chercher.' : 'Open Gestivio and instantly see your KPIs, today\'s tasks, overdue invoices, and team activity. Act without searching.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Steps */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Comment ca fonctionne' : 'How it works'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-lg font-bold">{s.num}</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Tout ce que vous devez savoir, au meme endroit' : 'Everything you need to know, in one place'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <f.icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-gray-700">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detail section 1 */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Des KPIs qui comptent' : 'KPIs that matter'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Revenus du mois, interventions completees, paiements en attente — les chiffres les plus importants sont affiches en grand, clairs et a jour.' : 'Monthly revenue, completed jobs, pending payments — the most important numbers are displayed large, clear, and up to date.'}
              </p>
            </div>
            <div className="bg-gray-100 rounded-2xl h-48 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Apercu de la fonctionnalite' : 'Feature preview'}
            </div>
          </div>
        </div>
      </section>

      {/* Detail section 2 */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-gray-100 rounded-2xl h-48 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Apercu de la fonctionnalite' : 'Feature preview'}
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Agissez en un clic depuis le tableau de bord' : 'Act in one click from the dashboard'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Confirmez une reservation, relancez une facture en retard ou assignez un technicien — tout depuis le tableau de bord, sans naviguer ailleurs.' : 'Confirm a booking, follow up on an overdue invoice, or assign a technician — all from the dashboard, without navigating elsewhere.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            {fr ? 'Questions frequentes' : 'Frequently asked questions'}
          </h2>
          <div className="divide-y divide-gray-200 rounded-2xl bg-white p-6 shadow-sm">
            {faqs.map((faq, i) => (
              <FaqItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Related features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            {fr ? 'Fonctionnalites connexes' : 'Related features'}
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {related.map((r) => (
              <Link key={r.href} href={r.href} className="rounded-lg border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-indigo-600 px-8 py-14 text-center">
            <h2 className="text-3xl font-bold text-white">
              {fr ? 'Pret a tout voir d\'un coup d\'oeil ?' : 'Ready to see everything at a glance?'}
            </h2>
            <p className="mt-4 text-indigo-100 max-w-xl mx-auto">
              {fr ? 'Essayez Gestivio gratuitement pendant 14 jours. Aucune carte de credit requise.' : 'Try Gestivio free for 14 days. No credit card required.'}
            </p>
            <Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50">
              {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
