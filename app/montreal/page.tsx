import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { buildMetadata } from '@/lib/seo'
import MarketingShell from '@/components/MarketingShell'
import JsonLd from '@/components/JsonLd'
import { localBusinessSchema, breadcrumbSchema, faqSchema } from '@/lib/schema'
import NewsletterSignup from '@/components/NewsletterSignup'

export const metadata: Metadata = buildMetadata({
  title: 'Logiciel de gestion service terrain à Montréal | Gestivio',
  description: "Utilisé par plus de 200 entrepreneurs à Montréal. Facturation, rendez-vous, gestion clientèle. Conçu pour les PME montréalaises. Essai gratuit 14 jours.",
  path: '/montreal',
  locale: 'fr',
  keywords: ['logiciel gestion Montréal', 'entrepreneur Montréal', 'service terrain Montréal', 'facturation Montréal'],
})

const FAQS = [
  { question: 'Gestivio est-il adapté aux entrepreneurs de Montréal ?', answer: "Oui. Gestivio a été conçu spécifiquement pour les entrepreneurs québécois, avec support complet de la TPS/TVQ, interface en français, et données hébergées au Canada. Plus de 200 PME montréalaises l'utilisent." },
  { question: 'Puis-je recevoir du support en français à Montréal ?', answer: "Oui. Notre équipe de support est basée au Québec et parle français. Lundi au vendredi, 8h à 18h, par courriel et chat." },
  { question: 'Y a-t-il une version spécifique à Montréal ?', answer: "Non, mais Gestivio inclut automatiquement le fuseau horaire America/Toronto, le format de date canadien, et le dollar canadien." },
]

export default function MontrealPage() {
  return (
    <>
      <JsonLd data={[
        localBusinessSchema({
          name: 'Gestivio — Montréal',
          city: 'Montréal',
          region: 'QC',
          country: 'CA',
          description: 'Logiciel de gestion pour entrepreneurs en services terrain basés à Montréal.',
        }),
        breadcrumbSchema([{ name: 'Accueil', url: '/' }, { name: 'Montréal', url: '/montreal' }]),
        faqSchema(FAQS),
      ]} />

      <MarketingShell>
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">
              <MapPin className="h-4 w-4" /> Montréal · Québec
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Gestivio pour les entrepreneurs de Montréal
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mb-8">
              Plus de 200 entrepreneurs montréalais utilisent Gestivio pour gérer leurs clients, factures et rendez-vous. Interface en français, support local, données au Canada.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              Essai gratuit 14 jours <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Conçu pour la réalité montréalaise</h2>
          <p className="text-gray-500 mb-8 max-w-2xl">Montréal, c'est plus de 50 000 entreprises de services: plombiers, électriciens, entrepreneurs en rénovation, entreprises de nettoyage. Chacune doit jongler avec la TPS, la TVQ, la langue française, et la réalité terrain du grand Montréal.</p>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { stat: '200+', label: 'PME montréalaises sur Gestivio' },
              { stat: '15 h', label: 'économisées par semaine en moyenne' },
              { stat: '100%', label: 'des données hébergées au Canada' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 text-center">
                <p className="text-3xl font-bold text-indigo-600">{s.stat}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
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
