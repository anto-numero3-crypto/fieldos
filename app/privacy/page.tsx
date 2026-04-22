'use client'

import Link from 'next/link'
import GestivioLogo from '@/components/GestivioLogo'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function PrivacyPage() {
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
            <GestivioLogo />
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">
          {lang === 'fr' ? 'Juridique' : 'Legal'}
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {lang === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy'}
        </h1>
        <p className="text-sm text-gray-400 mb-12">
          {lang === 'fr' ? 'Dernière mise à jour : ' : 'Last updated: '}{lastUpdated}
        </p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '1. Introduction' : '1. Introduction'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Gestivio Inc. (« Gestivio », « nous », « notre » ou « nos ») s\'engage à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos renseignements personnels lorsque vous utilisez notre plateforme à gestivio.ca et les services connexes.'
                : 'Gestivio Inc. ("Gestivio", "we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our platform at gestivio.ca and related services.'}
            </p>
            <p className="mt-3">
              {lang === 'fr'
                ? <>Nous nous conformons à la <strong>Loi sur la protection des renseignements personnels et les documents électroniques (LPRPDE)</strong>, la loi fédérale canadienne sur la vie privée dans le secteur privé, ainsi qu\'aux lois provinciales applicables, incluant la <strong>Loi 25 du Québec (Loi sur la protection des renseignements personnels dans le secteur privé)</strong>.</>
                : <>We comply with the <strong>Personal Information Protection and Electronic Documents Act (PIPEDA)</strong>, Canada&apos;s federal private sector privacy law, as well as applicable provincial privacy laws including Québec&apos;s <strong>Law 25 (Act Respecting the Protection of Personal Information in the Private Sector)</strong>.</>}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '2. Renseignements que nous collectons' : '2. Information We Collect'}
            </h2>
            <p className="font-semibold text-gray-800 mb-2">
              {lang === 'fr' ? '2.1 Renseignements que vous fournissez directement :' : '2.1 Information you provide directly:'}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {lang === 'fr' ? (
                <>
                  <li>Informations d&apos;inscription : nom, adresse courriel, mot de passe</li>
                  <li>Informations commerciales : nom de l&apos;entreprise, adresse, numéro de téléphone, types de services</li>
                  <li>Données clients que vous saisissez : noms, courriels, adresses, historique de service</li>
                  <li>Informations financières : montants de facture, dossiers de paiement (nous ne stockons pas les numéros de carte de crédit — les paiements sont traités par Stripe)</li>
                  <li>Communications envoyées via notre plateforme</li>
                </>
              ) : (
                <>
                  <li>Account registration information: name, email address, password</li>
                  <li>Business information: company name, address, phone number, service types</li>
                  <li>Customer data you enter: names, emails, addresses, service history</li>
                  <li>Financial information: invoice amounts, payment records (we do not store credit card numbers — payments are processed by Stripe)</li>
                  <li>Communications you send through our platform</li>
                </>
              )}
            </ul>
            <p className="font-semibold text-gray-800 mb-2 mt-4">
              {lang === 'fr' ? '2.2 Renseignements collectés automatiquement :' : '2.2 Information collected automatically:'}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {lang === 'fr' ? (
                <>
                  <li>Données de journalisation : adresses IP, type de navigateur, pages visitées, horodatages</li>
                  <li>Informations sur l&apos;appareil : type d&apos;appareil, système d&apos;exploitation</li>
                  <li>Données d&apos;utilisation : fonctionnalités utilisées, clics, durée des sessions</li>
                  <li>Témoins (cookies) et technologies de suivi similaires (voir notre politique sur les témoins)</li>
                </>
              ) : (
                <>
                  <li>Log data: IP addresses, browser type, pages visited, timestamps</li>
                  <li>Device information: device type, operating system</li>
                  <li>Usage data: features used, clicks, session duration</li>
                  <li>Cookies and similar tracking technologies (see our Cookie Policy)</li>
                </>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '3. Utilisation de vos renseignements' : '3. How We Use Your Information'}
            </h2>
            <p>{lang === 'fr' ? 'Nous utilisons vos renseignements pour :' : 'We use your information to:'}</p>
            <ul className="list-disc pl-5 space-y-1">
              {lang === 'fr' ? (
                <>
                  <li>Fournir, exploiter et améliorer nos services</li>
                  <li>Traiter les transactions et envoyer les communications de facturation</li>
                  <li>Fournir un soutien à la clientèle</li>
                  <li>Envoyer des mises à jour de service, des alertes de sécurité et des messages administratifs</li>
                  <li>Envoyer des communications marketing (uniquement avec votre consentement explicite)</li>
                  <li>Respecter les obligations légales</li>
                  <li>Analyser les habitudes d&apos;utilisation pour améliorer notre plateforme</li>
                  <li>Alimenter les fonctionnalités d&apos;IA, incluant notre assistant d&apos;intelligence d&apos;affaires et de réservation</li>
                </>
              ) : (
                <>
                  <li>Provide, operate, and improve our services</li>
                  <li>Process transactions and send billing communications</li>
                  <li>Provide customer support</li>
                  <li>Send service updates, security alerts, and administrative messages</li>
                  <li>Send marketing communications (only with your explicit consent)</li>
                  <li>Comply with legal obligations</li>
                  <li>Analyze usage patterns to improve our platform</li>
                  <li>Power AI features including our business intelligence and booking assistant</li>
                </>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '4. IA et traitement des données' : '4. AI and Data Processing'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Gestivio utilise des fonctionnalités d\'intelligence artificielle alimentées par l\'API Claude d\'Anthropic. Lorsque vous utilisez les fonctionnalités d\'IA, vos données commerciales (descriptions de contrats, noms de clients, sommaires de factures) peuvent être traitées par ces systèmes d\'IA pour générer des réponses. Nous n\'utilisons pas vos données pour entraîner les modèles d\'IA. Le traitement par IA est soumis à la politique de confidentialité d\'Anthropic.'
                : 'Gestivio uses artificial intelligence features powered by Anthropic\'s Claude API. When you use AI features, your business data (job descriptions, customer names, invoice summaries) may be processed by these AI systems to generate responses. We do not use your data to train AI models. AI processing is subject to Anthropic\'s privacy policy.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '5. Partage de vos renseignements' : '5. Sharing Your Information'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Nous ne vendons pas vos renseignements personnels. Nous partageons des renseignements uniquement avec :'
                : 'We do not sell your personal information. We share information only with:'}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {lang === 'fr' ? (
                <>
                  <li><strong>Prestataires de services :</strong> Supabase (hébergement de base de données), Stripe (paiements), Resend (livraison de courriels), Anthropic (IA), Vercel (hébergement)</li>
                  <li><strong>Exigences légales :</strong> Lorsque la loi, une ordonnance du tribunal ou une autorité gouvernementale l&apos;exige</li>
                  <li><strong>Transferts d&apos;entreprise :</strong> Dans le cadre d&apos;une fusion, acquisition ou vente d&apos;actifs, avec avis à vous</li>
                </>
              ) : (
                <>
                  <li><strong>Service providers:</strong> Supabase (database hosting), Stripe (payments), Resend (email delivery), Anthropic (AI), Vercel (hosting)</li>
                  <li><strong>Legal requirements:</strong> When required by law, court order, or governmental authority</li>
                  <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets, with notice to you</li>
                </>
              )}
            </ul>
            <p className="mt-3">
              {lang === 'fr'
                ? 'Tous les prestataires de services tiers sont contractuellement tenus de maintenir des normes appropriées de protection des données.'
                : 'All third-party service providers are contractually required to maintain appropriate data protection standards.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '6. Stockage et sécurité des données' : '6. Data Storage and Security'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Vos données sont stockées sur l\'infrastructure Supabase, hébergée sur AWS au Canada ou aux États-Unis. Nous mettons en œuvre des mesures de sécurité conformes aux normes de l\'industrie, incluant :'
                : 'Your data is stored on Supabase infrastructure, hosted on AWS in Canada or the United States. We implement industry-standard security measures including:'}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {lang === 'fr' ? (
                <>
                  <li>Chiffrement TLS/SSL pour toutes les données en transit</li>
                  <li>Chiffrement AES-256 pour les données au repos</li>
                  <li>Sécurité au niveau des rangées (row-level security) s&apos;assurant que les utilisateurs accèdent seulement à leurs données</li>
                  <li>Sauvegardes automatisées régulières</li>
                  <li>Contrôles d&apos;accès et exigences d&apos;authentification</li>
                </>
              ) : (
                <>
                  <li>TLS/SSL encryption for all data in transit</li>
                  <li>AES-256 encryption for data at rest</li>
                  <li>Row-level security ensuring users can only access their own data</li>
                  <li>Regular automated backups</li>
                  <li>Access controls and authentication requirements</li>
                </>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '7. Conservation des données' : '7. Data Retention'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Nous conservons vos renseignements personnels aussi longtemps que votre compte est actif ou tant que nécessaire pour fournir les services. Après la suppression du compte, nous supprimons vos données dans les 30 jours, sauf lorsque la conservation est requise par la loi (par exemple, les dossiers fiscaux peuvent être conservés pendant 7 ans, tel qu\'exigé par l\'Agence du revenu du Canada).'
                : 'We retain your personal information for as long as your account is active or as needed to provide services. Upon account deletion, we delete your data within 30 days, except where retention is required by law (e.g., tax records may be retained for 7 years as required by the Canada Revenue Agency).'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '8. Vos droits sous la LPRPDE' : '8. Your Rights Under PIPEDA'}
            </h2>
            <p>{lang === 'fr' ? 'Vous avez le droit de :' : 'You have the right to:'}</p>
            <ul className="list-disc pl-5 space-y-1">
              {lang === 'fr' ? (
                <>
                  <li><strong>Accès :</strong> Demander une copie des renseignements personnels que nous détenons sur vous</li>
                  <li><strong>Correction :</strong> Demander la correction de renseignements inexacts</li>
                  <li><strong>Retrait du consentement :</strong> Retirer le consentement pour le traitement optionnel à tout moment</li>
                  <li><strong>Plainte :</strong> Déposer une plainte au Commissariat à la protection de la vie privée du Canada</li>
                </>
              ) : (
                <>
                  <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Withdrawal of consent:</strong> Withdraw consent for optional processing at any time</li>
                  <li><strong>Complaint:</strong> Lodge a complaint with the Office of the Privacy Commissioner of Canada</li>
                </>
              )}
            </ul>
            <p className="mt-3">
              {lang === 'fr'
                ? <>Pour exercer ces droits, contactez-nous à <strong>support@gestivio.ca</strong>. Nous répondrons dans les 30 jours.</>
                : <>To exercise these rights, contact us at <strong>support@gestivio.ca</strong>. We will respond within 30 days.</>}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '9. Témoins (cookies)' : '9. Cookies'}
            </h2>
            <p>
              {lang === 'fr'
                ? <>Nous utilisons des témoins essentiels pour l&apos;authentification et la gestion de session, ainsi que des témoins d&apos;analyse optionnels pour améliorer notre service. Consultez notre <Link href="/cookies" className="text-indigo-600 hover:underline">politique sur les témoins</Link> pour plus de détails.</>
                : <>We use essential cookies for authentication and session management, and optional analytics cookies to improve our service. See our <Link href="/cookies" className="text-indigo-600 hover:underline">Cookie Policy</Link> for details.</>}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '10. Vie privée des enfants' : '10. Children\'s Privacy'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Gestivio ne s\'adresse pas aux personnes de moins de 18 ans. Nous ne collectons pas sciemment de renseignements personnels auprès d\'enfants.'
                : 'Gestivio is not directed at individuals under 18 years of age. We do not knowingly collect personal information from children.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '11. Modifications à cette politique' : '11. Changes to This Policy'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Nous pouvons mettre à jour cette politique de confidentialité périodiquement. Les changements importants seront communiqués par courriel ou par avis en évidence sur notre plateforme au moins 30 jours avant leur prise d\'effet.'
                : 'We may update this Privacy Policy periodically. Material changes will be communicated via email or prominent notice on our platform at least 30 days before taking effect.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? '12. Nous contacter' : '12. Contact Us'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Pour les questions liées à la vie privée ou pour exercer vos droits :'
                : 'For privacy-related questions or to exercise your rights:'}
            </p>
            <div className="mt-3 rounded-xl bg-gray-50 p-4 space-y-1">
              <p><strong>{lang === 'fr' ? 'Responsable de la vie privée, Gestivio Inc.' : 'Privacy Officer, Gestivio Inc.'}</strong></p>
              <p>{lang === 'fr' ? 'Courriel : ' : 'Email: '}support@gestivio.ca</p>
              <p>{lang === 'fr' ? 'Adresse : Québec, Canada' : 'Address: Québec, Canada'}</p>
            </div>
            <p className="mt-3">
              {lang === 'fr'
                ? <>Si vous n&apos;êtes pas satisfait de notre réponse, vous pouvez contacter le <strong>Commissariat à la protection de la vie privée du Canada</strong> à priv.gc.ca.</>
                : <>If you are not satisfied with our response, you may contact the <strong>Office of the Privacy Commissioner of Canada</strong> at priv.gc.ca.</>}
            </p>
          </section>
        </div>
      </div>
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. <Link href="/" className="hover:text-gray-600">{lang === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}</Link></p>
      </footer>
    </div>
  )
}
