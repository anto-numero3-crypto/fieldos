'use client'

import Link from 'next/link'
import { Wrench, BookOpen, MessageCircle, Mail, ChevronDown, Zap, Users, FileText, CreditCard, Settings, Briefcase } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function SupportPage() {
  const { lang } = useLanguage()

  const faqs = [
    {
      category: lang === 'fr' ? 'Démarrage' : 'Getting Started',
      icon: Zap,
      questions: lang === 'fr' ? [
        { q: 'Comment démarrer mon essai gratuit ?', a: 'Cliquez simplement sur « Commencer » sur notre page d\'accueil, créez votre compte avec votre adresse courriel et vous serez automatiquement inscrit à l\'essai gratuit de 14 jours. Aucune carte de crédit requise.' },
        { q: 'Comment importer mes clients existants ?', a: 'Allez à Clients → cliquez sur le bouton Importer CSV et téléversez votre fichier. Gestivio prend en charge l\'importation CSV depuis QuickBooks, HubSpot, Jobber et d\'autres plateformes. Vous pouvez aussi ajouter des clients manuellement ou via l\'assistant IA.' },
        { q: 'Puis-je essayer Gestivio avant de m\'inscrire ?', a: 'Oui ! Visitez /book sur notre site pour essayer le portail de réservation IA en mode démo. Pour la plateforme complète, inscrivez-vous à l\'essai gratuit de 14 jours.' },
      ] : [
        { q: 'How do I start my free trial?', a: 'Simply click "Get started" on our homepage, create your account with your email address, and you\'ll be automatically enrolled in the 14-day free trial. No credit card required.' },
        { q: 'How do I import my existing customers?', a: 'Go to Customers → click the Import CSV button and upload your file. Gestivio supports CSV imports from QuickBooks, HubSpot, Jobber, and other platforms. You can also add customers manually or through the AI assistant.' },
        { q: 'Can I try Gestivio before signing up?', a: 'Yes! Visit /book on our website to try the AI booking portal in demo mode. For the full platform, sign up for the free 14-day trial.' },
      ],
    },
    {
      category: lang === 'fr' ? 'Contrats et planification' : 'Jobs & Scheduling',
      icon: Briefcase,
      questions: lang === 'fr' ? [
        { q: 'Comment créer un nouveau contrat ?', a: 'Allez à Contrats et cliquez sur « Nouveau contrat », ou utilisez l\'assistant IA et dites « Créer un contrat pour [nom du client] ». Remplissez le type de service, la date et attribuez-le à un membre de l\'équipe.' },
        { q: 'Les clients peuvent-ils réserver eux-mêmes ?', a: 'Oui ! Partagez le lien de votre portail de réservation (/book?biz=VOTRE_ID) avec les clients ou intégrez-le à votre site. L\'assistant IA de réservation gère toute la conversation de planification.' },
        { q: 'Puis-je configurer des contrats récurrents ?', a: 'Oui. Dans le détail d\'un contrat, cliquez sur « Rendre récurrent » et choisissez la fréquence (hebdomadaire, bimensuelle, mensuelle, trimestrielle ou annuelle). Les contrats récurrents génèrent automatiquement les prochaines occurrences et peuvent être facturés en lot.' },
      ] : [
        { q: 'How do I create a new job?', a: 'Go to Jobs and click the "New Job" button, or use the AI assistant and say "Create a job for [customer name]". Fill in the service type, date, and assign it to a team member.' },
        { q: 'Can customers book appointments themselves?', a: 'Yes! Share your booking portal link (/book?biz=YOUR_ID) with customers, or embed it on your website. The AI booking assistant handles the entire scheduling conversation.' },
        { q: 'Can I set recurring jobs?', a: 'Yes. From the job detail page, click "Make recurring" and choose your frequency (weekly, bi-weekly, monthly, quarterly, or yearly). Recurring jobs auto-generate the next occurrence and can be batch-invoiced.' },
      ],
    },
    {
      category: lang === 'fr' ? 'Factures et paiements' : 'Invoices & Payments',
      icon: CreditCard,
      questions: lang === 'fr' ? [
        { q: 'Comment accepter les paiements en ligne ?', a: 'Connectez votre compte Stripe dans Paramètres → Facturation. Une fois connecté, chaque facture aura un bouton « Payer maintenant » qui dirige les clients vers une page de paiement Stripe sécurisée.' },
        { q: 'Quelles devises Gestivio prend-il en charge ?', a: 'Gestivio prend en charge le CAD, l\'USD, l\'EUR et le GBP. La devise de facturation peut être définie par client dans les paramètres du compte client, et les rapports peuvent être consolidés dans votre devise de référence.' },
        { q: 'Puis-je envoyer des rappels de facture automatiquement ?', a: 'Oui. Dans Paramètres → Facturation, activez les rappels automatiques et configurez la cadence (par exemple : 3 jours avant l\'échéance, le jour de l\'échéance, 7 jours en retard, 14 jours en retard). Chaque rappel peut être personnalisé avec votre propre texte et votre signature.' },
      ] : [
        { q: 'How do I accept online payments?', a: 'Connect your Stripe account in Settings → Billing. Once connected, every invoice will have a "Pay Now" button that sends customers to a secure Stripe checkout page.' },
        { q: 'What currency does Gestivio support?', a: 'Gestivio supports CAD, USD, EUR, and GBP. Billing currency can be set per customer in the customer record, and reports can be consolidated in your reporting currency.' },
        { q: 'Can I send invoice reminders automatically?', a: 'Yes. In Settings → Billing, enable automated reminders and configure the cadence (e.g. 3 days before due, on due date, 7 days overdue, 14 days overdue). Each reminder can be customized with your own copy and signature.' },
      ],
    },
    {
      category: lang === 'fr' ? 'Gestion d\'équipe' : 'Team Management',
      icon: Users,
      questions: lang === 'fr' ? [
        { q: 'Comment inviter des membres d\'équipe ?', a: 'Allez à Équipe → cliquez sur « Inviter un membre » et saisissez son adresse courriel. Il recevra une invitation à rejoindre votre compte Gestivio.' },
        { q: 'Puis-je contrôler ce que voient les membres d\'équipe ?', a: 'Oui. Gestivio offre quatre rôles : Propriétaire (accès complet), Administrateur (tout sauf facturation), Répartiteur (contrats et horaire) et Technicien (uniquement les contrats qui lui sont assignés). Les rôles se gèrent dans Équipe → Membre → Permissions.' },
      ] : [
        { q: 'How do I invite team members?', a: 'Go to Team → click "Invite member" and enter their email address. They\'ll receive an invitation to join your Gestivio account.' },
        { q: 'Can I control what team members can see?', a: 'Yes. Gestivio offers four roles: Owner (full access), Admin (everything except billing), Dispatcher (jobs and schedule), and Technician (only jobs assigned to them). Roles are managed in Team → Member → Permissions.' },
      ],
    },
    {
      category: lang === 'fr' ? 'Facturation et compte' : 'Billing & Account',
      icon: Settings,
      questions: lang === 'fr' ? [
        { q: 'Comment mettre à niveau ou rétrograder mon plan ?', a: 'Allez à Paramètres → Facturation → cliquez sur « Gérer l\'abonnement ». Vous pouvez changer de plan, mettre à jour les modes de paiement et consulter l\'historique.' },
        { q: 'Puis-je annuler mon abonnement ?', a: 'Oui, vous pouvez annuler à tout moment depuis Paramètres → Facturation. Votre compte restera actif jusqu\'à la fin de votre période de facturation.' },
        { q: 'Offrez-vous des rabais pour la facturation annuelle ?', a: 'Oui ! Les plans annuels vous font économiser 20 % par rapport à la facturation mensuelle. Changez dans Paramètres → Facturation.' },
      ] : [
        { q: 'How do I upgrade or downgrade my plan?', a: 'Go to Settings → Billing → click "Manage subscription". You can change plans, update payment methods, and view billing history.' },
        { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel at any time from Settings → Billing. Your account will remain active until the end of your billing period.' },
        { q: 'Do you offer discounts for annual billing?', a: 'Yes! Annual plans save you 20% compared to monthly billing. Switch in Settings → Billing.' },
      ],
    },
  ]

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
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            {lang === 'fr' ? 'Se connecter' : 'Sign in'}
          </Link>
        </div>
      </nav>

      <section className="py-16 bg-gradient-to-b from-indigo-50/40 to-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {lang === 'fr' ? 'Comment pouvons-nous vous aider ?' : 'How can we help?'}
          </h1>
          <p className="text-gray-500">
            {lang === 'fr' ? 'Parcourez notre FAQ ou contactez notre équipe de soutien.' : 'Browse our FAQ or reach out to our support team.'}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: lang === 'fr' ? 'Documentation' : 'Documentation',
                description: lang === 'fr' ? 'Guides étape par étape pour chaque fonctionnalité' : 'Step-by-step guides for every feature',
                href: '#faq',
                label: lang === 'fr' ? 'Parcourir la doc' : 'Browse docs',
              },
              {
                icon: MessageCircle,
                title: lang === 'fr' ? 'Clavardage en direct' : 'Live Chat',
                description: lang === 'fr' ? 'Discutez avec notre assistant IA en tout temps' : 'Chat with our AI assistant anytime',
                href: '/dashboard',
                label: lang === 'fr' ? 'Ouvrir le chat' : 'Open chat',
              },
              {
                icon: Mail,
                title: lang === 'fr' ? 'Soutien par courriel' : 'Email Support',
                description: lang === 'fr' ? 'Nous répondons en un jour ouvrable' : 'We respond within one business day',
                href: '/contact',
                label: lang === 'fr' ? 'Envoyer un courriel' : 'Send email',
              },
            ].map((item) => (
              <a key={item.title} href={item.href}
                className="rounded-2xl border border-gray-100 bg-white p-6 hover:border-indigo-200 hover:shadow-sm transition-all group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 mb-4 group-hover:bg-indigo-100 transition-colors">
                  <item.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{item.description}</p>
                <span className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-800">{item.label} →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-12 pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {lang === 'fr' ? 'Questions fréquentes' : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-8">
            {faqs.map((category) => (
              <div key={category.category}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50">
                    <category.icon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{category.category}</h3>
                </div>
                <div className="space-y-3">
                  {category.questions.map((faq) => (
                    <details key={faq.q} className="rounded-xl border border-gray-100 bg-white group">
                      <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-gray-900 list-none">
                        {faq.q}
                        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="px-5 pb-4">
                        <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {lang === 'fr' ? 'Besoin d\'aide supplémentaire ?' : 'Still need help?'}
          </h2>
          <p className="text-gray-500 mb-6">
            {lang === 'fr' ? 'Notre équipe de soutien est disponible du lundi au vendredi, 9 h à 17 h HE.' : 'Our support team is available Monday–Friday, 9am–5pm EST.'}
          </p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            <Mail className="h-4 w-4" /> {lang === 'fr' ? 'Contacter le soutien' : 'Contact support'}
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. {lang === 'fr' ? 'Fait avec ❤️ au Québec, Canada 🍁' : 'Made with ❤️ in Québec, Canada 🍁'}</p>
      </footer>
    </div>
  )
}
