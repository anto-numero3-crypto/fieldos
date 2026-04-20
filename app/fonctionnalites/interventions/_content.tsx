'use client'

import Link from 'next/link'
import { ArrowRight, Calendar, Users, Bell, RefreshCw, MapPin, Clock, CalendarDays } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import FaqItem from '@/components/FaqItem'
import { useLanguage } from '@/lib/LanguageContext'

export default function InterventionsContent() {
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
                <CalendarDays className="h-7 w-7" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Votre journée organisée avant même de partir' : 'Your day organized before you even leave'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr
                  ? 'Créez, assignez et suivez chaque intervention depuis votre téléphone ou ordinateur. Vos techniciens reçoivent instantanément tous les détails dont ils ont besoin pour arriver préparés.'
                  : 'Create, assign and track every job from your phone or computer. Your technicians instantly receive all the details they need to arrive prepared.'}
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
                  ? 'Avant Gestivio, vous gérez vos interventions sur des bouts de papier, des messages texte et des appels en plein chantier. Les détails se perdent, les techniciens arrivent sans les bonnes informations et les clients appellent pour savoir si quelqu\'un va vraiment se présenter. Vous finissez votre journée épuisé en vous demandant si vous n\'avez pas oublié un rendez-vous.'
                  : 'Before Gestivio, you manage your jobs on scraps of paper, text messages and phone calls while on site. Details get lost, technicians show up without the right information and clients call to find out if someone will actually come. You end your day exhausted wondering if you forgot an appointment.'}
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-8">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-4">{fr ? 'Avec Gestivio' : 'With Gestivio'}</p>
              <p className="text-gray-700 leading-relaxed">
                {fr
                  ? 'Avec Gestivio, chaque intervention est créée en quelques secondes, assignée au bon technicien et visible sur le calendrier de toute l\'équipe. Vos techniciens reçoivent une notification avec l\'adresse, les notes et les photos. Le client est averti automatiquement. Vous voyez en temps réel qui est où et quoi.'
                  : 'With Gestivio, every job is created in seconds, assigned to the right technician and visible on the whole team\'s calendar. Your technicians get a notification with the address, notes and photos. The client is notified automatically. You see in real-time who is where and doing what.'}
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
            {fr ? 'Trois étapes simples pour ne plus jamais perdre le fil de vos interventions.' : 'Three simple steps to never lose track of your jobs again.'}
          </p>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-indigo-200" style={{ left: '16%', right: '16%' }} />
            {[
              { num: '1', title: fr ? 'Créez l\'intervention' : 'Create the job', desc: fr ? 'En quelques clics, ajoutez le client, l\'adresse, la date et les détails du travail à effectuer. Joignez des photos ou des notes vocales si nécessaire.' : 'In a few clicks, add the client, address, date and work details. Attach photos or voice notes if needed.' },
              { num: '2', title: fr ? 'Assignez le technicien' : 'Assign the technician', desc: fr ? 'Choisissez un ou plusieurs techniciens disponibles. Ils reçoivent instantanément une notification avec tous les détails de l\'intervention sur leur téléphone.' : 'Choose one or more available technicians. They instantly receive a notification with all job details on their phone.' },
              { num: '3', title: fr ? 'Suivez l\'avancement' : 'Track progress', desc: fr ? 'Voyez le statut de chaque intervention en temps réel : en route, en cours, terminé. Le client est notifié automatiquement à chaque étape.' : 'See each job\'s status in real-time: en route, in progress, completed. The client is automatically notified at each step.' },
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
            {fr ? 'Tout ce qu\'il faut pour gérer vos interventions' : 'Everything you need to manage your jobs'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {[
              { icon: Calendar, title: fr ? 'Calendrier glisser-déposer' : 'Drag-and-drop calendar', desc: fr ? 'Visualisez votre semaine et réorganisez les interventions par simple glisser-déposer.' : 'Visualize your week and rearrange jobs with simple drag-and-drop.' },
              { icon: Users, title: fr ? 'Assignation multi-techniciens' : 'Multi-technician assignment', desc: fr ? 'Assignez plusieurs techniciens à une même intervention pour les gros travaux.' : 'Assign multiple technicians to the same job for bigger projects.' },
              { icon: Clock, title: fr ? 'Statuts en temps réel' : 'Real-time status', desc: fr ? 'Suivez l\'avancement de chaque intervention : planifié, en route, en cours, terminé.' : 'Track each job\'s progress: planned, en route, in progress, completed.' },
              { icon: RefreshCw, title: fr ? 'Sync Google Calendar' : 'Google Calendar sync', desc: fr ? 'Synchronisez automatiquement vos interventions avec Google Calendar dans les deux sens.' : 'Automatically sync your jobs with Google Calendar both ways.' },
              { icon: Bell, title: fr ? 'Notifications automatiques' : 'Auto notifications', desc: fr ? 'Techniciens et clients sont notifiés à chaque changement de statut ou d\'assignation.' : 'Technicians and clients are notified at every status change or assignment.' },
              { icon: MapPin, title: fr ? 'Vue carte' : 'Map view', desc: fr ? 'Voyez toutes les interventions du jour sur une carte pour optimiser vos déplacements.' : 'See all the day\'s jobs on a map to optimize your routes.' },
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
                {fr ? 'Un calendrier visuel qui simplifie la planification' : 'A visual calendar that simplifies planning'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Le calendrier de Gestivio vous montre toute votre semaine d\'un coup d\'oeil. Chaque intervention est codée par couleur selon son statut et son technicien. Glissez-déposez pour réorganiser votre planning quand un imprévu survient. Voyez instantanément les disponibilités de chaque membre de votre équipe et évitez les conflits d\'horaire.'
                  : 'Gestivio\'s calendar shows you your entire week at a glance. Each job is color-coded by status and technician. Drag and drop to reorganize your schedule when something unexpected happens. Instantly see each team member\'s availability and avoid scheduling conflicts.'}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'La synchronisation bidirectionnelle avec Google Calendar signifie que vos rendez-vous personnels sont aussi visibles, pour ne jamais vous double-booker.'
                  : 'Two-way sync with Google Calendar means your personal appointments are also visible, so you never double-book yourself.'}
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
                {fr ? 'Notifications intelligentes pour toute l\'équipe' : 'Smart notifications for the whole team'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Chaque technicien reçoit une notification par courriel et sur mobile dès qu\'une intervention lui est assignée. Les détails incluent l\'adresse avec lien Google Maps, les notes du client, les photos et la durée estimée. Plus besoin d\'appeler chacun pour donner les détails.'
                  : 'Each technician receives an email and mobile notification as soon as a job is assigned. Details include the address with Google Maps link, client notes, photos and estimated duration. No more calling everyone to give details.'}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Les clients aussi sont dans la boucle : ils reçoivent une confirmation automatique avec le créneau prévu et sont avisés quand le technicien est en route.'
                  : 'Clients are also in the loop: they receive automatic confirmation with the scheduled time slot and are notified when the technician is on their way.'}
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
              question={fr ? 'Peut-on créer des interventions récurrentes ?' : 'Can I create recurring jobs?'}
              answer={fr ? 'Oui. Vous pouvez configurer des interventions qui se répètent selon la fréquence de votre choix — hebdomadaire, mensuelle ou personnalisée. Idéal pour les contrats d\'entretien saisonnier.' : 'Yes. You can set up jobs that repeat on your preferred frequency — weekly, monthly, or custom. Perfect for seasonal maintenance contracts.'}
            />
            <FaqItem
              question={fr ? 'Mes techniciens reçoivent-ils des notifications ?' : 'Do technicians get notifications?'}
              answer={fr ? 'Oui. Chaque technicien reçoit une notification par courriel et sur mobile dès qu\'une intervention lui est assignée ou modifiée. L\'adresse, les notes et les photos sont incluses.' : 'Yes. Each technician gets an email and mobile notification as soon as a job is assigned or changed. Address, notes and photos are included.'}
            />
            <FaqItem
              question={fr ? 'La synchronisation Google Calendar fonctionne-t-elle dans les deux sens ?' : 'Does Google Calendar sync work both ways?'}
              answer={fr ? 'Oui. Les interventions créées dans Gestivio apparaissent dans Google Calendar et les événements ajoutés dans Google Calendar bloquent les créneaux dans Gestivio.' : 'Yes. Jobs created in Gestivio appear in Google Calendar and events added in Google Calendar block time slots in Gestivio.'}
            />
            <FaqItem
              question={fr ? 'Combien de techniciens puis-je assigner à une intervention ?' : 'How many technicians can I assign to a job?'}
              answer={fr ? 'Il n\'y a aucune limite. Assignez autant de techniciens que nécessaire — chacun recevra sa propre notification avec les détails complets.' : 'There is no limit. Assign as many technicians as needed — each one will receive their own notification with full details.'}
            />
            <FaqItem
              question={fr ? 'Puis-je voir toutes les interventions sur une carte ?' : 'Can I see all jobs on a map?'}
              answer={fr ? 'Oui. La vue carte affiche toutes les interventions du jour avec l\'itinéraire optimisé pour réduire vos déplacements entre les chantiers.' : 'Yes. The map view displays all the day\'s jobs with an optimized route to reduce your travel between sites.'}
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
              { href: '/fonctionnalites/equipe', title: fr ? 'Gestion d\'équipe' : 'Team management', desc: fr ? 'Invitez vos techniciens et gérez les accès.' : 'Invite your technicians and manage access.' },
              { href: '/fonctionnalites/suivi-temps', title: fr ? 'Suivi du temps' : 'Time tracking', desc: fr ? 'Feuilles de temps automatiques par intervention.' : 'Automatic timesheets per job.' },
              { href: '/fonctionnalites/contrats', title: fr ? 'Contrats' : 'Contracts', desc: fr ? 'Gérez vos contrats saisonniers et récurrents.' : 'Manage your seasonal and recurring contracts.' },
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
              {fr ? 'Essayez la gestion d\'interventions gratuitement' : 'Try job management for free'}
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
