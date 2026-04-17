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
  keywords: ['logiciel gestion Montréal', 'entrepreneur Montréal', 'facturation Montréal', 'plombier Montréal', 'électricien Montréal'],
})

const FAQS = [
  { question: 'Gestivio est-il adapté aux entrepreneurs de Montréal ?', answer: "Oui. Gestivio prend en charge la TPS/TVQ, l'interface est en français et en anglais, et toutes les données sont hébergées au Canada — trois éléments importants pour les PME montréalaises." },
  { question: 'Puis-je recevoir du support en français à Montréal ?', answer: "Oui. Notre support est offert en français par courriel et clavardage. Nous sommes une entreprise québécoise basée à Montréal." },
  { question: 'Gestivio est-il adapté au marché bilingue de Montréal ?', answer: "Absolument. L'interface et les courriels automatiques sont disponibles en français et en anglais. Vos clients anglophones et francophones reçoivent leurs factures et confirmations dans leur langue." },
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
              Montréal est la plus grande ville du Québec avec des milliers de plombiers, électriciens, rénovateurs et entreprises de nettoyage. Gestivio est le logiciel de gestion conçu pour vous: facturation TPS/TVQ automatique, planification, portail de réservation IA, et interface bilingue FR/EN.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              Essai gratuit 14 jours <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Conçu pour la réalité montréalaise</h2>
          <p className="text-gray-500 mb-8 max-w-3xl">Montréal est une ville bilingue avec un tissu économique dense de PME en services. Entre les chantiers du Plateau, les immeubles de Côte-des-Neiges, les maisons de Rosemont et les condos de Griffintown, vos clients sont partout. Gestivio vous aide à les servir efficacement, dans leur langue, avec une facturation conforme aux exigences québécoises.</p>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: 'TPS + TVQ automatiques',  desc: 'Taxes québécoises appliquées correctement sur chaque facture, conformément aux règles de Revenu Québec.' },
              { title: 'Bilingue FR/EN',           desc: "Interface et courriels automatiques en français ou anglais — essentiel pour le marché montréalais." },
              { title: 'Données au Canada',        desc: "Hébergement conforme à la Loi 25 du Québec et à la LPRPDE." },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6">
                <p className="text-base font-bold text-gray-900 mb-1">{s.title}</p>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Industries desservies à Montréal</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Plombiers', href: '/logiciel-plombier' },
              { label: 'Électriciens', href: '/logiciel-electricien' },
              { label: 'CVC / HVAC', href: '/logiciel-cvc' },
              { label: 'Nettoyage', href: '/logiciel-nettoyage' },
              { label: 'Paysagistes', href: '/logiciel-paysagiste' },
              { label: 'Rénovation', href: '/logiciel-renovateur' },
            ].map((ind) => (
              <Link key={ind.href} href={ind.href} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
                <span className="text-sm font-semibold text-gray-900">{ind.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-600 ml-auto" />
              </Link>
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
