'use client'

import Link from 'next/link'
import { ArrowRight, FileText, RefreshCw, PenTool, Receipt, Bell, ChevronDown } from 'lucide-react'
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

export default function ContratsPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: FileText, label: fr ? 'Contrats saisonniers et annuels' : 'Seasonal and annual contracts' },
    { icon: RefreshCw, label: fr ? 'Génération automatique des interventions' : 'Auto-generate jobs from contracts' },
    { icon: PenTool, label: fr ? 'Signature électronique intégrée' : 'Built-in e-signature' },
    { icon: Receipt, label: fr ? 'Facturation automatique récurrente' : 'Automatic recurring billing' },
    { icon: Bell, label: fr ? 'Rappels de renouvellement' : 'Renewal reminders' },
    { icon: FileText, label: fr ? 'Historique complet par client' : 'Complete history per client' },
  ]

  const faqs = [
    {
      q: fr ? 'Puis-je créer des contrats saisonniers ?' : 'Can I create seasonal contracts?',
      a: fr ? 'Oui. Définissez la période du contrat (ex. avril à novembre pour l\'entretien de pelouse) et les interventions seront planifiées automatiquement.' : 'Yes. Define the contract period (e.g., April to November for lawn care) and jobs will be scheduled automatically.',
    },
    {
      q: fr ? 'La signature électronique est-elle légale au Québec ?' : 'Is e-signature legal in Quebec?',
      a: fr ? 'Oui. La signature électronique est reconnue par la Loi concernant le cadre juridique des technologies de l\'information du Québec.' : 'Yes. E-signature is recognized under Quebec\'s Act to establish a legal framework for information technology.',
    },
    {
      q: fr ? 'Comment fonctionne la facturation automatique ?' : 'How does automatic billing work?',
      a: fr ? 'Vous définissez la fréquence (mensuelle, trimestrielle, etc.) et Gestivio génère et envoie les factures automatiquement selon le calendrier du contrat.' : 'You define the frequency (monthly, quarterly, etc.) and Gestivio generates and sends invoices automatically based on the contract schedule.',
    },
    {
      q: fr ? 'Suis-je averti avant l\'expiration d\'un contrat ?' : 'Am I notified before a contract expires?',
      a: fr ? 'Oui. Vous recevez un rappel avant l\'échéance pour renouveler ou mettre à jour le contrat avec votre client.' : 'Yes. You receive a reminder before the deadline to renew or update the contract with your client.',
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
                {fr ? 'Gérez vos contrats saisonniers sans effort' : 'Manage your seasonal contracts effortlessly'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Créez des contrats récurrents, planifiez les interventions automatiquement et facturez sans y penser.' : 'Create recurring contracts, schedule jobs automatically and invoice without thinking about it.'}
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
                {fr ? 'Des interventions qui se planifient toutes seules' : 'Jobs that schedule themselves'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'À partir d\'un contrat, Gestivio génère automatiquement les interventions récurrentes selon la fréquence définie. Plus besoin de les recréer manuellement chaque semaine.' : 'From a contract, Gestivio automatically generates recurring jobs based on the defined frequency. No need to manually recreate them every week.'}
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
                {fr ? 'Signature et facturation automatisées' : 'Automated signing and billing'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Envoyez le contrat pour signature électronique et configurez la facturation récurrente. Tout se fait automatiquement selon vos termes.' : 'Send the contract for e-signature and set up recurring billing. Everything happens automatically according to your terms.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'La gestion de contrats simplifiée' : 'Simplified contract management'}
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
              {fr ? 'Prêt à automatiser vos contrats ?' : 'Ready to automate your contracts?'}
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
