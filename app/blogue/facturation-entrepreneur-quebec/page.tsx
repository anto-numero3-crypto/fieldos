import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, User } from 'lucide-react'
import { buildMetadata } from '@/lib/seo'
import MarketingShell from '@/components/MarketingShell'
import JsonLd from '@/components/JsonLd'
import { articleSchema, breadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = buildMetadata({
  title: 'Facturation pour entrepreneurs au Québec : TPS, TVQ et obligations légales (2026)',
  description: "Guide complet sur la facturation pour entrepreneurs en services au Québec. TPS/TVQ, éléments obligatoires, délais, paiement en ligne et conformité Revenu Québec.",
  path: '/blogue/facturation-entrepreneur-quebec',
  locale: 'fr',
  type: 'article',
  publishedAt: '2026-02-20',
  keywords: ['facturation entrepreneur Québec', 'TPS TVQ facture', 'obligation facture Québec', 'Revenu Québec entrepreneur'],
})

export default function ArticleFacturation() {
  return (
    <>
      <JsonLd data={[
        articleSchema({
          headline: 'Facturation pour entrepreneurs au Québec : TPS, TVQ et obligations légales',
          description: "Guide complet sur la facturation pour entrepreneurs en services au Québec.",
          image: '/og-default.png',
          datePublished: '2026-02-20',
          dateModified: '2026-04-10',
          author: 'Gestivio',
          url: 'https://gestivio.ca/blogue/facturation-entrepreneur-quebec',
        }),
        breadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'Blogue', url: '/blogue' },
          { name: 'Facturation entrepreneur Québec', url: '/blogue/facturation-entrepreneur-quebec' },
        ]),
      ]} />

      <MarketingShell>
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> 20 février 2026</span>
            <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> Équipe Gestivio</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Facturation pour entrepreneurs au Québec : TPS, TVQ et obligations légales
          </h1>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            En tant qu&apos;entrepreneur en services au Québec, vous êtes tenu de respecter des règles précises en matière de facturation. Ce guide couvre les éléments obligatoires d&apos;une facture, la gestion de la TPS et de la TVQ, et les meilleures pratiques pour être payé rapidement.
          </p>

          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Les éléments obligatoires d&apos;une facture au Québec</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Revenu Québec et l&apos;Agence du revenu du Canada exigent que chaque facture contienne certaines informations. Voici les éléments essentiels que votre facture doit inclure:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Le nom et l&apos;adresse de votre entreprise</li>
              <li>Votre numéro de TPS (Taxe sur les produits et services) si votre chiffre d&apos;affaires dépasse 30 000 $ par an</li>
              <li>Votre numéro de TVQ (Taxe de vente du Québec)</li>
              <li>Le nom et l&apos;adresse du client</li>
              <li>Un numéro de facture unique et séquentiel</li>
              <li>La date de la facture</li>
              <li>La description des services rendus</li>
              <li>Le montant avant taxes</li>
              <li>Le montant de la TPS (5 %) et de la TVQ (9,975 %) affichés séparément</li>
              <li>Le montant total incluant les taxes</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">TPS et TVQ : comment ça fonctionne pour les entrepreneurs</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Si votre chiffre d&apos;affaires annuel dépasse 30 000 $, vous devez vous inscrire aux fichiers de la TPS et de la TVQ. Une fois inscrit, vous collectez les taxes sur vos ventes et vous les remettez à l&apos;ARC (TPS) et à Revenu Québec (TVQ). En contrepartie, vous pouvez déduire les taxes payées sur vos achats d&apos;entreprise via les CTI (crédits de taxe sur les intrants) et les RTI (remboursements de la taxe sur les intrants).
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              La TPS est actuellement de 5 %. La TVQ est de 9,975 %. Attention: la TVQ se calcule sur le montant avant taxes (et non sur le montant incluant la TPS), contrairement à ce que beaucoup d&apos;entrepreneurs croient. Le calcul correct est: Sous-total x 5 % = TPS, et Sous-total x 9,975 % = TVQ. Le total est Sous-total + TPS + TVQ.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Les erreurs courantes de facturation</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Voici les erreurs que nous observons le plus souvent chez les entrepreneurs en services:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li><strong>Oublier le numéro de TVQ sur la facture.</strong> Si vous êtes inscrit, il doit apparaître. L&apos;absence du numéro peut invalider la déduction de taxes pour votre client commercial.</li>
              <li><strong>Calculer la TVQ sur le montant incluant la TPS.</strong> C&apos;est une erreur fréquente qui gonfle artificiellement le montant de TVQ.</li>
              <li><strong>Ne pas numéroter les factures séquentiellement.</strong> Revenu Québec peut remettre en question votre comptabilité si vos numéros de factures sautent ou ne suivent pas un ordre logique.</li>
              <li><strong>Envoyer des factures en retard.</strong> Plus vous attendez pour facturer, plus le client prend du temps à payer. La règle d&apos;or: facturez le jour même de l&apos;intervention.</li>
              <li><strong>Ne pas offrir de paiement en ligne.</strong> En 2026, les clients s&apos;attendent à pouvoir payer par carte. Les entreprises qui offrent le paiement en ligne sont payées en moyenne 2 à 3 fois plus vite.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Les délais de remise des taxes</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              La fréquence de vos déclarations de taxes dépend de votre chiffre d&apos;affaires annuel. La plupart des petits entrepreneurs font des déclarations annuelles (chiffre d&apos;affaires de moins de 1 500 000 $). Les moyennes entreprises déclarent trimestriellement, et les grandes entreprises mensuellement.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Peu importe la fréquence, il est crucial de garder un registre précis de toutes vos factures et de vos dépenses d&apos;entreprise. Un logiciel de facturation qui archive automatiquement chaque transaction vous évite les mauvaises surprises lors de la déclaration.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Comment automatiser votre facturation</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Un logiciel comme <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-semibold">Gestivio</Link> automatise la majeure partie du processus de facturation:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Vos numéros de TPS et de TVQ sont configurés une seule fois. Les taxes sont calculées automatiquement sur chaque facture.</li>
              <li>Les numéros de facture sont générés séquentiellement, sans possibilité de doublon.</li>
              <li>Votre technicien peut convertir une intervention en facture directement depuis son téléphone, sur le chantier.</li>
              <li>Le client reçoit sa facture par courriel avec un bouton pour payer en ligne par carte bancaire via Stripe.</li>
              <li>Les factures impayées déclenchent des rappels automatiques après un délai configurable.</li>
              <li>À la fin de la période fiscale, vous pouvez exporter toutes vos factures en CSV pour votre comptable.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Le paiement en ligne: un avantage concurrentiel</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Les entrepreneurs qui offrent le paiement en ligne à leurs clients sont payés beaucoup plus rapidement. Avec un bouton &laquo; Payer maintenant &raquo; directement dans la facture par courriel, le client paie en quelques clics. L&apos;argent est déposé dans votre compte en 2 jours ouvrables via Stripe.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              C&apos;est particulièrement utile pour les services résidentiels. Le propriétaire reçoit la facture, clique, paie par carte, et vous n&apos;avez pas à courir après un chèque ou à faire du suivi par téléphone.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Conclusion</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Une facturation rigoureuse est la base d&apos;une entreprise de services rentable au Québec. Automatisez la TPS/TVQ, offrez le paiement en ligne, et gardez un registre complet de toutes vos transactions. Votre comptable, Revenu Québec et votre compte en banque vous remercieront.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Voir nos plans <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Essayer Gestivio <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/blogue/logiciel-plombier-quebec" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              Guide logiciel plombier <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">Facturez avec TPS/TVQ automatiquement</h2>
            <p className="text-indigo-100 mb-6">Gestivio calcule vos taxes, envoie vos factures et collecte les paiements en ligne.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 px-6 py-3 text-sm font-semibold hover:bg-indigo-50">
              Essai gratuit 14 jours <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </MarketingShell>
    </>
  )
}
