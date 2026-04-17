import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, X } from 'lucide-react'
import { buildMetadata } from '@/lib/seo'
import MarketingShell from '@/components/MarketingShell'
import JsonLd from '@/components/JsonLd'
import { breadcrumbSchema, faqSchema } from '@/lib/schema'

export const metadata: Metadata = buildMetadata({
  title: 'Gestivio vs ProgressionLIVE : alternative pour PME québécoises (2026)',
  description: "Comparaison entre Gestivio et ProgressionLIVE pour les petites entreprises de services au Québec. Simplicité, prix, IA et fonctionnalités.",
  path: '/vs/progressionlive',
  locale: 'fr',
  keywords: ['Gestivio vs ProgressionLIVE', 'alternative ProgressionLIVE', 'logiciel service terrain Québec', 'ProgressionLIVE prix'],
})

const FAQS = [
  { question: 'ProgressionLIVE et Gestivio visent-ils le même marché ?', answer: "Pas exactement. ProgressionLIVE est conçu pour les moyennes et grandes entreprises avec des besoins complexes de gestion de flotte et de suivi GPS. Gestivio cible les PME de 1 à 25 employés qui cherchent simplicité, facturation et portail client." },
  { question: 'Puis-je migrer de ProgressionLIVE à Gestivio ?', answer: "Oui. Vous pouvez exporter vos clients et les importer dans Gestivio via CSV. L'équipe Gestivio peut vous accompagner dans la transition." },
  { question: 'Gestivio offre-t-il le suivi GPS comme ProgressionLIVE ?', answer: "Non. Gestivio se concentre sur la gestion des clients, la facturation, la planification et le portail IA. Si le suivi GPS en temps réel de votre flotte est une priorité, ProgressionLIVE est peut-être plus adapté." },
]

const COMPARISON: Array<{ feature: string; gestivio: boolean | string; progression: boolean | string }> = [
  { feature: 'Conçu pour les PME (1-25 employés)', gestivio: true, progression: false },
  { feature: 'Interface simple et intuitive', gestivio: true, progression: 'Complexe' },
  { feature: 'Portail de réservation IA', gestivio: true, progression: false },
  { feature: 'Facturation et paiement en ligne', gestivio: true, progression: 'Limité' },
  { feature: 'Suivi GPS de flotte', gestivio: false, progression: true },
  { feature: 'Gestion de formulaires terrain', gestivio: 'Basique', progression: true },
  { feature: 'TPS/TVQ automatique', gestivio: true, progression: true },
  { feature: 'Interface bilingue FR/EN', gestivio: true, progression: true },
  { feature: 'Assistant IA intégré', gestivio: true, progression: false },
  { feature: 'Prix transparent en ligne', gestivio: true, progression: 'Sur devis' },
  { feature: 'Essai gratuit sans carte de crédit', gestivio: true, progression: false },
  { feature: 'Données hébergées au Canada', gestivio: true, progression: true },
]

function CellView({ v }: { v: boolean | string }) {
  if (v === true) return <Check className="h-5 w-5 text-emerald-600 mx-auto" />
  if (v === false) return <X className="h-4 w-4 text-gray-300 mx-auto" />
  return <span className="text-sm text-gray-600">{v}</span>
}

export default function VsProgressionLivePage() {
  return (
    <>
      <JsonLd data={[
        breadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'Comparaisons', url: '/vs' },
          { name: 'Gestivio vs ProgressionLIVE', url: '/vs/progressionlive' },
        ]),
        faqSchema(FAQS),
      ]} />

      <MarketingShell>
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">Comparaison</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Gestivio vs ProgressionLIVE : quelle solution pour votre PME québécoise ?
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mb-8">
              ProgressionLIVE est un logiciel québécois de gestion de services terrain axé sur les grandes entreprises et la gestion de flotte. Gestivio est conçu pour les PME de 1 à 25 employés. Voici une comparaison honnête pour vous aider à choisir.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">ProgressionLIVE en bref</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            ProgressionLIVE est un logiciel québécois fondé à Québec. Il est spécialisé dans la gestion de services terrain pour les moyennes et grandes entreprises. Ses forces incluent le suivi GPS de flotte en temps réel, les formulaires terrain personnalisables, et l&apos;intégration avec des systèmes ERP. C&apos;est un outil puissant, mais sa complexité et son modèle de tarification sur devis le rendent moins accessible pour les petits entrepreneurs.
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            Gestivio est conçu pour les entrepreneurs individuels et les petites équipes. L&apos;accent est mis sur la simplicité d&apos;utilisation, la facturation avec TPS/TVQ, le portail de réservation IA, et un prix transparent sans surprises. Si vous êtes un plombier avec 2 techniciens ou un électricien indépendant, Gestivio est fait pour vous.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">Comparaison détaillée</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-900">Fonctionnalité</th>
                  <th className="text-center px-4 py-3 font-semibold text-indigo-600 w-32">Gestivio</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 w-40">ProgressionLIVE</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-700">{row.feature}</td>
                    <td className="px-4 py-3 text-center"><CellView v={row.gestivio} /></td>
                    <td className="px-4 py-3 text-center"><CellView v={row.progression} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Quand choisir ProgressionLIVE</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            ProgressionLIVE est le bon choix si vous avez une flotte de véhicules à suivre en temps réel, si vous avez besoin de formulaires terrain complexes et personnalisables, ou si vous avez plus de 25 employés et des processus opérationnels sophistiqués. C&apos;est un outil puissant pour les entreprises qui ont outgrowné les solutions plus simples.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Quand choisir Gestivio</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Gestivio est le meilleur choix si vous êtes un entrepreneur indépendant ou une petite équipe de 1 à 25 personnes. Vous cherchez un outil simple à apprendre, avec facturation TPS/TVQ intégrée, portail de réservation IA, et un prix transparent à partir de 39 $/mois. Pas besoin de formation de 2 jours — vous êtes opérationnel en moins d&apos;une heure.
          </p>
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

        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 sm:p-12 text-white text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Essayez Gestivio gratuitement</h2>
            <p className="text-indigo-100 max-w-xl mx-auto mb-7">14 jours d&apos;essai gratuit. Aucune carte de crédit. Aucun engagement.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 px-6 py-3 text-sm font-semibold hover:bg-indigo-50">
              Commencer l&apos;essai gratuit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </MarketingShell>
    </>
  )
}
