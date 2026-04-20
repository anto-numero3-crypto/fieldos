'use client'

import Link from 'next/link'
import { ArrowRight, Globe, ListChecks, CalendarDays, UserPlus, Mail, LayoutDashboard, ChevronDown } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import { MockupBookingPortal } from '@/components/mockups'
import { useLanguage } from '@/lib/LanguageContext'
import { useState } from 'react'

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

export default function ReservationsContent() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: Globe, label: fr ? 'Lien de reservation personnalise' : 'Custom booking link' },
    { icon: ListChecks, label: fr ? 'Affichage de votre catalogue de services' : 'Service catalog display' },
    { icon: CalendarDays, label: fr ? 'Selecteur de date et heure' : 'Date and time picker' },
    { icon: UserPlus, label: fr ? 'Collecte des informations client' : 'Client info collection' },
    { icon: Mail, label: fr ? 'Confirmation par courriel automatique' : 'Automatic email confirmation' },
    { icon: LayoutDashboard, label: fr ? 'Notification dans votre tableau de bord' : 'Dashboard notification' },
  ]

  const steps = [
    { num: '1', title: fr ? 'Partagez votre lien' : 'Share your link', desc: fr ? 'Ajoutez votre lien de reservation a votre site web, vos reseaux sociaux ou votre signature courriel.' : 'Add your booking link to your website, social media, or email signature.' },
    { num: '2', title: fr ? 'Le client choisit' : 'Client picks', desc: fr ? 'Votre client selectionne le service, la date et l\'heure qui lui conviennent.' : 'Your client selects the service, date, and time that suits them.' },
    { num: '3', title: fr ? 'Vous etes notifie' : 'You get notified', desc: fr ? 'La reservation apparait dans votre tableau de bord avec toutes les informations du client.' : 'The booking appears in your dashboard with all the client\'s information.' },
  ]

  const faqs = [
    {
      q: fr ? 'Puis-je personnaliser les services affiches ?' : 'Can I customize the displayed services?',
      a: fr ? 'Oui. Choisissez quels services de votre catalogue sont visibles sur le portail de reservation et ajustez leurs descriptions.' : 'Yes. Choose which services from your catalog are visible on the booking portal and adjust their descriptions.',
    },
    {
      q: fr ? 'Le client doit-il creer un compte ?' : 'Does the client need to create an account?',
      a: fr ? 'Non. Votre client remplit simplement le formulaire avec ses coordonnees. Aucun compte requis.' : 'No. Your client simply fills in the form with their contact info. No account required.',
    },
    {
      q: fr ? 'Comment fonctionne la confirmation ?' : 'How does the confirmation work?',
      a: fr ? 'Un courriel automatique est envoye au client avec un resume de sa reservation. Vous recevez egalement une notification.' : 'An automatic email is sent to the client with a summary of their booking. You also receive a notification.',
    },
    {
      q: fr ? 'Puis-je bloquer des creneaux ?' : 'Can I block time slots?',
      a: fr ? 'Oui. Marquez des periodes comme indisponibles dans votre calendrier et elles ne seront pas proposees aux clients.' : 'Yes. Mark periods as unavailable in your calendar and they won\'t be offered to clients.',
    },
  ]

  const related = [
    { href: '/fonctionnalites/portail-ia', label: fr ? 'Portail IA' : 'AI Portal' },
    { href: '/fonctionnalites/calendrier', label: fr ? 'Calendrier' : 'Calendar' },
    { href: '/fonctionnalites/notifications', label: fr ? 'Notifications' : 'Notifications' },
  ]

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Vos clients reservent eux-memes en ligne' : 'Your clients book themselves online'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Fini les appels qui interrompent votre travail. Partagez un lien et laissez vos clients reserver le creneau qui leur convient.' : 'No more calls interrupting your work. Share a link and let your clients book the slot that suits them.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="flex justify-center"><MockupBookingPortal /></div>
          </div>
        </div>
      </section>

      {/* Avant / Apres */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Avant : des appels pendant le travail' : 'Before: phone calls during work'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Votre telephone sonne en plein chantier. Vous devez arreter votre travail pour noter un rendez-vous ou rappeler le client plus tard (et parfois oublier).' : 'Your phone rings on the job site. You have to stop working to note an appointment or call back later (and sometimes forget).'}
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Apres : les reservations se font toutes seules' : 'After: bookings happen on their own'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Vos clients choisissent un creneau et reservent en ligne. Vous recevez une notification et la demande apparait dans votre calendrier.' : 'Your clients pick a slot and book online. You get a notification and the request appears in your calendar.'}
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
            {fr ? 'Un portail de reservation complet' : 'A complete booking portal'}
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
                {fr ? 'Votre catalogue en vitrine' : 'Your catalog on display'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Vos clients voient vos services, leurs descriptions et les creneaux disponibles. Ils choisissent ce dont ils ont besoin sans vous appeler.' : 'Your clients see your services, their descriptions, and available slots. They choose what they need without calling you.'}
              </p>
            </div>
            <div className="flex justify-center"><MockupBookingPortal /></div>
          </div>
        </div>
      </section>

      {/* Detail section 2 */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 w-full rounded-2xl border border-gray-200 shadow-sm overflow-hidden"><div className="overflow-x-auto"><div className="min-w-[600px]"><MockupBookingPortal /></div></div></div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Tout arrive dans votre tableau de bord' : 'Everything lands in your dashboard'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Chaque reservation cree automatiquement une demande dans Gestivio avec le nom, le telephone, le service et le creneau. Il ne reste qu\'a confirmer.' : 'Each booking automatically creates a request in Gestivio with the name, phone, service, and slot. All that\'s left is to confirm.'}
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
              {fr ? 'Pret a recevoir des reservations en ligne ?' : 'Ready to receive online bookings?'}
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
