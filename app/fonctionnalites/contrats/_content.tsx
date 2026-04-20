'use client'

import Link from 'next/link'
import { ArrowRight, FileText, RefreshCw, PenTool, Receipt, Bell, Calendar, BarChart3, ClipboardCheck } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import FaqItem from '@/components/FaqItem'
import { useLanguage } from '@/lib/LanguageContext'

export default function ContratsContent() {
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
                <ClipboardCheck className="h-7 w-7" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Gérez vos contrats saisonniers sans effort' : 'Manage your seasonal contracts effortlessly'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr
                  ? 'Créez des contrats récurrents, faites-les signer en ligne et les interventions se planifient automatiquement. La facturation suit le rythme du contrat sans aucune action de votre part.'
                  : 'Create recurring contracts, get them signed online and jobs are scheduled automatically. Billing follows the contract rhythm without any action from you.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="bg-gray-100 rounded-2xl p-8 h-72 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Aperçu interactif' : 'Interactive preview'}
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
                  ? 'Avant Gestivio, vous gérez vos contrats saisonniers sur papier ou dans un fichier Excel. Vous oubliez de planifier certaines visites, vous ne savez plus quel client est rendu où dans son contrat et vous facturez en retard. Les renouvellements vous échappent et vous perdez des revenus récurrents par simple oubli.'
                  : 'Before Gestivio, you manage your seasonal contracts on paper or in an Excel file. You forget to schedule some visits, you don\'t know which client is where in their contract and you invoice late. Renewals slip through and you lose recurring revenue through simple oversight.'}
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-8">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-4">{fr ? 'Avec Gestivio' : 'With Gestivio'}</p>
              <p className="text-gray-700 leading-relaxed">
                {fr
                  ? 'Avec Gestivio, vous créez le contrat une fois et tout le reste est automatique. Les interventions sont planifiées selon la fréquence définie, la facturation suit le calendrier du contrat et vous êtes averti avant chaque renouvellement. Le client signe en ligne et tout est centralisé.'
                  : 'With Gestivio, you create the contract once and everything else is automatic. Jobs are scheduled according to the defined frequency, billing follows the contract calendar and you\'re notified before each renewal. The client signs online and everything is centralized.'}
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
            {fr ? 'Du contrat signé aux interventions planifiées, tout est automatisé.' : 'From signed contract to scheduled jobs, everything is automated.'}
          </p>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-indigo-200" style={{ left: '16%', right: '16%' }} />
            {[
              { num: '1', title: fr ? 'Créez le contrat' : 'Create the contract', desc: fr ? 'Définissez les services, la durée, la fréquence des visites et les termes de facturation. Personnalisez avec vos conditions.' : 'Define services, duration, visit frequency and billing terms. Customize with your conditions.' },
              { num: '2', title: fr ? 'Le client signe en ligne' : 'Client signs online', desc: fr ? 'Envoyez le contrat par courriel. Le client le consulte et signe électroniquement en quelques clics, sans imprimer.' : 'Send the contract by email. The client reviews it and signs electronically in a few clicks, without printing.' },
              { num: '3', title: fr ? 'Les jobs se créent' : 'Jobs are auto-created', desc: fr ? 'Les interventions sont automatiquement créées selon le calendrier du contrat. La facturation suit le même rythme.' : 'Jobs are automatically created according to the contract calendar. Billing follows the same rhythm.' },
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
            {fr ? 'La gestion de contrats simplifiée' : 'Simplified contract management'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {[
              { icon: Calendar, title: fr ? 'Contrats saisonniers' : 'Seasonal contracts', desc: fr ? 'Définissez la période du contrat (ex. avril à novembre) et les interventions sont planifiées pour la saison entière.' : 'Define the contract period (e.g. April to November) and jobs are scheduled for the entire season.' },
              { icon: RefreshCw, title: fr ? 'Récurrence automatique' : 'Automatic recurrence', desc: fr ? 'Les interventions se créent automatiquement selon la fréquence définie : hebdomadaire, bimensuelle ou mensuelle.' : 'Jobs are created automatically based on defined frequency: weekly, bi-weekly or monthly.' },
              { icon: PenTool, title: fr ? 'Signature électronique' : 'E-signature', desc: fr ? 'Envoyez le contrat pour signature en ligne. Le client signe depuis son téléphone sans rien imprimer.' : 'Send the contract for online signature. The client signs from their phone without printing anything.' },
              { icon: Receipt, title: fr ? 'Facturation automatique' : 'Automatic billing', desc: fr ? 'Les factures sont générées et envoyées automatiquement selon le calendrier de facturation du contrat.' : 'Invoices are generated and sent automatically according to the contract billing schedule.' },
              { icon: Bell, title: fr ? 'Rappels de renouvellement' : 'Renewal reminders', desc: fr ? 'Recevez un rappel avant l\'expiration de chaque contrat pour ne jamais perdre un renouvellement.' : 'Receive a reminder before each contract expires to never lose a renewal.' },
              { icon: BarChart3, title: fr ? 'Suivi de progression' : 'Progress tracking', desc: fr ? 'Voyez en un coup d\'oeil combien d\'interventions ont été complétées sur le total du contrat.' : 'See at a glance how many jobs have been completed out of the contract total.' },
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
                {fr ? 'Des interventions qui se planifient toutes seules' : 'Jobs that schedule themselves'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'À partir d\'un contrat saisonnier, Gestivio génère automatiquement toutes les interventions pour la durée du contrat. Si vous avez un contrat d\'entretien de pelouse hebdomadaire d\'avril à novembre, les 30 interventions sont créées d\'un coup et assignées au bon technicien.'
                  : 'From a seasonal contract, Gestivio automatically generates all the jobs for the contract duration. If you have a weekly lawn care contract from April to November, all 30 jobs are created at once and assigned to the right technician.'}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Si un imprévu survient, déplacez simplement l\'intervention sur le calendrier. Les suivantes restent en place.'
                  : 'If something unexpected comes up, simply move the job on the calendar. The following ones stay in place.'}
              </p>
            </div>
            <div className="bg-gray-100 rounded-2xl p-8 h-64 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Aperçu interactif' : 'Interactive preview'}
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED FEATURE B */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-gray-100 rounded-2xl p-8 h-64 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Aperçu interactif' : 'Interactive preview'}
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Signature électronique et facturation automatisées' : 'Automated e-signature and billing'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Envoyez le contrat pour signature électronique directement depuis Gestivio. Le client le reçoit par courriel, le consulte et signe depuis son téléphone ou son ordinateur. C\'est légalement valide au Québec et au Canada.'
                  : 'Send the contract for e-signature directly from Gestivio. The client receives it by email, reviews and signs from their phone or computer. It\'s legally valid in Quebec and Canada.'}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Une fois le contrat signé, la facturation récurrente démarre automatiquement. Mensuelle, trimestrielle ou à la carte — vous choisissez le rythme qui convient à votre entente.'
                  : 'Once the contract is signed, recurring billing starts automatically. Monthly, quarterly or custom — you choose the rhythm that fits your agreement.'}
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
              question={fr ? 'Puis-je créer des contrats saisonniers ?' : 'Can I create seasonal contracts?'}
              answer={fr ? 'Oui. Définissez la période du contrat (ex. avril à novembre pour l\'entretien de pelouse) et les interventions seront planifiées automatiquement pour toute la saison.' : 'Yes. Define the contract period (e.g., April to November for lawn care) and jobs will be scheduled automatically for the entire season.'}
            />
            <FaqItem
              question={fr ? 'La signature électronique est-elle légale au Québec ?' : 'Is e-signature legal in Quebec?'}
              answer={fr ? 'Oui. La signature électronique est reconnue par la Loi concernant le cadre juridique des technologies de l\'information du Québec. Elle a la même valeur légale qu\'une signature manuscrite.' : 'Yes. E-signature is recognized under Quebec\'s Act to establish a legal framework for information technology. It has the same legal value as a handwritten signature.'}
            />
            <FaqItem
              question={fr ? 'Comment fonctionne la facturation automatique ?' : 'How does automatic billing work?'}
              answer={fr ? 'Vous définissez la fréquence (mensuelle, trimestrielle, etc.) et le montant. Gestivio génère et envoie les factures automatiquement aux dates prévues avec un lien de paiement.' : 'You define the frequency (monthly, quarterly, etc.) and amount. Gestivio generates and sends invoices automatically on scheduled dates with a payment link.'}
            />
            <FaqItem
              question={fr ? 'Suis-je averti avant l\'expiration d\'un contrat ?' : 'Am I notified before a contract expires?'}
              answer={fr ? 'Oui. Vous recevez un rappel avant l\'échéance pour proposer un renouvellement à votre client. Vous ne perdrez plus de revenus par oubli.' : 'Yes. You receive a reminder before the deadline to propose a renewal to your client. You won\'t lose revenue through oversight anymore.'}
            />
            <FaqItem
              question={fr ? 'Puis-je voir la progression d\'un contrat ?' : 'Can I see a contract\'s progress?'}
              answer={fr ? 'Oui. Un indicateur visuel montre combien d\'interventions ont été complétées par rapport au total prévu dans le contrat.' : 'Yes. A visual indicator shows how many jobs have been completed compared to the total planned in the contract.'}
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
              { href: '/fonctionnalites/facturation', title: fr ? 'Facturation' : 'Invoicing', desc: fr ? 'Créez et envoyez des factures professionnelles.' : 'Create and send professional invoices.' },
              { href: '/fonctionnalites/interventions', title: fr ? 'Interventions' : 'Jobs', desc: fr ? 'Planifiez et suivez chaque intervention.' : 'Plan and track every job.' },
              { href: '/fonctionnalites/soumissions', title: fr ? 'Soumissions' : 'Quotes', desc: fr ? 'Envoyez des devis avant de signer le contrat.' : 'Send quotes before signing the contract.' },
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
              {fr ? 'Essayez la gestion de contrats gratuitement' : 'Try contract management for free'}
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
