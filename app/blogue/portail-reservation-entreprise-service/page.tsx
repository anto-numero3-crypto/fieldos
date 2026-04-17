import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, User } from 'lucide-react'
import { buildMetadata } from '@/lib/seo'
import MarketingShell from '@/components/MarketingShell'
import JsonLd from '@/components/JsonLd'
import { articleSchema, breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = buildMetadata({
  title: 'Portail de réservation en ligne pour entreprises de service : guide complet (2026)',
  description: "Comment un portail de réservation en ligne propulsé par l'IA peut transformer votre entreprise de service. Moins d'appels, plus de clients, 24h/24.",
  path: '/blogue/portail-reservation-entreprise-service',
  locale: 'fr',
  type: 'article',
  publishedAt: '2026-03-01',
  keywords: ['portail réservation en ligne', 'réservation IA entreprise', 'prise de rendez-vous en ligne', 'booking entreprise service'],
})

export default function ArticlePortalReservation() {
  return (
    <>
      <JsonLd data={[
        articleSchema({
          headline: 'Portail de réservation en ligne pour entreprises de service : guide complet',
          description: "Comment un portail de réservation en ligne propulsé par l'IA peut transformer votre entreprise de service.",
          image: '/og-default.png',
          datePublished: '2026-03-01',
          dateModified: '2026-04-10',
          author: 'Gestivio',
          url: 'https://gestivio.ca/blogue/portail-reservation-entreprise-service',
        }),
        breadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'Blogue', url: '/blogue' },
          { name: 'Portail de réservation', url: '/blogue/portail-reservation-entreprise-service' },
        ]),
      ]} />

      <MarketingShell>
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> 1 mars 2026</span>
            <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> Équipe Gestivio</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Portail de réservation en ligne pour entreprises de service : pourquoi et comment
          </h1>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            Vos clients veulent réserver en ligne. Si vous les obligez à appeler pendant vos heures d&apos;ouverture, vous perdez des contrats. Voici comment un portail de réservation IA change la donne pour les entreprises de services.
          </p>

          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Le problème: 60 % des appels sont des demandes de routine</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Si vous êtes plombier, électricien ou entrepreneur en services, vous recevez probablement des dizaines d&apos;appels par semaine. La majorité sont des questions simples: &laquo; Êtes-vous disponible mardi ? &raquo;, &laquo; Combien coûte une visite ? &raquo;, &laquo; Desservez-vous Laval ? &raquo;. Chaque appel interrompt votre travail sur le terrain. Chaque appel manqué est un client potentiel qui appelle votre concurrent.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Un portail de réservation en ligne résout ce problème en permettant aux clients de réserver directement, sans vous appeler. Mais un simple formulaire de contact ne suffit pas. Les formulaires génèrent des demandes vagues qui nécessitent des allers-retours par courriel. C&apos;est là qu&apos;intervient l&apos;intelligence artificielle.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Comment fonctionne un portail de réservation IA</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Un portail de réservation propulsé par l&apos;IA fonctionne comme un réceptionniste virtuel. Le client accède à votre portail (via un lien sur votre site web, votre page Google, ou vos cartes d&apos;affaires), et un assistant IA bilingue le guide à travers le processus:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>L&apos;assistant demande le type de service souhaité (réparation urgente, entretien planifié, soumission pour projet)</li>
              <li>Il collecte les détails pertinents (description du problème, adresse, photos si nécessaire)</li>
              <li>Il propose des créneaux disponibles selon votre calendrier</li>
              <li>Il confirme la réservation et envoie un courriel de confirmation au client</li>
              <li>L&apos;intervention apparaît automatiquement dans votre calendrier avec toutes les informations collectées</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-4">
              Le tout se passe en français ou en anglais, selon la préférence du client. Et ça fonctionne 24 heures sur 24, 7 jours sur 7 — même le samedi soir quand un propriétaire découvre un dégât d&apos;eau.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Les avantages concrets pour votre entreprise</h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Moins d&apos;appels, plus de temps sur le terrain</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Les entrepreneurs qui activent un portail de réservation en ligne rapportent une diminution de 40 à 60 % des appels téléphoniques de routine. Vous gardez votre numéro de téléphone pour les vraies urgences et les clients qui préfèrent appeler. Le reste se traite automatiquement.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Réservations 24h/24, 7j/7</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Un propriétaire qui découvre un problème à 22h ne va pas attendre le lendemain matin pour agir. Il va sur Google, trouve un entrepreneur disponible, et réserve immédiatement. Si votre portail est en ligne, vous captez ce client. Sinon, c&apos;est votre concurrent qui le prend.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Des interventions mieux documentées</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Quand l&apos;IA collecte les informations, elle pose les bonnes questions et les archive proprement. Votre technicien arrive chez le client en sachant exactement quel est le problème, où il se situe, et s&apos;il y a des notes particulières. Fini les &laquo; j&apos;ai noté quelque chose sur un bout de papier mais je ne le trouve plus &raquo;.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Image professionnelle</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Un portail de réservation en ligne donne une image professionnelle et moderne à votre entreprise. Le client voit que vous êtes organisé, accessible et à la page. C&apos;est un avantage compétitif important, surtout face aux entreprises qui fonctionnent encore uniquement par téléphone.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Comment mettre en place un portail de réservation</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Avec <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-semibold">Gestivio</Link>, l&apos;activation du portail de réservation IA prend environ 10 minutes:
            </p>
            <ol className="list-decimal pl-6 text-gray-600 space-y-2 mb-4">
              <li>Décrivez votre entreprise et vos services dans les paramètres du portail</li>
              <li>Configurez vos disponibilités et vos zones de service</li>
              <li>Personnalisez les questions que l&apos;assistant IA pose aux clients</li>
              <li>Copiez le lien et ajoutez-le à votre site web, vos réseaux sociaux et vos cartes d&apos;affaires</li>
              <li>Les réservations arrivent directement dans votre calendrier Gestivio</li>
            </ol>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Conclusion</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Un portail de réservation en ligne n&apos;est plus un luxe réservé aux grandes entreprises. C&apos;est un outil accessible qui vous fait gagner du temps, capte des clients 24h/24, et professionnalise votre image. Si vos concurrents ne l&apos;ont pas encore, c&apos;est votre chance de prendre une longueur d&apos;avance.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/blogue/gestion-interventions-terrain" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Guide gestion des interventions <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Voir nos plans <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Essayer Gestivio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">Activez votre portail de réservation IA</h2>
            <p className="text-indigo-100 mb-6">Gestivio inclut un portail de réservation propulsé par l&apos;IA. Configurez-le en 10 minutes.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 px-6 py-3 text-sm font-semibold hover:bg-indigo-50">
              Essai gratuit 14 jours <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </MarketingShell>
    </>
  )
}
