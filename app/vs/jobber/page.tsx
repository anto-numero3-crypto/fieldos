import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, X, ArrowRight } from 'lucide-react'
import { buildMetadata } from '@/lib/seo'
import MarketingShell from '@/components/MarketingShell'
import JsonLd from '@/components/JsonLd'
import { breadcrumbSchema, productSchema } from '@/lib/schema'

export const metadata: Metadata = buildMetadata({
  title: 'Gestivio vs Jobber — Alternative québécoise | Gestivio',
  description: "Comparaison détaillée: Gestivio vs Jobber pour les entrepreneurs québécois. Français, TPS/TVQ, prix en CAD, données au Canada. Essai gratuit.",
  path: '/vs/jobber',
  locale: 'fr',
  keywords: ['Jobber alternative', 'Jobber Quebec', 'alternative Jobber français', 'Gestivio vs Jobber'],
})

const ROWS: Array<{ feature: string; gestivio: boolean | string; jobber: boolean | string; winner?: 'gestivio' | 'jobber' | 'tie' }> = [
  { feature: 'Prix de base (par mois)', gestivio: '29 $ CAD', jobber: '~65 $ CAD (49 $ USD)', winner: 'gestivio' },
  { feature: 'Interface en français natif', gestivio: true, jobber: 'Traduction partielle', winner: 'gestivio' },
  { feature: 'Calcul TPS + TVQ automatique', gestivio: true, jobber: false, winner: 'gestivio' },
  { feature: 'Données hébergées au Canada', gestivio: true, jobber: 'États-Unis', winner: 'gestivio' },
  { feature: 'Support en français', gestivio: true, jobber: 'Limité', winner: 'gestivio' },
  { feature: 'Facturation CAD sans frais de change', gestivio: true, jobber: false, winner: 'gestivio' },
  { feature: 'Portail de réservation IA', gestivio: true, jobber: false, winner: 'gestivio' },
  { feature: 'Applications mobiles dédiées', gestivio: 'Web optimisé mobile', jobber: true, winner: 'jobber' },
  { feature: 'Années sur le marché', gestivio: '2024+', jobber: '2011+', winner: 'jobber' },
  { feature: 'Intégrations tierces', gestivio: 'En croissance', jobber: 'Étendues', winner: 'jobber' },
]

export default function Page() {
  return (
    <>
      <JsonLd data={[
        breadcrumbSchema([{ name: 'Accueil', url: '/' }, { name: 'Comparaisons', url: '/vs' }, { name: 'Jobber', url: '/vs/jobber' }]),
        productSchema({ name: 'Gestivio', description: 'Logiciel de gestion pour entrepreneurs en services terrain — alternative québécoise à Jobber.', price: '29' }),
      ]} />

      <MarketingShell>
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">Comparaison</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">Gestivio vs Jobber</h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl">
            Jobber est une excellente plateforme mature, mais elle n&apos;a pas été conçue pour la réalité québécoise. Voici pourquoi plus de 200 entrepreneurs du Québec choisissent Gestivio.
          </p>

          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <div>Fonctionnalité</div>
              <div className="text-center">Gestivio</div>
              <div className="text-center">Jobber</div>
            </div>
            {ROWS.map((r, i) => (
              <div key={i} className={`grid grid-cols-3 px-4 py-3 text-sm items-center ${i % 2 ? 'bg-gray-50/40' : ''}`}>
                <div className="text-gray-700">{r.feature}</div>
                <div className={`text-center font-semibold ${r.winner === 'gestivio' ? 'text-emerald-700' : 'text-gray-700'}`}>
                  <Cell v={r.gestivio} />
                </div>
                <div className={`text-center ${r.winner === 'jobber' ? 'text-emerald-700 font-semibold' : 'text-gray-600'}`}>
                  <Cell v={r.jobber} />
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-3">Pourquoi les entrepreneurs québécois choisissent Gestivio</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p><strong className="text-gray-900">Le français est natif, pas traduit.</strong> Chaque écran, chaque courriel automatique, chaque message d&apos;erreur est en français québécois — pas une traduction partielle de l&apos;anglais.</p>
            <p><strong className="text-gray-900">La TPS et la TVQ fonctionnent correctement.</strong> Jobber a été conçu pour le système de taxes américain. Gestivio applique automatiquement la TPS (5%) et la TVQ (9,975%) selon les règles de Revenu Québec.</p>
            <p><strong className="text-gray-900">Vos données restent au Canada.</strong> Sous la Loi 25 du Québec et la LPRPDE, c&apos;est une distinction qui compte. Jobber stocke vos données clients aux États-Unis.</p>
            <p><strong className="text-gray-900">Prix en CAD, sans frais de change.</strong> Pas de surprise sur votre relevé de carte chaque mois. Pas de fluctuation de change.</p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-3">Quand rester sur Jobber</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>Si vous opérez hors du Québec, ou si vous dépendez de 10+ intégrations tierces (QuickBooks avancé, Mailchimp, HubSpot), Jobber peut rester une bonne option. Mais pour les PME québécoises qui veulent un outil local, Gestivio est meilleur et coûte 55% moins cher.</p>
          </div>

          <div className="mt-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white text-center">
            <h3 className="text-xl font-bold mb-2">Essayez Gestivio gratuitement</h3>
            <p className="text-indigo-100 mb-5">14 jours. Aucune carte de crédit. Support en français inclus.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 px-6 py-3 text-sm font-semibold hover:bg-indigo-50">
              Commencer l&apos;essai <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </MarketingShell>
    </>
  )
}

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Check className="h-5 w-5 text-emerald-600 inline" />
  if (v === false) return <X className="h-5 w-5 text-red-400 inline" />
  return <span>{v}</span>
}
