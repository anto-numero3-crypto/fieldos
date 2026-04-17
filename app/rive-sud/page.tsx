import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { buildMetadata } from '@/lib/seo'
import MarketingShell from '@/components/MarketingShell'
import JsonLd from '@/components/JsonLd'
import { localBusinessSchema, breadcrumbSchema, faqSchema } from '@/lib/schema'
import NewsletterSignup from '@/components/NewsletterSignup'

export const metadata: Metadata = buildMetadata({
  title: 'Logiciel de gestion pour entrepreneurs sur la Rive-Sud | Gestivio',
  description: "Gestivio pour les entrepreneurs en services sur la Rive-Sud de Montréal. Brossard, Saint-Lambert, La Prairie. Facturation TPS/TVQ, portail IA. Essai gratuit.",
  path: '/rive-sud',
  locale: 'fr',
  keywords: ['logiciel gestion Rive-Sud', 'entrepreneur Rive-Sud', 'Brossard entrepreneur', 'Saint-Lambert services'],
})

const FAQS = [
  { question: 'Gestivio couvre-t-il la Rive-Sud de Montréal ?', answer: "Oui. Gestivio est utilisé par des entrepreneurs de Brossard, Saint-Lambert, La Prairie, Candiac, Sainte-Catherine et de l'ensemble de la Rive-Sud. L'outil s'adapte à votre territoire de service." },
  { question: 'Puis-je gérer des clients à la fois sur la Rive-Sud et à Montréal ?', answer: "Absolument. Gestivio n'est pas limité géographiquement. Vous pouvez gérer des clients partout au Québec depuis un seul compte, et organiser vos interventions par secteur." },
  { question: 'Comment fonctionne le portail de réservation pour mes clients ?', answer: "Vous activez le portail IA, personnalisez les questions selon vos services, et partagez le lien. Vos clients de la Rive-Sud réservent en ligne, et l'intervention apparaît dans votre calendrier automatiquement." },
]

export default function RiveSudPage() {
  return (
    <>
      <JsonLd data={[
        localBusinessSchema({
          name: 'Gestivio — Rive-Sud',
          city: 'Brossard',
          region: 'QC',
          country: 'CA',
          description: 'Logiciel de gestion pour les entrepreneurs en services sur la Rive-Sud de Montréal.',
        }),
        breadcrumbSchema([{ name: 'Accueil', url: '/' }, { name: 'Rive-Sud', url: '/rive-sud' }]),
        faqSchema(FAQS),
      ]} />

      <MarketingShell>
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">
              <MapPin className="h-4 w-4" /> Rive-Sud · Grand Montréal
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Gestivio pour les entrepreneurs de la Rive-Sud
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mb-8">
              La Rive-Sud de Montréal — Brossard, Saint-Lambert, La Prairie, Candiac, Châteauguay — est un marché résidentiel en pleine croissance. Avec le REM et les nouveaux développements, la demande en services de plomberie, d&apos;électricité et de rénovation explose. Gestivio vous donne les outils pour suivre le rythme.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              Essai gratuit 14 jours <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Un marché en pleine croissance</h2>
          <p className="text-gray-500 mb-8 max-w-3xl">Avec l&apos;arrivée du REM à Brossard et les développements résidentiels à La Prairie et Candiac, la Rive-Sud attire de plus en plus de familles. Pour les entrepreneurs en services, cela signifie plus de clients potentiels mais aussi plus de compétition. Gestivio vous aide à vous professionnaliser: réservation en ligne, facturation rapide avec TPS/TVQ, suivi client impeccable. Démarquez-vous de la concurrence.</p>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: 'Réservation en ligne IA', desc: 'Vos clients de Brossard et La Prairie réservent 24h/24 via votre portail personnalisé.' },
              { title: 'Facturation professionnelle', desc: 'Factures avec TPS/TVQ, paiement en ligne, relances automatiques pour les impayés.' },
              { title: 'Couverture multi-secteur', desc: 'Gérez vos clients de la Rive-Sud et de Montréal depuis un seul tableau de bord.' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6">
                <p className="text-base font-bold text-gray-900 mb-1">{s.title}</p>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-50/60 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Questions fréquentes</h2>
            <div className="space-y-3">
              {FAQS.map((q, i) => (
                <details key={i} className="group rounded-2xl border border-gray-100 bg-white p-5">
                  <summary className="cursor-pointer font-semibold text-gray-900">{q.question}</summary>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{q.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
          <NewsletterSignup />
        </section>
      </MarketingShell>
    </>
  )
}
