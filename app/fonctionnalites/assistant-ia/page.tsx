'use client'

import Link from 'next/link'
import { ArrowRight, MessageSquare, Globe, Brain, Search, Sparkles, ChevronDown } from 'lucide-react'
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

export default function AssistantIAPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: Search, label: fr ? 'Questions sur vos revenus et dépenses' : 'Questions about your revenue and expenses' },
    { icon: MessageSquare, label: fr ? 'Historique client instantané' : 'Instant client history' },
    { icon: Sparkles, label: fr ? 'Aide à la rédaction de tâches et notes' : 'Help writing tasks and notes' },
    { icon: Globe, label: fr ? 'Fonctionne en français et en anglais' : 'Works in French and English' },
    { icon: Brain, label: fr ? 'Connaît le contexte de votre entreprise' : 'Knows your business context' },
    { icon: MessageSquare, label: fr ? 'Réponses en langage naturel' : 'Natural language answers' },
  ]

  const faqs = [
    {
      q: fr ? 'Quelles questions puis-je poser à l\'assistant ?' : 'What questions can I ask the assistant?',
      a: fr ? 'Tout ce qui concerne votre entreprise : revenus du mois, historique d\'un client, interventions à venir, factures impayées, et plus encore.' : 'Anything about your business: monthly revenue, client history, upcoming jobs, unpaid invoices, and more.',
    },
    {
      q: fr ? 'L\'assistant a-t-il accès à toutes mes données ?' : 'Does the assistant have access to all my data?',
      a: fr ? 'Oui. L\'assistant interroge vos données en temps réel pour vous donner des réponses précises et à jour. Vos données restent privées et sécurisées.' : 'Yes. The assistant queries your data in real time to give you accurate, up-to-date answers. Your data stays private and secure.',
    },
    {
      q: fr ? 'Fonctionne-t-il en français ?' : 'Does it work in French?',
      a: fr ? 'Oui. L\'assistant comprend et répond en français et en anglais, selon la langue dans laquelle vous posez votre question.' : 'Yes. The assistant understands and responds in French and English, based on the language you ask in.',
    },
    {
      q: fr ? 'L\'assistant peut-il effectuer des actions ?' : 'Can the assistant perform actions?',
      a: fr ? 'L\'assistant peut vous aider à créer des factures, rédiger des notes et préparer des tâches. Il vous guide étape par étape.' : 'The assistant can help you create invoices, draft notes, and prepare tasks. It guides you step by step.',
    },
    {
      q: fr ? 'Mes données sont-elles utilisées pour entraîner l\'IA ?' : 'Is my data used to train the AI?',
      a: fr ? 'Non. Vos données ne sont jamais utilisées pour entraîner des modèles. Elles restent strictement confidentielles et hébergées au Canada.' : 'No. Your data is never used to train models. It stays strictly confidential and hosted in Canada.',
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
                {fr ? 'Posez n\'importe quelle question sur votre entreprise' : 'Ask any question about your business'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Un assistant IA qui connaît vos clients, vos revenus et vos interventions. Posez une question en langage naturel et obtenez une réponse instantanée.' : 'An AI assistant that knows your clients, revenue, and jobs. Ask a question in natural language and get an instant answer.'}
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
                {fr ? 'Vos données transformées en réponses claires' : 'Your data turned into clear answers'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Demandez « Combien ai-je facturé ce mois-ci ? » ou « Quel est l\'historique du client Tremblay ? » et obtenez une réponse précise en quelques secondes.' : 'Ask "How much did I invoice this month?" or "What\'s the history for client Tremblay?" and get a precise answer in seconds.'}
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
                {fr ? 'Un assistant qui connaît votre contexte' : 'An assistant that knows your context'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'L\'assistant comprend votre type d\'entreprise, vos services et votre historique. Ses réponses sont pertinentes et adaptées à votre réalité.' : 'The assistant understands your business type, services, and history. Its answers are relevant and adapted to your reality.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Un assistant IA pensé pour les entrepreneurs' : 'An AI assistant built for entrepreneurs'}
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
              {fr ? 'Prêt à poser vos premières questions ?' : 'Ready to ask your first questions?'}
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
