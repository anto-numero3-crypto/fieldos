import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { buildMetadata } from '@/lib/seo'
import MarketingShell from '@/components/MarketingShell'
import JsonLd from '@/components/JsonLd'
import { localBusinessSchema, breadcrumbSchema, faqSchema } from '@/lib/schema'
import NewsletterSignup from '@/components/NewsletterSignup'

export const metadata: Metadata = buildMetadata({
  title: 'Logiciel de gestion pour entrepreneurs à Longueuil | Gestivio',
  description: "Gestivio pour les entrepreneurs en services à Longueuil et en Montérégie. Facturation TPS/TVQ, planification, portail IA. Essai gratuit 14 jours.",
  path: '/longueuil',
  locale: 'fr',
  keywords: ['logiciel gestion Longueuil', 'entrepreneur Longueuil', 'plombier Longueuil', 'Montérégie entrepreneur'],
})

const FAQS = [
  { question: 'Gestivio fonctionne-t-il pour les entrepreneurs de Longueuil ?', answer: "Oui. Gestivio est conçu pour les entrepreneurs québécois. Que vous travailliez à Longueuil, Saint-Hubert, Brossard ou dans l'ensemble de la Montérégie, l'outil s'adapte à votre territoire." },
  { question: 'Comment Gestivio m\'aide-t-il à couvrir la Montérégie ?', answer: "Gestivio vous permet de planifier vos interventions par zone géographique. Regroupez vos clients par secteur pour optimiser vos déplacements entre Longueuil, Saint-Bruno, Boucherville et Chambly." },
  { question: 'Le logiciel gère-t-il la TPS et la TVQ ?', answer: "Oui. Vous configurez vos numéros de taxes une seule fois. Gestivio les applique automatiquement sur chaque facture et soumission." },
]

export default function LongueuilPage() {
  return (
    <>
      <JsonLd data={[
        localBusinessSchema({
          name: 'Gestivio — Longueuil',
          city: 'Longueuil',
          region: 'QC',
          country: 'CA',
          description: 'Logiciel de gestion pour les entrepreneurs en services à Longueuil et en Montérégie.',
        }),
        breadcrumbSchema([{ name: 'Accueil', url: '/' }, { name: 'Longueuil', url: '/longueuil' }]),
        faqSchema(FAQS),
      ]} />

      <MarketingShell>
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">
              <MapPin className="h-4 w-4" /> Longueuil · Montérégie
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Gestivio pour les entrepreneurs de Longueuil et la Montérégie
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mb-8">
              La Montérégie est l&apos;une des régions les plus peuplées du Québec. De Longueuil à Brossard, de Saint-Hubert à Chambly, les entrepreneurs en services desservent un territoire vaste et diversifié. Gestivio centralise votre gestion dans un outil fait au Québec: facturation TPS/TVQ, planification, portail de réservation IA, et rapports.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              Essai gratuit 14 jours <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">La Montérégie, un territoire en croissance</h2>
          <p className="text-gray-500 mb-8 max-w-3xl">Longueuil et la Montérégie connaissent un boom immobilier avec de nouvelles constructions et des rénovations dans les quartiers établis. Les entrepreneurs de la région doivent gérer un territoire étendu tout en maintenant un service de qualité. Gestivio vous aide à planifier vos journées, facturer rapidement et garder vos clients satisfaits — du Vieux-Longueuil à Boucherville, de Saint-Bruno à Varennes.</p>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: 'Planification par secteur', desc: 'Regroupez vos interventions par zone pour réduire les déplacements en Montérégie.' },
              { title: 'Facturation automatisée', desc: 'TPS/TVQ calculées, factures envoyées par courriel, paiement en ligne Stripe.' },
              { title: 'Support québécois', desc: 'Une équipe québécoise qui comprend votre réalité et parle votre langue.' },
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
