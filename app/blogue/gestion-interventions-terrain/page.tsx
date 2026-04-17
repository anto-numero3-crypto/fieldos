import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, User } from 'lucide-react'
import { buildMetadata } from '@/lib/seo'
import MarketingShell from '@/components/MarketingShell'
import JsonLd from '@/components/JsonLd'
import { articleSchema, breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = buildMetadata({
  title: 'Gestion des interventions terrain : le guide pratique pour entrepreneurs (2026)',
  description: "Comment organiser vos interventions terrain efficacement. Planification, suivi en temps réel, communication client et rapports. Guide pour PME québécoises.",
  path: '/blogue/gestion-interventions-terrain',
  locale: 'fr',
  type: 'article',
  publishedAt: '2026-01-10',
  keywords: ['gestion interventions terrain', 'field service management', 'planification interventions', 'suivi techniciens'],
})

export default function ArticleGestionInterventions() {
  return (
    <>
      <JsonLd data={[
        articleSchema({
          headline: 'Gestion des interventions terrain : le guide pratique pour entrepreneurs',
          description: "Comment organiser vos interventions terrain efficacement.",
          image: '/og-default.png',
          datePublished: '2026-01-10',
          dateModified: '2026-04-10',
          author: 'Gestivio',
          url: 'https://gestivio.ca/blogue/gestion-interventions-terrain',
        }),
        breadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'Blogue', url: '/blogue' },
          { name: 'Gestion des interventions terrain', url: '/blogue/gestion-interventions-terrain' },
        ]),
      ]} />

      <MarketingShell>
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> 10 janvier 2026</span>
            <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> Équipe Gestivio</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Gestion des interventions terrain : le guide pratique pour entrepreneurs
          </h1>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            Que vous soyez plombier, électricien, technicien CVC ou rénovateur, la gestion de vos interventions terrain est au coeur de votre rentabilité. Voici comment l&apos;organiser efficacement.
          </p>

          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Qu&apos;est-ce que la gestion des interventions terrain ?</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              La gestion des interventions terrain (ou field service management en anglais) englobe tout ce qui concerne l&apos;organisation du travail effectué chez vos clients: la prise de rendez-vous, l&apos;assignation des techniciens, le suivi de l&apos;avancement, la facturation après l&apos;intervention, et le suivi client. C&apos;est le processus complet, de l&apos;appel initial à la facture payée.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Les 5 piliers d&apos;une gestion efficace</h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. La prise de rendez-vous</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Tout commence par la demande du client. Traditionnellement, le client appelle, vous notez les détails dans un carnet, et vous rappelez pour confirmer. Ce processus prend du temps et génère des erreurs. Les entrepreneurs modernes utilisent un portail de réservation en ligne qui permet au client de décrire son besoin, de choisir un créneau et de confirmer — sans que vous ayez à répondre au téléphone.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Un portail de réservation propulsé par l&apos;IA va encore plus loin. L&apos;assistant pose les bonnes questions au client (type de service, urgence, adresse), collecte les informations et crée l&apos;intervention dans votre calendrier automatiquement. Vous ne traitez que les cas complexes.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. La planification et l&apos;assignation</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Une fois l&apos;intervention créée, il faut l&apos;assigner au bon technicien, au bon moment. Un calendrier numérique partagé permet au répartiteur de voir les disponibilités de chaque technicien, de glisser-déposer les interventions, et de s&apos;assurer que personne n&apos;est surchargé ou sous-utilisé.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Pour les urgences, le processus doit être rapide. Le répartiteur crée l&apos;intervention, l&apos;assigne au technicien le plus proche, et celui-ci reçoit instantanément les détails sur son téléphone. Pas de coup de fil, pas de texto mal compris, pas de temps perdu.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. L&apos;exécution sur le terrain</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Le technicien arrive chez le client avec toutes les informations nécessaires sur son téléphone: adresse, type de service, historique des interventions précédentes, notes du répartiteur. Il effectue le travail, prend des photos si nécessaire, note les pièces utilisées, et marque l&apos;intervention comme terminée.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. La facturation immédiate</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Le meilleur moment pour facturer, c&apos;est immédiatement après l&apos;intervention. Le technicien convertit l&apos;intervention en facture sur son téléphone. Les taxes (TPS/TVQ au Québec) sont calculées automatiquement. Le client reçoit la facture par courriel et peut payer en ligne. Résultat: vous êtes payé en 2 jours au lieu de 30.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Le suivi et les rapports</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Combien d&apos;interventions avez-vous complétées ce mois-ci ? Quel est votre revenu moyen par intervention ? Quel technicien est le plus productif ? Quel pourcentage de vos factures sont payées dans les 7 jours ? Ces données sont essentielles pour piloter votre entreprise, mais impossibles à obtenir sans un logiciel qui les collecte automatiquement.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Les erreurs qui coûtent cher</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Voici les erreurs les plus courantes que nous observons chez les entrepreneurs en services:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li><strong>Facturer trop tard.</strong> Chaque jour de retard dans l&apos;envoi de la facture ajoute en moyenne 5 jours au délai de paiement. Facturez le jour même.</li>
              <li><strong>Ne pas conserver l&apos;historique client.</strong> Si un technicien retourne chez un client sans connaître l&apos;historique, il perd du temps à diagnostiquer un problème déjà vu.</li>
              <li><strong>Gérer les rendez-vous par téléphone uniquement.</strong> Chaque appel téléphonique vous coûte du temps. Un portail de réservation en ligne filtre 60 à 80 % des demandes de routine.</li>
              <li><strong>Ne pas suivre la rentabilité par type d&apos;intervention.</strong> Certains services sont plus rentables que d&apos;autres. Sans données, vous ne pouvez pas optimiser votre offre.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Conclusion</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              La gestion des interventions terrain est un processus qui se décompose en étapes claires: prise de rendez-vous, planification, exécution, facturation et suivi. Un logiciel comme <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-semibold">Gestivio</Link> automatise chacune de ces étapes, ce qui vous laisse plus de temps pour faire le travail que vous aimez — et moins de temps devant un écran.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/logiciel-plombier" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Gestivio pour plombiers <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/logiciel-cvc" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Gestivio pour CVC <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/blogue/portail-reservation-entreprise-service" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Portail de réservation IA <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">Simplifiez vos interventions terrain</h2>
            <p className="text-indigo-100 mb-6">Gestivio organise votre planification, facturation et suivi client en un seul endroit.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 px-6 py-3 text-sm font-semibold hover:bg-indigo-50">
              Essai gratuit 14 jours <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </MarketingShell>
    </>
  )
}
