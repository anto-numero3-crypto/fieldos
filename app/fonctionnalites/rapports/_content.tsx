'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, TrendingUp, Users, Star, Download, PieChart, ChevronDown } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import { MockupReports } from '@/components/mockups'
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
      {open && <p className="pb-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{answer}</p>}
    </div>
  )
}

export default function RapportsContent() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: BarChart3, label: fr ? 'Graphiques de revenus' : 'Revenue charts' },
    { icon: PieChart, label: fr ? 'Taux de completion des interventions' : 'Job completion rate' },
    { icon: Users, label: fr ? 'Meilleurs clients par volume' : 'Top clients by volume' },
    { icon: Star, label: fr ? 'Services les plus demandes' : 'Most requested services' },
    { icon: TrendingUp, label: fr ? 'Tendances mensuelles' : 'Monthly trends' },
    { icon: Download, label: fr ? 'Export CSV pour votre comptable' : 'CSV export for your accountant' },
  ]

  const steps = [
    { num: '1', title: fr ? 'Ouvrez les rapports' : 'Open reports', desc: fr ? 'Accedez a la section rapports depuis votre tableau de bord en un clic.' : 'Access the reports section from your dashboard in one click.' },
    { num: '2', title: fr ? 'Selectionnez la periode' : 'Select the period', desc: fr ? 'Choisissez la semaine, le mois, le trimestre ou une plage personnalisee.' : 'Choose the week, month, quarter, or a custom range.' },
    { num: '3', title: fr ? 'Exportez pour votre comptable' : 'Export for your accountant', desc: fr ? 'Telechargez un fichier CSV propre et pret a envoyer a votre comptable.' : 'Download a clean CSV file ready to send to your accountant.' },
  ]

  const faqs = [
    {
      q: fr ? 'Quels types de rapports sont disponibles ?' : 'What types of reports are available?',
      a: fr ? 'Gestivio offre des rapports de revenus, de completion d\'interventions, de performance par employe, de meilleurs clients et de tendances mensuelles.' : 'Gestivio offers revenue reports, job completion reports, per-employee performance, top clients, and monthly trends.',
    },
    {
      q: fr ? 'Puis-je exporter les rapports ?' : 'Can I export reports?',
      a: fr ? 'Oui. Chaque rapport peut etre exporte en CSV pour l\'importer dans Excel ou l\'envoyer a votre comptable.' : 'Yes. Every report can be exported as CSV to import into Excel or send to your accountant.',
    },
    {
      q: fr ? 'Les rapports se mettent-ils a jour en temps reel ?' : 'Do reports update in real time?',
      a: fr ? 'Oui. Les donnees sont mises a jour en continu. Chaque nouvelle intervention, facture ou paiement est reflete immediatement.' : 'Yes. Data is updated continuously. Every new job, invoice, or payment is reflected immediately.',
    },
    {
      q: fr ? 'Puis-je comparer deux periodes ?' : 'Can I compare two periods?',
      a: fr ? 'Oui. Selectionnez deux plages de dates pour comparer vos revenus, votre volume d\'interventions ou tout autre indicateur.' : 'Yes. Select two date ranges to compare your revenue, job volume, or any other metric.',
    },
  ]

  const related = [
    { href: '/fonctionnalites/facturation', label: fr ? 'Facturation' : 'Invoicing' },
    { href: '/fonctionnalites/tableau-de-bord', label: fr ? 'Tableau de bord' : 'Dashboard' },
    { href: '/fonctionnalites/clients', label: fr ? 'Clients' : 'Clients' },
  ]

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
                {fr ? 'Comprenez votre business en un coup d\'oeil' : 'Understand your business at a glance'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Fini de naviguer a l\'aveugle. Voyez vos revenus, vos tendances et vos meilleurs clients en quelques clics.' : 'No more flying blind. See your revenue, trends, and top clients in a few clicks.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"><div className="overflow-x-auto"><div className="min-w-[600px]"><MockupReports /></div></div></div>
          </div>
        </div>
      </section>

      {/* Avant / Apres */}
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Avant : aucune visibilite sur vos chiffres' : 'Before: no visibility on your numbers'}
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr ? 'Vous ne savez pas combien vous avez facture ce mois-ci, quels services rapportent le plus ou si votre business progresse.' : 'You don\'t know how much you billed this month, which services earn the most, or if your business is growing.'}
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Apres : des decisions eclairees' : 'After: informed decisions'}
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr ? 'Ouvrez Gestivio et voyez instantanement vos revenus, vos tendances et les secteurs a ameliorer. Decidez en connaissance de cause.' : 'Open Gestivio and instantly see your revenue, trends, and areas for improvement. Make informed decisions.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Steps */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {fr ? 'Comment ca fonctionne' : 'How it works'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-lg font-bold">{s.num}</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities grid */}
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {fr ? 'Des rapports qui comptent' : 'Reports that matter'}
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
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Identifiez vos meilleurs clients et services' : 'Identify your best clients and services'}
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr ? 'Voyez quels clients generent le plus de revenus et quels services sont les plus demandes. Concentrez vos efforts la ou ca compte.' : 'See which clients generate the most revenue and which services are most requested. Focus your efforts where it matters.'}
              </p>
            </div>
            <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"><div className="overflow-x-auto"><div className="min-w-[600px]"><MockupReports /></div></div></div>
          </div>
        </div>
      </section>

      {/* Detail section 2 */}
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 w-full rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"><div className="overflow-x-auto"><div className="min-w-[600px]"><MockupReports /></div></div></div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Un export CSV pret pour votre comptable' : 'A CSV export ready for your accountant'}
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr ? 'En un clic, generez un fichier CSV propre avec toutes vos transactions. Votre comptable vous remerciera.' : 'In one click, generate a clean CSV file with all your transactions. Your accountant will thank you.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">
            {fr ? 'Questions frequentes' : 'Frequently asked questions'}
          </h2>
          <div className="divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
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
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-indigo-600 px-8 py-14 text-center">
            <h2 className="text-3xl font-bold text-white">
              {fr ? 'Pret a comprendre vos chiffres ?' : 'Ready to understand your numbers?'}
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
