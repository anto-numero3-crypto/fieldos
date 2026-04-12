import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { buildMetadata } from '@/lib/seo'
import MarketingShell from '@/components/MarketingShell'
import JsonLd from '@/components/JsonLd'
import { localBusinessSchema, breadcrumbSchema, faqSchema } from '@/lib/schema'
import NewsletterSignup from '@/components/NewsletterSignup'

export const metadata: Metadata = buildMetadata({
  title: 'Logiciel de gestion pour entrepreneurs à Montréal | Gestivio',
  description: "Gestivio pour les entrepreneurs en services à Montréal. Facturation TPS/TVQ, rendez-vous, gestion clientèle. Bilingue FR/EN. Essai gratuit 14 jours.",
  path: '/montreal',
  locale: 'fr',
  keywords: ['logiciel gestion Montréal', 'entrepreneur Montréal', 'facturation Montréal'],
})

const FAQS = [
  { question: 'Gestivio est-il adapté aux entrepreneurs de Montréal ?', answer: "Oui. Gestivio prend en charge la TPS/TVQ, l'interface est en français, et toutes les données sont hébergées au Canada — trois éléments importants pour les PME montréalaises." },
  { question: 'Puis-je recevoir du support en français à Montréal ?', answer: "Oui. Notre support est offert en français par courriel et clavardage." },
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
          description: 'Logiciel de gestion pour les entrepreneurs en services à Montréal.',
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
              Le logiciel de gestion pour les entrepreneurs en services à Montréal: facturation TPS/TVQ automatique, rendez-vous en ligne, gestion clientèle. Interface bilingue FR/EN, données au Canada.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              Essai gratuit 14 jours <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Conçu pour la réalité montréalaise</h2>
          <p className="text-gray-500 mb-8 max-w-3xl">Montréal compte des dizaines de milliers d&apos;entrepreneurs en services: plombiers, électriciens, entrepreneurs en rénovation, entreprises de nettoyage. Chacun doit jongler avec la TPS, la TVQ, la langue française, et la réalité terrain du grand Montréal. Gestivio gère tout ça par défaut.</p>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: 'TPS + TVQ automatiques',  desc: 'Taxes québécoises appliquées correctement sur chaque facture.' },
              { title: 'Bilingue FR/EN',           desc: 'Interface et courriels automatiques en français ou anglais.' },
              { title: 'Données au Canada',        desc: "Hébergement conforme à la Loi 25 du Québec et à la LPRPDE." },
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
