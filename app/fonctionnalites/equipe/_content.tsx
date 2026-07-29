'use client'

import Link from 'next/link'
import { ArrowRight, UserPlus, Shield, Smartphone, Clock, FileSpreadsheet, Users, Eye, Mail } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import FaqItem from '@/components/FaqItem'
import { useLanguage } from '@/lib/LanguageContext'
import { MockupTeam, MockupTimeTracker } from '@/components/mockups'

export default function EquipeContent() {
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
                <Users className="h-7 w-7" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
                {fr ? 'Vos techniciens savent toujours où aller' : 'Your technicians always know where to go'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr
                  ? 'Invitez votre équipe par courriel, assignez les interventions et suivez les heures. Chacun a accès exactement à ce dont il a besoin sur son téléphone.'
                  : 'Invite your team by email, assign jobs and track hours. Everyone has access to exactly what they need on their phone.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <MockupTeam />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AVANT / APRES */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {fr ? 'Le problème' : 'The problem'}
          </h2>
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
              <p className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-4">{fr ? 'Avant Gestivio' : 'Before Gestivio'}</p>
              <p className="text-gray-600 dark:text-gray-300 italic leading-relaxed">
                {fr
                  ? 'Avant Gestivio, vous coordonnez votre équipe par texto et appels. Chaque matin, vous passez 30 minutes à expliquer à chacun où aller, quoi apporter et quoi faire. Un technicien oublie l\'adresse, un autre ne sait pas quel matériel apporter. Vous passez votre journée au téléphone au lieu de travailler.'
                  : 'Before Gestivio, you coordinate your team by text and calls. Every morning, you spend 30 minutes explaining to everyone where to go, what to bring and what to do. One technician forgets the address, another doesn\'t know what equipment to bring. You spend your day on the phone instead of working.'}
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-8">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-4">{fr ? 'Avec Gestivio' : 'With Gestivio'}</p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {fr
                  ? 'Avec Gestivio, chaque technicien ouvre son téléphone et voit exactement ses interventions du jour : adresses, notes, photos et horaires. Il pointe son arrivée et son départ en un tap. Vous voyez en temps réel qui est où et l\'avancement de chaque job sans passer un seul appel.'
                  : 'With Gestivio, each technician opens their phone and sees exactly their day\'s jobs: addresses, notes, photos and schedules. They punch in and out with one tap. You see in real-time who is where and each job\'s progress without making a single call.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
            {fr ? 'Comment ça marche' : 'How it works'}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-14 max-w-2xl mx-auto">
            {fr ? 'Ajoutez votre équipe en quelques minutes et commencez à collaborer immédiatement.' : 'Add your team in a few minutes and start collaborating immediately.'}
          </p>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-indigo-200" style={{ left: '16%', right: '16%' }} />
            {[
              { num: '1', title: fr ? 'Invitez par courriel' : 'Invite by email', desc: fr ? 'Entrez l\'adresse courriel de votre employé. Il reçoit un lien d\'invitation pour créer son compte avec accès limité et sécurisé.' : 'Enter your employee\'s email address. They receive an invitation link to create their account with limited, secure access.' },
              { num: '2', title: fr ? 'Assignez les interventions' : 'Assign jobs', desc: fr ? 'Assignez une ou plusieurs interventions à chaque technicien. Il reçoit une notification avec tous les détails sur son téléphone.' : 'Assign one or more jobs to each technician. They receive a notification with all details on their phone.' },
              { num: '3', title: fr ? 'Suivez l\'avancement' : 'Track progress', desc: fr ? 'Voyez en temps réel l\'avancement de chaque intervention, les heures pointées et le statut de votre équipe depuis votre tableau de bord.' : 'See in real-time each job\'s progress, clocked hours and your team\'s status from your dashboard.' },
            ].map((step) => (
              <div key={step.num} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white text-lg font-bold relative z-10">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES GRID */}
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {fr ? 'Tout pour gérer votre équipe terrain' : 'Everything to manage your field team'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {[
              { icon: Mail, title: fr ? 'Invitation par courriel' : 'Email invitation', desc: fr ? 'Ajoutez un membre d\'équipe en entrant simplement son courriel. Il reçoit un lien sécurisé pour créer son compte.' : 'Add a team member by simply entering their email. They receive a secure link to create their account.' },
              { icon: Shield, title: fr ? 'Accès sécurisé et limité' : 'Secure limited access', desc: fr ? 'Chaque employé ne voit que ses interventions. Vos données financières et clients restent protégées.' : 'Each employee only sees their jobs. Your financial and client data stays protected.' },
              { icon: Smartphone, title: fr ? 'Vue mobile optimisée' : 'Optimized mobile view', desc: fr ? 'Une interface mobile pensée pour le terrain : simple, rapide et accessible même avec des gants.' : 'A mobile interface designed for the field: simple, fast and accessible even with gloves.' },
              { icon: Users, title: fr ? 'Multi-assignation' : 'Multi-assignment', desc: fr ? 'Assignez plusieurs techniciens à une même intervention pour les gros travaux d\'équipe.' : 'Assign multiple technicians to the same job for bigger team projects.' },
              { icon: Clock, title: fr ? 'Pointage début/fin' : 'Punch in/out', desc: fr ? 'Vos employés pointent leur arrivée et leur départ en un tap depuis leur navigateur mobile.' : 'Your employees punch in and out with one tap from their mobile browser.' },
              { icon: FileSpreadsheet, title: fr ? 'Feuilles de temps' : 'Timesheets', desc: fr ? 'Les feuilles de temps se génèrent automatiquement à partir des pointages de chaque employé.' : 'Timesheets are generated automatically from each employee\'s punches.' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
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
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Un accès sécurisé pour chaque rôle' : 'Secure access for every role'}
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr
                  ? 'Vos techniciens accèdent uniquement aux interventions qui leur sont assignées. Ils voient l\'adresse, les notes du client, les photos et la durée estimée — rien de plus. Vos données financières, votre liste de clients complète et vos rapports restent accessibles uniquement à vous.'
                  : 'Your technicians only access the jobs assigned to them. They see the address, client notes, photos and estimated duration — nothing more. Your financial data, complete client list and reports remain accessible only to you.'}
              </p>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr
                  ? 'Vous pouvez révoquer l\'accès d\'un employé instantanément si nécessaire. Toutes les données restent dans votre compte.'
                  : 'You can revoke an employee\'s access instantly if needed. All data stays in your account.'}
              </p>
            </div>
            <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <MockupTeam />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED FEATURE B */}
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 flex justify-center">
              <MockupTimeTracker />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Vue mobile conçue pour le terrain' : 'Mobile view designed for the field'}
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr
                  ? 'L\'interface mobile de vos techniciens est pensée pour les conditions réelles : gros boutons, texte lisible au soleil, navigation simplifiée. En un coup d\'oeil, ils voient leur prochaine intervention avec l\'adresse clickable pour la navigation GPS.'
                  : 'Your technicians\' mobile interface is designed for real conditions: big buttons, readable text in sunlight, simplified navigation. At a glance, they see their next job with a clickable address for GPS navigation.'}
              </p>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr
                  ? 'Ils peuvent aussi ajouter des notes, prendre des photos du travail complété et mettre à jour le statut de l\'intervention directement depuis le terrain.'
                  : 'They can also add notes, take photos of completed work and update the job status directly from the field.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">
            {fr ? 'Questions fréquentes' : 'Frequently asked questions'}
          </h2>
          <div className="divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
            <FaqItem
              question={fr ? 'Mes techniciens voient-ils toutes les informations ?' : 'Do my technicians see all the information?'}
              answer={fr ? 'Non. Chaque technicien ne voit que les interventions qui lui sont assignées et les informations nécessaires pour les compléter. Vos données financières et votre liste de clients restent privées.' : 'No. Each technician only sees the jobs assigned to them and the information needed to complete them. Your financial data and client list stay private.'}
            />
            <FaqItem
              question={fr ? 'Comment inviter un membre d\'équipe ?' : 'How do I invite a team member?'}
              answer={fr ? 'Entrez simplement l\'adresse courriel de votre employé dans les paramètres d\'équipe. Il recevra un lien d\'invitation sécurisé pour créer son compte en moins d\'une minute.' : 'Simply enter your employee\'s email address in team settings. They\'ll receive a secure invitation link to create their account in under a minute.'}
            />
            <FaqItem
              question={fr ? 'Le pointage fonctionne-t-il sur mobile ?' : 'Does punch in/out work on mobile?'}
              answer={fr ? 'Oui. Vos techniciens pointent leur arrivée et leur départ directement depuis le navigateur de leur téléphone en un seul tap — aucune application à télécharger. Les pauses sont aussi enregistrées.' : 'Yes. Your technicians clock in and out directly from their phone\'s browser in a single tap — no app to download. Breaks are also recorded.'}
            />
            <FaqItem
              question={fr ? 'Combien d\'employés puis-je ajouter ?' : 'How many employees can I add?'}
              answer={fr ? 'Il n\'y a aucune limite au nombre de membres d\'équipe. Ajoutez autant de techniciens que nécessaire selon la croissance de votre entreprise.' : 'There is no limit to the number of team members. Add as many technicians as needed as your business grows.'}
            />
          </div>
        </div>
      </section>

      {/* RELATED FEATURES */}
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">
            {fr ? 'Voir aussi' : 'See also'}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { href: '/fonctionnalites/suivi-temps', title: fr ? 'Suivi du temps' : 'Time tracking', desc: fr ? 'Feuilles de temps automatiques et export CSV.' : 'Automatic timesheets and CSV export.' },
              { href: '/fonctionnalites/interventions', title: fr ? 'Interventions' : 'Jobs', desc: fr ? 'Créez et assignez vos interventions.' : 'Create and assign your jobs.' },
              { href: '/fonctionnalites/contrats', title: fr ? 'Contrats' : 'Contracts', desc: fr ? 'Planification automatique des jobs récurrents.' : 'Automatic scheduling of recurring jobs.' },
            ].map((card) => (
              <Link key={card.href} href={card.href} className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600">{card.title}</h3>
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
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-indigo-600 px-8 py-14 text-center">
            <h2 className="text-3xl font-bold text-white">
              {fr ? 'Essayez la gestion d\'équipe gratuitement' : 'Try team management for free'}
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
