import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, User } from 'lucide-react'
import { buildMetadata } from '@/lib/seo'
import MarketingShell from '@/components/MarketingShell'
import JsonLd from '@/components/JsonLd'
import { articleSchema, breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = buildMetadata({
  title: 'Comment choisir un logiciel de gestion pour plombiers au Québec (2026)',
  description: "Guide complet pour choisir le meilleur logiciel de gestion pour votre entreprise de plomberie au Québec. Critères, comparaison et conseils d'expert.",
  path: '/blogue/logiciel-plombier-quebec',
  locale: 'fr',
  type: 'article',
  publishedAt: '2026-03-15',
  keywords: ['logiciel plombier Québec', 'meilleur logiciel plomberie', 'gestion plombier', 'logiciel entrepreneur plomberie'],
})

export default function ArticlePlombier() {
  return (
    <>
      <JsonLd data={[
        articleSchema({
          headline: 'Comment choisir un logiciel de gestion pour plombiers au Québec (2026)',
          description: "Guide complet pour choisir le meilleur logiciel de gestion pour votre entreprise de plomberie au Québec.",
          image: '/og-default.png',
          datePublished: '2026-03-15',
          dateModified: '2026-04-10',
          author: 'Gestivio',
          url: 'https://gestivio.ca/blogue/logiciel-plombier-quebec',
        }),
        breadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'Blogue', url: '/blogue' },
          { name: 'Logiciel plombier Québec', url: '/blogue/logiciel-plombier-quebec' },
        ]),
      ]} />

      <MarketingShell>
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> 15 mars 2026</span>
            <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> Équipe Gestivio</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Comment choisir un logiciel de gestion pour plombiers au Québec en 2026
          </h1>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            Vous êtes plombier au Québec et vous cherchez un logiciel pour organiser vos appels de service, vos factures et vos techniciens ? Ce guide vous aide à faire le bon choix.
          </p>

          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Pourquoi un logiciel de gestion est devenu essentiel pour les plombiers</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Le métier de plombier au Québec a beaucoup changé. Il y a 10 ans, un carnet de commandes, un téléphone et un paquet de factures en papier suffisaient. Aujourd&apos;hui, les clients veulent réserver en ligne, recevoir leur facture par courriel et payer par carte. Vos concurrents offrent déjà tout ça. Si vous ne le faites pas, vous perdez des contrats.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Un logiciel de gestion pour plombiers n&apos;est pas un luxe — c&apos;est un investissement qui se paie tout seul en quelques semaines. Moins de temps passé sur la paperasse, plus de temps sur le terrain. Moins de factures impayées, plus de revenus. Moins d&apos;appels manqués, plus de clients satisfaits.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Les 7 critères essentiels pour un plombier québécois</h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Gestion de la TPS et de la TVQ</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              C&apos;est le critère numéro un. Beaucoup de logiciels américains (comme Jobber ou Housecall Pro) ne gèrent pas nativement la TVQ du Québec. Vous devez soit la calculer manuellement, soit bidouiller le système avec des taux de taxe personnalisés. Un bon logiciel québécois applique la TPS (5 %) et la TVQ (9,975 %) automatiquement sur chaque facture, conformément aux règles de Revenu Québec.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Interface en français</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vos techniciens travaillent en français. Vos clients reçoivent des factures en français. Votre logiciel devrait fonctionner en français aussi. Cherchez un outil nativement bilingue FR/EN, pas un logiciel anglais avec une traduction automatique approximative.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Répartition des appels de service</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              En plomberie, les urgences sont fréquentes. Un tuyau qui éclate ne peut pas attendre. Votre logiciel doit permettre de créer un appel de service en quelques secondes, de l&apos;assigner au technicien le plus proche, et d&apos;envoyer toutes les informations (adresse, type de problème, historique) directement sur son téléphone.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Facturation sur le terrain</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Le technicien termine l&apos;intervention, crée la facture sur son téléphone, et le client reçoit un courriel avec un bouton pour payer en ligne. Fini les factures papier qui se perdent dans la camionnette. Fini les 30-60-90 jours de retard de paiement. Le paiement arrive en 2 jours ouvrables.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Historique client et équipement</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Quand vous retournez chez un client, vous devez savoir ce qui a été fait la dernière fois. Quel robinet a été installé ? Quelle pièce a été remplacée ? Y a-t-il encore une garantie ? Un bon logiciel conserve tout l&apos;historique par adresse et par client, accessible en un clic.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Conformité RBQ</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              La Régie du bâtiment du Québec (RBQ) exige des entrepreneurs qu&apos;ils conservent des registres de leurs travaux. Un logiciel qui archive automatiquement chaque intervention, chaque facture et chaque photo de chantier vous simplifie la vie en cas d&apos;audit ou de réclamation.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Hébergement des données au Canada</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Depuis l&apos;entrée en vigueur de la Loi 25 au Québec, la protection des renseignements personnels est devenue un enjeu sérieux. Assurez-vous que votre logiciel héberge les données au Canada et respecte la LPRPDE et la Loi 25. Vos clients vous font confiance avec leurs adresses, leurs coordonnées et leurs informations de paiement.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Comparaison rapide des options disponibles</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Plusieurs logiciels de gestion de services terrain sont disponibles au Québec. Les plus connus sont Jobber (canadien, basé en Alberta, interface principalement en anglais), ProgressionLIVE (québécois, axé sur la gestion de flotte et les grandes entreprises) et Gestivio (québécois, bilingue, conçu pour les PME de 1 à 25 employés).
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Le choix dépend de la taille de votre entreprise, de vos besoins spécifiques et de votre budget. Pour un plombier indépendant ou une petite entreprise de 2 à 10 employés, Gestivio offre le meilleur rapport qualité-prix avec une interface française native, la TPS/TVQ automatique, et un portail de réservation IA qui travaille pour vous 24h/24.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Combien ça coûte ?</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Les prix varient de 39 $ à 200 $ CAD par mois selon le logiciel et le nombre d&apos;utilisateurs. Gestivio commence à 39 $/mois pour un utilisateur (plan Démarrage), avec le plan Pro à 79 $/mois pour jusqu&apos;à 5 utilisateurs. La plupart des logiciels offrent un essai gratuit de 7 à 14 jours pour vous permettre de tester avant de vous engager.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Conclusion</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Choisir un logiciel de gestion est une décision importante pour votre entreprise de plomberie. Priorisez la gestion TPS/TVQ native, l&apos;interface en français, la facturation mobile et l&apos;hébergement au Canada. Essayez les options qui vous intéressent pendant leur période d&apos;essai gratuit, et impliquez vos techniciens dans le choix — ce sont eux qui l&apos;utiliseront au quotidien.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Voir nos plans <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/vs/jobber" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Gestivio vs Jobber <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/blogue/facturation-entrepreneur-quebec" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Guide facturation TPS/TVQ <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">Essayez Gestivio gratuitement</h2>
            <p className="text-indigo-100 mb-6">14 jours d&apos;essai gratuit. Aucune carte de crédit requise.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 px-6 py-3 text-sm font-semibold hover:bg-indigo-50">
              Commencer l&apos;essai gratuit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </MarketingShell>
    </>
  )
}
