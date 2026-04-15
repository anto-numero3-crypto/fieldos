'use client'

import Link from 'next/link'
import { Wrench } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function TermsPage() {
  const { lang } = useLanguage()
  const lastUpdated = lang === 'fr' ? '1 avril 2026' : 'April 1, 2026'

  return (
    <div className="min-h-screen bg-white">
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <LanguageToggle />
      </div>

      <nav className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
              <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-gray-900">Gestivio</span>
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">
          {lang === 'fr' ? 'Juridique' : 'Legal'}
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {lang === 'fr' ? 'Conditions d\'utilisation' : 'Terms of Service'}
        </h1>
        <p className="text-sm text-gray-400 mb-12">
          {lang === 'fr' ? 'Dernière mise à jour : ' : 'Last updated: '}{lastUpdated}
        </p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '1. Acceptation des conditions' : '1. Acceptance of Terms'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'En accédant ou en utilisant Gestivio (« le Service ») exploité par Gestivio Inc. (« l\'Entreprise »), vous acceptez d\'être lié par ces conditions d\'utilisation. Si vous n\'acceptez pas ces conditions, n\'utilisez pas le Service. Ces conditions constituent un accord juridiquement contraignant entre vous et Gestivio Inc., régi par les lois de la province de Québec et les lois du Canada qui s\'y appliquent.'
                : 'By accessing or using Gestivio ("the Service") operated by Gestivio Inc. ("Company"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. These terms constitute a legally binding agreement between you and Gestivio Inc., governed by the laws of the Province of Québec and the laws of Canada applicable therein.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '2. Description du service' : '2. Description of Service'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Gestivio est une plateforme infonuagique de gestion de services sur le terrain qui fournit des outils pour gérer les clients, les contrats, les factures, la planification, la gestion d\'équipe et les analyses d\'affaires. Le Service est destiné aux entreprises de services sur le terrain et à leurs employés.'
                : 'Gestivio is a cloud-based field service management platform that provides tools for managing customers, jobs, invoices, scheduling, team management, and business analytics. The Service is intended for use by field service businesses and their employees.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '3. Création de compte' : '3. Account Registration'}
            </h2>
            <p>
              {lang === 'fr' ? 'Vous devez créer un compte pour utiliser le Service. Vous acceptez de :' : 'You must register for an account to use the Service. You agree to:'}
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              {lang === 'fr' ? (
                <>
                  <li>Fournir des informations exactes, actuelles et complètes lors de l&apos;inscription</li>
                  <li>Maintenir la sécurité de votre mot de passe et de vos identifiants</li>
                  <li>Nous aviser immédiatement de tout accès non autorisé</li>
                  <li>Être responsable de toute activité sous votre compte</li>
                  <li>Ne pas partager vos identifiants avec d&apos;autres</li>
                </>
              ) : (
                <>
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain the security of your password and account credentials</li>
                  <li>Notify us immediately of any unauthorized account access</li>
                  <li>Be responsible for all activity that occurs under your account</li>
                  <li>Not share your account credentials with others</li>
                </>
              )}
            </ul>
            <p className="mt-3">
              {lang === 'fr'
                ? 'Les comptes sont destinés aux individus et aux entreprises, non à la revente. Vous devez avoir au moins 18 ans pour créer un compte.'
                : 'Accounts are for individuals and businesses, not for resale. You must be at least 18 years of age to create an account.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '4. Abonnement et paiements' : '4. Subscription and Payments'}
            </h2>
            <p>
              {lang === 'fr' ? 'Gestivio offre des plans d\'abonnement payants. En choisissant un plan payant, vous acceptez de :' : 'Gestivio offers paid subscription plans. By selecting a paid plan, you agree to:'}
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              {lang === 'fr' ? (
                <>
                  <li>Payer tous les frais associés à votre plan</li>
                  <li>Fournir des informations de paiement valides via notre processeur (Stripe)</li>
                  <li>Le renouvellement automatique de votre abonnement à la fin de chaque période de facturation sauf annulation</li>
                </>
              ) : (
                <>
                  <li>Pay all fees associated with your selected plan</li>
                  <li>Provide valid payment information via our payment processor (Stripe)</li>
                  <li>Automatic renewal of your subscription at the end of each billing period unless cancelled</li>
                </>
              )}
            </ul>
            <p className="mt-3">
              {lang === 'fr'
                ? 'Tous les frais sont en dollars canadiens (CAD) et excluent les taxes applicables (TPS/TVQ). Vous êtes responsable de toutes les taxes applicables.'
                : 'All fees are in Canadian dollars (CAD) and exclude applicable taxes (GST/QST). You are responsible for all applicable taxes.'}
            </p>
            <p className="mt-3">
              <strong>{lang === 'fr' ? 'Remboursements : ' : 'Refunds: '}</strong>
              {lang === 'fr'
                ? 'Nous offrons un essai gratuit de 14 jours. Après l\'essai, les paiements d\'abonnement ne sont pas remboursables sauf si requis par la loi applicable. Si vous croyez qu\'un frais a été prélevé par erreur, contactez billing@gestivio.ca dans les 30 jours.'
                : 'We offer a 14-day free trial. After the trial, subscription payments are non-refundable except as required by applicable law. If you believe a charge was made in error, contact billing@gestivio.ca within 30 days.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '5. Utilisation acceptable' : '5. Acceptable Use'}
            </h2>
            <p>{lang === 'fr' ? 'Vous acceptez de ne pas utiliser le Service pour :' : 'You agree not to use the Service to:'}</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              {lang === 'fr' ? (
                <>
                  <li>Violer des lois ou règlements applicables</li>
                  <li>Porter atteinte aux droits de propriété intellectuelle</li>
                  <li>Transmettre du pourriel, des communications non sollicitées ou des logiciels malveillants</li>
                  <li>Tenter d&apos;obtenir un accès non autorisé à nos systèmes</li>
                  <li>Usurper l&apos;identité d&apos;une personne ou entité</li>
                  <li>Collecter ou récolter des données sur d&apos;autres utilisateurs</li>
                  <li>Utiliser le Service à des fins autres que la gestion de votre entreprise de services légitime</li>
                </>
              ) : (
                <>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe any intellectual property rights</li>
                  <li>Transmit spam, unsolicited communications, or malware</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Impersonate any person or entity</li>
                  <li>Collect or harvest data about other users</li>
                  <li>Use the Service for any purpose other than managing your legitimate field service business</li>
                </>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '6. Propriété des données' : '6. Data Ownership'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Vous conservez la propriété de toutes les données que vous saisissez dans le Service (« Données client »). Vous accordez à Gestivio une licence limitée d\'utiliser, stocker et traiter les Données client uniquement pour fournir le Service. Nous n\'utiliserons pas vos Données client à d\'autres fins sans votre consentement.'
                : 'You retain ownership of all data you input into the Service ("Customer Data"). You grant Gestivio a limited license to use, store, and process Customer Data solely to provide the Service. We will not use your Customer Data for any other purpose without your consent.'}
            </p>
            <p className="mt-3">
              {lang === 'fr'
                ? 'Lors de la résiliation du compte, vous pouvez exporter vos données. Nous conserverons les sauvegardes pendant 30 jours après la fermeture, puis supprimerons vos données.'
                : 'Upon account termination, you may export your data. We will retain backups for 30 days after account closure, then delete your data.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '7. Propriété intellectuelle' : '7. Intellectual Property'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Gestivio et ses concédants de licence possèdent tous les droits, titres et intérêts dans le Service, y compris tous les logiciels, designs, contenus et marques de commerce. Ces conditions ne vous accordent aucun droit sur notre propriété intellectuelle, sauf tel que prévu.'
                : 'Gestivio and its licensors own all right, title, and interest in the Service, including all software, designs, content, and trademarks. These Terms do not grant you any rights to our intellectual property except as expressly stated.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '8. Disponibilité du service' : '8. Service Availability'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Nous visons une haute disponibilité mais ne pouvons garantir un service ininterrompu. Nous pouvons suspendre ou résilier le Service pour maintenance, sécurité ou autres raisons commerciales. Nous ne sommes pas responsables des pertes découlant d\'interruptions de service.'
                : 'We strive for high availability but cannot guarantee uninterrupted service. We may suspend or terminate the Service for maintenance, security, or other business reasons. We are not liable for any losses arising from service interruptions.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '9. Limitation de responsabilité' : '9. Limitation of Liability'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'DANS LA MESURE MAXIMALE AUTORISÉE PAR LA LOI APPLICABLE, GESTIVIO NE SERA PAS RESPONSABLE DES DOMMAGES INDIRECTS, ACCESSOIRES, SPÉCIAUX, CONSÉCUTIFS OU PUNITIFS, Y COMPRIS LA PERTE DE PROFITS, DE DONNÉES OU D\'OPPORTUNITÉS COMMERCIALES, DÉCOULANT DE OU LIÉS À VOTRE UTILISATION DU SERVICE.'
                : 'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, GESTIVIO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.'}
            </p>
            <p className="mt-3">
              {lang === 'fr'
                ? 'NOTRE RESPONSABILITÉ TOTALE N\'EXCÉDERA PAS LE MONTANT QUE VOUS NOUS AVEZ PAYÉ AU COURS DES 12 MOIS PRÉCÉDANT LA RÉCLAMATION.'
                : 'OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '10. Indemnisation' : '10. Indemnification'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Vous acceptez d\'indemniser et de dégager Gestivio de toute responsabilité concernant les réclamations, dommages ou dépenses découlant de votre utilisation du Service, de votre violation de ces conditions ou de votre violation des droits de tiers.'
                : 'You agree to indemnify and hold Gestivio harmless from any claims, damages, or expenses arising from your use of the Service, your violation of these Terms, or your violation of any third-party rights.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '11. Résiliation' : '11. Termination'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'L\'une ou l\'autre des parties peut résilier cet accord à tout moment. Vous pouvez annuler votre abonnement depuis la plateforme. Nous pouvons résilier votre accès en cas de violation de ces conditions, avec préavis lorsque raisonnablement possible.'
                : 'Either party may terminate this agreement at any time. You may cancel your subscription from within the platform. We may terminate your access for violation of these Terms, with notice where reasonably practicable.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '12. Loi applicable et différends' : '12. Governing Law and Disputes'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Ces conditions sont régies par les lois du Québec et du Canada. Tout différend sera résolu devant les tribunaux du Québec, Canada. Vous renoncez à toute objection à la compétence exclusive de ces tribunaux.'
                : 'These Terms are governed by the laws of Québec and Canada. Any disputes shall be resolved in the courts of Québec, Canada. You waive any objection to the exclusive jurisdiction of these courts.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '13. Modifications aux conditions' : '13. Changes to Terms'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Nous pouvons mettre à jour ces conditions périodiquement. Les changements importants seront communiqués par courriel au moins 30 jours avant leur prise d\'effet. L\'utilisation continue après la date d\'entrée en vigueur constitue l\'acceptation des conditions mises à jour.'
                : 'We may update these Terms periodically. Material changes will be communicated via email at least 30 days before taking effect. Continued use after the effective date constitutes acceptance of the updated Terms.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '14. Contact' : '14. Contact'}
            </h2>
            <div className="rounded-xl bg-gray-50 p-4 space-y-1">
              <p><strong>Gestivio Inc.</strong></p>
              <p>{lang === 'fr' ? 'Courriel : ' : 'Email: '}legal@gestivio.ca</p>
              <p>{lang === 'fr' ? 'Adresse : Québec, Canada' : 'Address: Québec, Canada'}</p>
            </div>
          </section>
        </div>
      </div>
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. <Link href="/" className="hover:text-gray-600">{lang === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}</Link></p>
      </footer>
    </div>
  )
}
