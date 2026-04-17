import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { buildMetadata } from '@/lib/seo'
import MarketingShell from '@/components/MarketingShell'
import JsonLd from '@/components/JsonLd'
import { localBusinessSchema, breadcrumbSchema, faqSchema } from '@/lib/schema'
import NewsletterSignup from '@/components/NewsletterSignup'

export const metadata: Metadata = buildMetadata({
  title: 'Logiciel de gestion pour entrepreneurs à Laval | Gestivio',
  description: "Gestivio pour les entrepreneurs en services à Laval. Facturation TPS/TVQ, planification d'interventions, portail client IA. Essai gratuit 14 jours.",
  path: '/laval',
  locale: 'fr',
  keywords: ['logiciel gestion Laval', 'entrepreneur Laval', 'plombier Laval', 'électricien Laval'],
})

const FAQS = [
  { question: 'Gestivio convient-il aux entrepreneurs de Laval ?', answer: "Oui. Gestivio est fait au Québec et gère automatiquement la TPS/TVQ, le français et le dollar canadien. C'est l'outil idéal pour les PME de Laval en services terrain." },
  { question: 'Mes clients lavallois peuvent-ils réserver en ligne ?', answer: "Oui. Activez le portail de réservation IA et partagez le lien. Vos clients de Chomedey, Vimont, Duvernay ou Sainte-Rose réservent en ligne 24h/24." },
  { question: 'Les données sont-elles sécurisées ?', answer: "Oui. Toutes les données sont hébergées au Canada, chiffrées, et conformes à la Loi 25 du Québec." },
]

export default function LavalPage() {
  return (
    <>
      <JsonLd data={[
        localBusinessSchema({
          name: 'Gestivio — Laval',
          city: 'Laval',
          region: 'QC',
          country: 'CA',
          description: 'Logiciel de gestion pour les entrepreneurs en services à Laval.',
        }),
        breadcrumbSchema([{ name: 'Accueil', url: '/' }, { name: 'Laval', url: '/laval' }]),
        faqSchema(FAQS),
      ]} />

      <MarketingShell>
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">
              <MapPin className="h-4 w-4" /> Laval · Québec
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Gestivio pour les entrepreneurs de Laval
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mb-8">
              Laval est la troisième plus grande ville du Québec et un pôle important pour les entrepreneurs en services résidentiels. Avec ses quartiers en plein développement comme Chomedey, Sainte-Dorothée et Vimont, la demande en plomberie, électricité, rénovation et entretien paysager ne cesse de croître. Gestivio vous aide à gérer cette croissance sans perdre le contrôle.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              Essai gratuit 14 jours <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Pourquoi Gestivio à Laval ?</h2>
          <p className="text-gray-500 mb-8 max-w-3xl">Laval est un marché résidentiel dynamique avec beaucoup de nouvelles constructions et de propriétés à rénover. Les entrepreneurs lavallois desservent souvent aussi la couronne nord et le nord de Montréal. Gestivio vous permet de planifier vos interventions, de facturer avec TPS/TVQ, et de laisser vos clients réserver en ligne — que vous soyez plombier, électricien, paysagiste ou rénovateur.</p>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: 'Couverture Laval et couronne nord', desc: 'Planifiez vos interventions à Laval, Blainville, Saint-Eustache et les environs.' },
              { title: 'Facturation TPS/TVQ', desc: 'Taxes québécoises calculées automatiquement, factures envoyées par courriel.' },
              { title: 'Portail client IA', desc: 'Vos clients réservent en ligne 24h/24. L\'assistant IA collecte les détails.' },
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
