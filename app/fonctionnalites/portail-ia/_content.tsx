'use client'

import Link from 'next/link'
import { ArrowRight, Bot, Clock, Globe, Mail, LayoutDashboard, MessageSquare, Settings, Link2 } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import FaqItem from '@/components/FaqItem'
import { useLanguage } from '@/lib/LanguageContext'
import { MockupChat, MockupBookingPortal } from '@/components/mockups'

export default function PortailIAContent() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  return (
    <MarketingShell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Bot className="h-7 w-7" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Votre assistant IA prend les rendez-vous à votre place' : 'Your AI assistant books appointments for you'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr
                  ? 'Partagez un simple lien avec vos clients. L\'assistant IA les accueille en français ou en anglais, recueille toutes les informations et la demande apparaît dans votre tableau de bord.'
                  : 'Share a simple link with your clients. The AI assistant greets them in French or English, collects all the information and the request appears in your dashboard.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <MockupChat />
            </div>
          </div>
        </div>
      </section>

      {/* AVANT / APRES */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Le problème' : 'The problem'}
          </h2>
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="rounded-2xl border border-gray-200 p-8">
              <p className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-4">{fr ? 'Avant Gestivio' : 'Before Gestivio'}</p>
              <p className="text-gray-600 italic leading-relaxed">
                {fr
                  ? 'Avant Gestivio, vous êtes sur un chantier, les mains pleines, et votre téléphone sonne sans arrêt. Des clients potentiels essaient de prendre rendez-vous mais tombent sur votre messagerie vocale. Quand vous rappelez le soir, la moitié ont déjà trouvé quelqu\'un d\'autre. Vous perdez des contrats simplement parce que vous étiez occupé à travailler.'
                  : 'Before Gestivio, you\'re on a job site, hands full, and your phone keeps ringing. Potential clients try to book but reach your voicemail. When you call back in the evening, half have already found someone else. You lose contracts simply because you were busy working.'}
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-8">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-4">{fr ? 'Avec Gestivio' : 'With Gestivio'}</p>
              <p className="text-gray-700 leading-relaxed">
                {fr
                  ? 'Avec Gestivio, votre portail IA est disponible 24 heures sur 24, 7 jours sur 7. Le client visite votre lien, décrit son besoin à l\'assistant et reçoit une confirmation instantanée. Vous retrouvez la demande complète dans votre tableau de bord avec toutes les informations nécessaires pour planifier l\'intervention.'
                  : 'With Gestivio, your AI portal is available 24/7. The client visits your link, describes their need to the assistant and receives instant confirmation. You find the complete request in your dashboard with all the information needed to plan the job.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            {fr ? 'Comment ça marche' : 'How it works'}
          </h2>
          <p className="text-center text-gray-600 mb-14 max-w-2xl mx-auto">
            {fr ? 'Partagez votre lien et laissez l\'IA faire le reste.' : 'Share your link and let AI do the rest.'}
          </p>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-indigo-200" style={{ left: '16%', right: '16%' }} />
            {[
              { num: '1', title: fr ? 'Partagez votre lien' : 'Share your link', desc: fr ? 'Ajoutez votre lien de réservation sur votre site web, vos réseaux sociaux ou votre carte d\'affaires. C\'est un simple URL personnalisé.' : 'Add your booking link to your website, social media or business card. It\'s a simple customized URL.' },
              { num: '2', title: fr ? 'Le client converse avec l\'IA' : 'Client chats with AI', desc: fr ? 'L\'assistant pose les bonnes questions : type de service, adresse, disponibilité, coordonnées. Tout est recueilli de façon naturelle et professionnelle.' : 'The assistant asks the right questions: service type, address, availability, contact info. Everything is collected naturally and professionally.' },
              { num: '3', title: fr ? 'La demande apparaît' : 'Request appears', desc: fr ? 'La demande de réservation arrive dans votre tableau de bord avec toutes les informations. Il ne reste qu\'à confirmer et planifier l\'intervention.' : 'The booking request arrives in your dashboard with all the information. All that\'s left is to confirm and schedule the job.' },
            ].map((step) => (
              <div key={step.num} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white text-lg font-bold relative z-10">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES GRID */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Un portail intelligent à votre image' : 'A smart portal that represents you'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {[
              { icon: Clock, title: fr ? 'Disponible 24/7' : 'Available 24/7', desc: fr ? 'Votre assistant ne dort jamais. Les clients réservent à toute heure du jour et de la nuit.' : 'Your assistant never sleeps. Clients book at any time of day or night.' },
              { icon: Globe, title: fr ? 'Bilingue FR + EN' : 'Bilingual FR + EN', desc: fr ? 'L\'assistant détecte la langue du client et répond automatiquement en français ou en anglais.' : 'The assistant detects the client\'s language and automatically responds in French or English.' },
              { icon: MessageSquare, title: fr ? 'Collecte d\'informations' : 'Information collection', desc: fr ? 'L\'IA pose les bonnes questions pour recueillir tout ce dont vous avez besoin pour planifier.' : 'AI asks the right questions to collect everything you need for planning.' },
              { icon: Mail, title: fr ? 'Confirmation par courriel' : 'Email confirmation', desc: fr ? 'Le client reçoit une confirmation automatique par courriel avec le résumé de sa demande.' : 'The client receives an automatic email confirmation with a summary of their request.' },
              { icon: LayoutDashboard, title: fr ? 'Intégration au tableau de bord' : 'Dashboard integration', desc: fr ? 'Chaque demande crée automatiquement une entrée dans votre calendrier prête à être confirmée.' : 'Each request automatically creates an entry in your calendar ready to be confirmed.' },
              { icon: Settings, title: fr ? 'Personnalisable' : 'Customizable', desc: fr ? 'Définissez vos services, zones de couverture et questions personnalisées pour l\'assistant.' : 'Define your services, coverage areas and custom questions for the assistant.' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <f.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DETAILED FEATURE A */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Ne manquez plus jamais une demande' : 'Never miss a request again'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Votre portail IA accueille vos clients potentiels même quand vous êtes sur un chantier, en train de conduire ou en famille le soir. L\'assistant est patient, professionnel et pose toujours les bonnes questions pour qualifier la demande.'
                  : 'Your AI portal welcomes potential clients even when you\'re on a job site, driving or with family in the evening. The assistant is patient, professional and always asks the right questions to qualify the request.'}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Chaque demande est qualifiée avant d\'arriver dans votre tableau de bord : type de service, urgence, budget approximatif et coordonnées complètes.'
                  : 'Each request is qualified before reaching your dashboard: service type, urgency, approximate budget and complete contact information.'}
              </p>
            </div>
            <div className="flex justify-center">
              <MockupChat />
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED FEATURE B */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 flex justify-center">
              <MockupBookingPortal />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Un lien unique pour toutes vos sources' : 'One link for all your sources'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Votre lien de réservation fonctionne partout : site web, page Facebook, Google Business, signature de courriel ou carte d\'affaires. Un seul lien à partager pour recevoir des demandes de n\'importe quelle source.'
                  : 'Your booking link works everywhere: website, Facebook page, Google Business, email signature or business card. One link to share to receive requests from any source.'}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'L\'assistant s\'adapte à chaque client : il pose des questions différentes selon le type de service demandé et votre configuration personnalisée.'
                  : 'The assistant adapts to each client: it asks different questions based on the service type requested and your custom configuration.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            {fr ? 'Questions fréquentes' : 'Frequently asked questions'}
          </h2>
          <div className="divide-y divide-gray-200 rounded-2xl bg-white p-6 shadow-sm">
            <FaqItem
              question={fr ? 'Comment fonctionne le portail IA ?' : 'How does the AI portal work?'}
              answer={fr ? 'Votre client visite votre lien de réservation et converse avec un assistant IA qui recueille le type de service, la date souhaitée, l\'adresse et les coordonnées. La demande apparaît ensuite dans votre tableau de bord, prête à être confirmée.' : 'Your client visits your booking link and chats with an AI assistant that collects the service type, preferred date, address and contact info. The request then appears in your dashboard, ready to be confirmed.'}
            />
            <FaqItem
              question={fr ? 'L\'assistant comprend-il le français et l\'anglais ?' : 'Does the assistant understand French and English?'}
              answer={fr ? 'Oui. L\'assistant détecte automatiquement la langue du client dès les premiers mots et poursuit toute la conversation dans cette langue.' : 'Yes. The assistant automatically detects the client\'s language from the first words and continues the entire conversation in that language.'}
            />
            <FaqItem
              question={fr ? 'Puis-je personnaliser les questions posées ?' : 'Can I customize the questions asked?'}
              answer={fr ? 'Oui. Vous définissez vos services, vos zones de couverture et les questions spécifiques que l\'assistant posera à vos clients selon le type de demande.' : 'Yes. You define your services, coverage areas and specific questions the assistant will ask your clients based on request type.'}
            />
            <FaqItem
              question={fr ? 'Le client reçoit-il une confirmation ?' : 'Does the client get a confirmation?'}
              answer={fr ? 'Oui. Un courriel de confirmation est envoyé automatiquement au client avec un résumé complet de sa demande et les prochaines étapes.' : 'Yes. A confirmation email is automatically sent to the client with a complete summary of their request and next steps.'}
            />
            <FaqItem
              question={fr ? 'Dois-je avoir un site web pour utiliser le portail ?' : 'Do I need a website to use the portal?'}
              answer={fr ? 'Non. Votre lien de réservation est autonome. Vous pouvez le partager sur les réseaux sociaux, par texto ou même l\'imprimer sur vos cartes d\'affaires.' : 'No. Your booking link is standalone. You can share it on social media, by text or even print it on your business cards.'}
            />
          </div>
        </div>
      </section>

      {/* RELATED FEATURES */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            {fr ? 'Voir aussi' : 'See also'}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { href: '/fonctionnalites/assistant-ia', title: fr ? 'Assistant IA' : 'AI Assistant', desc: fr ? 'Posez des questions sur votre entreprise.' : 'Ask questions about your business.' },
              { href: '/fonctionnalites/interventions', title: fr ? 'Interventions' : 'Jobs', desc: fr ? 'Gérez et planifiez vos interventions.' : 'Manage and schedule your jobs.' },
              { href: '/fonctionnalites/equipe', title: fr ? 'Équipe' : 'Team', desc: fr ? 'Coordonnez vos techniciens sur le terrain.' : 'Coordinate your technicians in the field.' },
            ].map((card) => (
              <Link key={card.href} href={card.href} className="rounded-xl border border-gray-200 p-6 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group">
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">{card.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{card.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
                  {fr ? 'Découvrir' : 'Learn more'} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-indigo-600 px-8 py-14 text-center">
            <h2 className="text-3xl font-bold text-white">
              {fr ? 'Essayez le portail IA gratuitement' : 'Try the AI portal for free'}
            </h2>
            <p className="mt-4 text-indigo-100 max-w-xl mx-auto">
              {fr ? '14 jours · Aucune carte de crédit requise' : '14 days · No credit card required'}
            </p>
            <Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50">
              {fr ? 'Commencer gratuitement' : 'Start for free'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
