import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, X } from 'lucide-react'
import { buildMetadata } from '@/lib/seo'
import MarketingShell from '@/components/MarketingShell'
import JsonLd from '@/components/JsonLd'
import { breadcrumbSchema, faqSchema } from '@/lib/schema'

export const metadata: Metadata = buildMetadata({
  title: 'Gestivio vs Jobber : comparaison honnête pour entrepreneurs québécois (2026)',
  description: "Comparaison détaillée entre Gestivio et Jobber pour les entrepreneurs en services au Québec. TPS/TVQ, français, prix, fonctionnalités et portail IA.",
  path: '/vs/jobber',
  locale: 'fr',
  keywords: ['Gestivio vs Jobber', 'alternative Jobber Québec', 'Jobber français', 'logiciel service terrain Québec'],
})

const FAQS = [
  { question: 'Jobber est-il disponible en français ?', answer: "Jobber offre une interface partiellement traduite en français, mais les courriels automatiques, les rapports et le support client sont principalement en anglais. Gestivio est nativement bilingue FR/EN." },
  { question: 'Pourquoi choisir Gestivio plutôt que Jobber ?', answer: "Gestivio est conçu spécifiquement pour le marché québécois: TPS/TVQ native, interface bilingue, données hébergées au Canada, portail de réservation IA, et prix en dollars canadiens. Jobber est un excellent produit mais il est conçu pour le marché nord-américain anglophone." },
  { question: 'Puis-je migrer de Jobber à Gestivio ?', answer: "Oui. Vous pouvez exporter vos clients de Jobber en CSV et les importer dans Gestivio. Notre équipe d'onboarding peut vous accompagner gratuitement dans la migration." },
]

const COMPARISON: Array<{ feature: string; gestivio: boolean | string; jobber: boolean | string }> = [
  { feature: 'Interface en français natif', gestivio: true, jobber: false },
  { feature: 'TPS/TVQ automatique', gestivio: true, jobber: 'Partiel' },
  { feature: 'Portail de réservation IA', gestivio: true, jobber: false },
  { feature: 'Données hébergées au Canada', gestivio: true, jobber: true },
  { feature: 'Prix en dollars canadiens', gestivio: true, jobber: true },
  { feature: 'Paiement en ligne Stripe', gestivio: true, jobber: true },
  { feature: 'Application mobile', gestivio: 'Web responsive', jobber: true },
  { feature: 'Gestion d\'équipe', gestivio: true, jobber: true },
  { feature: 'Rapports et analytiques', gestivio: true, jobber: true },
  { feature: 'Assistant IA intégré', gestivio: true, jobber: false },
  { feature: 'Conformité Loi 25 du Québec', gestivio: true, jobber: 'Non confirmé' },
  { feature: 'Support en français', gestivio: true, jobber: 'Limité' },
]

function CellView({ v }: { v: boolean | string }) {
  if (v === true) return <Check className="h-5 w-5 text-emerald-600 mx-auto" />
  if (v === false) return <X className="h-4 w-4 text-gray-300 mx-auto" />
  return <span className="text-sm text-gray-600">{v}</span>
}

export default function VsJobberPage() {
  return (
    <>
      <JsonLd data={[
        breadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'Comparaisons', url: '/vs' },
          { name: 'Gestivio vs Jobber', url: '/vs/jobber' },
        ]),
        faqSchema(FAQS),
      ]} />

      <MarketingShell>
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">Comparaison</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Gestivio vs Jobber : quelle est la meilleure option pour les entrepreneurs québécois ?
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mb-8">
              Jobber est un excellent logiciel de gestion de services terrain, populaire au Canada et aux États-Unis. Mais est-il le meilleur choix pour un entrepreneur québécois ? Voici une comparaison honnête.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Jobber en bref</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Jobber est un logiciel canadien basé à Edmonton, Alberta. Fondé en 2011, il est utilisé par des dizaines de milliers d&apos;entreprises de services en Amérique du Nord. C&apos;est un produit mature avec une application mobile native, des intégrations QuickBooks, et un écosystème riche. Son interface est principalement en anglais, avec une traduction partielle en français.
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            Gestivio est un logiciel québécois conçu spécifiquement pour les entrepreneurs du Québec. Interface nativement bilingue, TPS/TVQ automatique, portail de réservation propulsé par l&apos;IA, et données hébergées au Canada conformément à la Loi 25 du Québec.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">Comparaison détaillée</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-900">Fonctionnalité</th>
                  <th className="text-center px-4 py-3 font-semibold text-indigo-600 w-32">Gestivio</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 w-32">Jobber</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-700">{row.feature}</td>
                    <td className="px-4 py-3 text-center"><CellView v={row.gestivio} /></td>
                    <td className="px-4 py-3 text-center"><CellView v={row.jobber} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Quand choisir Jobber</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Jobber est un bon choix si vous travaillez principalement en anglais, si vous avez besoin d&apos;une application mobile native iOS/Android, ou si vous cherchez des intégrations spécifiques (comme Mailchimp ou Zapier). Jobber a aussi une communauté d&apos;utilisateurs plus large et plus d&apos;avis en ligne.
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">Quand choisir Gestivio</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Gestivio est le meilleur choix si vous travaillez au Québec, si vos clients et vos techniciens sont francophones, si vous avez besoin de la TPS/TVQ automatique sur chaque facture, et si vous voulez un portail de réservation IA qui travaille pour vous 24h/24. Gestivio est aussi moins cher que Jobber pour les petites équipes, et les données sont hébergées au Canada en conformité avec la Loi 25 du Québec.
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
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Essayez Gestivio et comparez par vous-même</h2>
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
