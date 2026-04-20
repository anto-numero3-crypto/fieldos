'use client'

import Link from 'next/link'
import { ArrowRight, Play, Pause, Square, FileSpreadsheet, CheckCircle, Download, ChevronDown } from 'lucide-react'
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

export default function SuiviTempsPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: Play, label: fr ? 'Pointage mobile : début, pause, fin' : 'Mobile punch: start, pause, stop' },
    { icon: FileSpreadsheet, label: fr ? 'Feuilles de temps générées automatiquement' : 'Auto-generated timesheets' },
    { icon: CheckCircle, label: fr ? 'Approbation en un clic' : 'One-click approval' },
    { icon: Download, label: fr ? 'Export CSV pour la comptabilité' : 'CSV export for accounting' },
    { icon: Square, label: fr ? 'Calcul automatique des coûts de main-d\'oeuvre' : 'Automatic labor cost calculation' },
    { icon: Pause, label: fr ? 'Suivi des pauses et heures supplémentaires' : 'Break and overtime tracking' },
  ]

  const faqs = [
    {
      q: fr ? 'Comment mes employés pointent-ils leurs heures ?' : 'How do my employees clock their hours?',
      a: fr ? 'Depuis l\'application mobile, vos employés appuient sur Début, Pause ou Fin. Les heures sont enregistrées automatiquement.' : 'From the mobile app, your employees tap Start, Pause, or Stop. Hours are recorded automatically.',
    },
    {
      q: fr ? 'Puis-je exporter les feuilles de temps ?' : 'Can I export timesheets?',
      a: fr ? 'Oui. Exportez les feuilles de temps en format CSV compatible avec la plupart des logiciels de comptabilité et de paie.' : 'Yes. Export timesheets in CSV format compatible with most accounting and payroll software.',
    },
    {
      q: fr ? 'Les heures sont-elles liées aux interventions ?' : 'Are hours linked to jobs?',
      a: fr ? 'Oui. Chaque entrée de temps peut être associée à une intervention spécifique pour un suivi précis des coûts par projet.' : 'Yes. Each time entry can be linked to a specific job for precise per-project cost tracking.',
    },
    {
      q: fr ? 'Comment approuver les feuilles de temps ?' : 'How do I approve timesheets?',
      a: fr ? 'Consultez les heures de la semaine dans votre tableau de bord et approuvez d\'un seul clic. Les heures non approuvées sont clairement identifiées.' : 'Review the week\'s hours in your dashboard and approve with a single click. Unapproved hours are clearly flagged.',
    },
  ]

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Des feuilles de temps qui se remplissent toutes seules' : 'Timesheets that fill themselves out'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Vos employés pointent depuis leur téléphone. Les feuilles de temps se génèrent automatiquement. Vous approuvez et exportez en un clic.' : 'Your employees clock in from their phone. Timesheets generate automatically. You approve and export with one click.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Aperçu de la fonctionnalité' : 'Feature preview'}
            </div>
          </div>
        </div>
      </section>

      {/* Benefit 1 */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Un pointage simple comme un bouton' : 'Clocking in as simple as a button'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Début, Pause, Fin — c\'est tout ce que vos employés ont à faire. Le reste se calcule automatiquement : durée, pauses, heures supplémentaires.' : 'Start, Pause, Stop — that\'s all your employees need to do. The rest calculates automatically: duration, breaks, overtime.'}
              </p>
            </div>
            <div className="bg-gray-100 rounded-2xl h-48 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Aperçu de la fonctionnalité' : 'Feature preview'}
            </div>
          </div>
        </div>
      </section>

      {/* Benefit 2 */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-gray-100 rounded-2xl h-48 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Aperçu de la fonctionnalité' : 'Feature preview'}
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Exportez pour votre comptable en un clic' : 'Export for your accountant in one click'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Téléchargez un fichier CSV propre avec les heures approuvées, prêt à importer dans votre logiciel de paie ou à envoyer à votre comptable.' : 'Download a clean CSV file with approved hours, ready to import into your payroll software or send to your accountant.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Le suivi du temps sans la paperasse' : 'Time tracking without the paperwork'}
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

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            {fr ? 'Questions fréquentes' : 'Frequently asked questions'}
          </h2>
          <div className="divide-y divide-gray-200 rounded-2xl bg-white p-6 shadow-sm">
            {faqs.map((faq, i) => (
              <FaqItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-indigo-600 px-8 py-14 text-center">
            <h2 className="text-3xl font-bold text-white">
              {fr ? 'Prêt à simplifier vos feuilles de temps ?' : 'Ready to simplify your timesheets?'}
            </h2>
            <p className="mt-4 text-indigo-100 max-w-xl mx-auto">
              {fr ? 'Essayez Gestivio gratuitement pendant 14 jours. Aucune carte de crédit requise.' : 'Try Gestivio free for 14 days. No credit card required.'}
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
