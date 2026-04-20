'use client'

import Link from 'next/link'
import { ArrowRight, Calendar, GripVertical, Users, RefreshCw, Globe, Palette, ChevronDown } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import { useLanguage } from '@/lib/LanguageContext'
import { useState } from 'react'

export const metadata = {
  title: 'Calendrier | Gestivio',
  description: 'Votre agenda et vos disponibilites toujours a jour. Vue semaine, mois, glisser-deposer et synchronisation Google Calendar.',
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left text-base font-medium text-gray-900">
        {question}
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-gray-600 leading-relaxed">{answer}</p>}
    </div>
  )
}

export default function CalendrierPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: Calendar, label: fr ? 'Vues semaine et mois' : 'Week and month views' },
    { icon: GripVertical, label: fr ? 'Glisser-deposer pour replanifier' : 'Drag-and-drop to reschedule' },
    { icon: Users, label: fr ? 'Filtre par employe' : 'Filter by employee' },
    { icon: RefreshCw, label: fr ? 'Synchronisation Google Calendar' : 'Google Calendar sync' },
    { icon: Globe, label: fr ? 'Portail de disponibilites' : 'Availability portal' },
    { icon: Palette, label: fr ? 'Code couleur par statut' : 'Color-coded by status' },
    { icon: Calendar, label: fr ? 'Mise en evidence du jour' : 'Today highlight' },
  ]

  const steps = [
    { num: '1', title: fr ? 'Consultez votre semaine' : 'View your week', desc: fr ? 'Ouvrez le calendrier et voyez toutes les interventions planifiees d\'un coup d\'oeil.' : 'Open the calendar and see all scheduled jobs at a glance.' },
    { num: '2', title: fr ? 'Replanifiez en glissant' : 'Reschedule by dragging', desc: fr ? 'Deplacez une intervention d\'un jour a l\'autre ou d\'un technicien a un autre par glisser-deposer.' : 'Move a job from one day to another or from one technician to another by drag-and-drop.' },
    { num: '3', title: fr ? 'Partagez vos disponibilites' : 'Share your availability', desc: fr ? 'Activez le portail pour que vos clients voient vos creneaux libres et reservent eux-memes.' : 'Enable the portal so your clients see your open slots and book themselves.' },
  ]

  const faqs = [
    {
      q: fr ? 'La synchronisation avec Google Calendar est-elle bidirectionnelle ?' : 'Is Google Calendar sync two-way?',
      a: fr ? 'Oui. Les interventions creees dans Gestivio apparaissent dans Google Calendar et vice-versa, en temps reel.' : 'Yes. Jobs created in Gestivio appear in Google Calendar and vice versa, in real time.',
    },
    {
      q: fr ? 'Puis-je voir le calendrier de toute mon equipe ?' : 'Can I see my entire team\'s calendar?',
      a: fr ? 'Oui. Filtrez par employe ou affichez tous les calendriers cote a cote pour une vue d\'ensemble.' : 'Yes. Filter by employee or display all calendars side by side for a full overview.',
    },
    {
      q: fr ? 'Le glisser-deposer fonctionne-t-il sur mobile ?' : 'Does drag-and-drop work on mobile?',
      a: fr ? 'Oui. Le calendrier est optimise pour le tactile — deplacez vos interventions du bout du doigt.' : 'Yes. The calendar is optimized for touch — move your jobs with a fingertip.',
    },
    {
      q: fr ? 'Mes clients peuvent-ils voir mes disponibilites ?' : 'Can my clients see my availability?',
      a: fr ? 'Oui, si vous activez le portail de disponibilites. Vos clients voient uniquement les creneaux libres, sans details sur vos autres interventions.' : 'Yes, if you enable the availability portal. Your clients only see open slots, without details about your other jobs.',
    },
  ]

  const related = [
    { href: '/fonctionnalites/interventions', label: fr ? 'Interventions' : 'Jobs' },
    { href: '/fonctionnalites/equipe', label: fr ? 'Equipe' : 'Team' },
    { href: '/fonctionnalites/reservations', label: fr ? 'Reservations en ligne' : 'Online Bookings' },
  ]

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Votre agenda et vos disponibilites toujours a jour' : 'Your schedule and availability always up to date'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Fini les doubles reservations et le manque de visibilite. Votre calendrier se synchronise en temps reel avec toute votre equipe.' : 'No more double bookings or lack of visibility. Your calendar syncs in real time with your entire team.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Apercu de la fonctionnalite' : 'Feature preview'}
            </div>
          </div>
        </div>
      </section>

      {/* Avant / Apres */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Avant : des rendez-vous en double et des oublis' : 'Before: double bookings and forgotten appointments'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Vous gerez votre calendrier de tete ou dans un carnet. Resultat : des clients oublies, des techniciens qui se croisent et des journees mal planifiees.' : 'You manage your calendar from memory or in a notebook. Result: forgotten clients, technicians crossing paths, and poorly planned days.'}
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Apres : un calendrier visuel partage' : 'After: a shared visual calendar'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Toute votre equipe voit le meme calendrier en temps reel. Les conflits sont detectes instantanement et les clients sont toujours servis a l\'heure.' : 'Your entire team sees the same calendar in real time. Conflicts are detected instantly and clients are always served on time.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Steps */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Comment ca fonctionne' : 'How it works'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-lg font-bold">{s.num}</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Tout ce qu\'il faut pour gerer votre calendrier' : 'Everything you need to manage your calendar'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <f.icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-gray-700">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detail section 1 */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Replanifiez en un geste' : 'Reschedule with one gesture'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Un imprévu ? Glissez l\'intervention vers un autre créneau ou un autre technicien. Tout le monde est notifié automatiquement.' : 'Something came up? Drag the job to another slot or another technician. Everyone is notified automatically.'}
              </p>
            </div>
            <div className="bg-gray-100 rounded-2xl h-48 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Apercu de la fonctionnalite' : 'Feature preview'}
            </div>
          </div>
        </div>
      </section>

      {/* Detail section 2 */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-gray-100 rounded-2xl h-48 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Apercu de la fonctionnalite' : 'Feature preview'}
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Synchronise avec Google Calendar' : 'Synced with Google Calendar'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Connectez votre compte Google et retrouvez vos interventions Gestivio directement dans votre calendrier existant. La synchronisation est bidirectionnelle.' : 'Connect your Google account and see your Gestivio jobs directly in your existing calendar. Sync is two-way.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            {fr ? 'Questions frequentes' : 'Frequently asked questions'}
          </h2>
          <div className="divide-y divide-gray-200 rounded-2xl bg-white p-6 shadow-sm">
            {faqs.map((faq, i) => (
              <FaqItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Related features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            {fr ? 'Fonctionnalites connexes' : 'Related features'}
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {related.map((r) => (
              <Link key={r.href} href={r.href} className="rounded-lg border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                {r.label}
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
              {fr ? 'Pret a organiser votre calendrier ?' : 'Ready to organize your calendar?'}
            </h2>
            <p className="mt-4 text-indigo-100 max-w-xl mx-auto">
              {fr ? 'Essayez Gestivio gratuitement pendant 14 jours. Aucune carte de credit requise.' : 'Try Gestivio free for 14 days. No credit card required.'}
            </p>
            <Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50">
              {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
