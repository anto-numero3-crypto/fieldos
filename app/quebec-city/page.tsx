import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { buildMetadata } from '@/lib/seo'
import MarketingShell from '@/components/MarketingShell'
import JsonLd from '@/components/JsonLd'
import { localBusinessSchema, breadcrumbSchema, faqSchema } from '@/lib/schema'
import NewsletterSignup from '@/components/NewsletterSignup'

export const metadata: Metadata = buildMetadata({
  title: 'Logiciel de gestion pour entrepreneurs à Québec | Gestivio',
  description: "Gestivio pour les entrepreneurs en services dans la région de Québec. Facturation TPS/TVQ, planification, portail client IA. Fait au Québec. Essai gratuit 14 jours.",
  path: '/quebec-city',
  locale: 'fr',
  keywords: ['logiciel gestion Québec', 'entrepreneur Québec ville', 'facturation Québec', 'plombier Québec ville'],
})

const FAQS = [
  { question: 'Gestivio est-il utilisé par des entrepreneurs de la ville de Québec ?', answer: "Oui. Gestivio est développé au Québec et utilisé par des entrepreneurs de la Capitale-Nationale. L'interface bilingue, la facturation TPS/TVQ et l'hébergement canadien en font un choix naturel." },
  { question: 'Le fuseau horaire est-il correctement configuré ?', answer: "Oui. Gestivio utilise automatiquement le fuseau horaire de l'Est (America/Toronto), le format de date canadien et le dollar canadien." },
  { question: 'Puis-je obtenir du support en français ?', answer: "Bien sûr. Notre équipe est québécoise et offre le support en français par courriel et clavardage." },
]

export default function QuebecCityPage() {
  return (
    <>
      <JsonLd data={[
        localBusinessSchema({
          name: 'Gestivio — Québec',
          city: 'Québec',
          region: 'QC',
          country: 'CA',
          description: 'Logiciel de gestion pour les entrepreneurs en services dans la région de Québec.',
        }),
        breadcrumbSchema([{ name: 'Accueil', url: '/' }, { name: 'Québec', url: '/quebec-city' }]),
        faqSchema(FAQS),
      ]} />

      <MarketingShell>
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">
              <MapPin className="h-4 w-4" /> Ville de Québec · Capitale-Nationale
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Gestivio pour les entrepreneurs de la ville de Québec
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mb-8">
              La Capitale-Nationale regorge d&apos;entrepreneurs en services: plombiers dans le Vieux-Québec, électriciens à Sainte-Foy, rénovateurs à Beauport, paysagistes à Charlesbourg. Gestivio vous aide à gérer votre entreprise avec un outil fait ici, en français.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              Essai gratuit 14 jours <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Pourquoi Gestivio à Québec ?</h2>
          <p className="text-gray-500 mb-8 max-w-3xl">La ville de Québec est un marché francophone avec une forte densité de propriétaires. Les entrepreneurs de la région jonglent entre les maisons patrimoniales du Vieux-Québec, les bungalows des banlieues et les condos des Rivières. Gestivio gère la TPS/TVQ, envoie vos factures en français et permet à vos clients de réserver en ligne — que ce soit pour une urgence de plomberie en plein hiver ou un aménagement paysager printanier.</p>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: 'Fait au Québec',  desc: 'Développé ici, support en français, facturation conforme aux exigences québécoises.' },
              { title: 'Réservation 24/7', desc: "Vos clients de Sainte-Foy, Beauport et Charlesbourg réservent en ligne à toute heure." },
              { title: 'Conforme Loi 25', desc: "Données hébergées au Canada, conformes à la Loi 25 et à la LPRPDE." },
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
