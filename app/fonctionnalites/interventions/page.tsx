'use client'

import Link from 'next/link'
import { ArrowRight, Calendar, Users, Bell, RefreshCw, MapPin, ChevronDown } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
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

export default function InterventionsPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: Calendar, label: fr ? 'Calendrier glisser-déposer' : 'Drag-and-drop calendar' },
    { icon: Users, label: fr ? 'Assignation multi-techniciens' : 'Multi-technician assignment' },
    { icon: Bell, label: fr ? 'Notifications automatiques' : 'Auto notifications' },
    { icon: RefreshCw, label: fr ? 'Synchronisation Google Calendar' : 'Google Calendar sync' },
    { icon: MapPin, label: fr ? 'Vue carte des interventions' : 'Map view of jobs' },
    { icon: Calendar, label: fr ? 'Statuts en temps réel' : 'Real-time status updates' },
  ]

  const faqs = [
    {
      q: fr ? 'Peut-on créer des interventions récurrentes ?' : 'Can I create recurring jobs?',
      a: fr ? 'Oui. Vous pouvez configurer des interventions qui se répètent selon la fréquence de votre choix — hebdomadaire, mensuelle ou personnalisée.' : 'Yes. You can set up jobs that repeat on your preferred frequency — weekly, monthly, or custom.',
    },
    {
      q: fr ? 'Mes techniciens reçoivent-ils des notifications ?' : 'Do technicians get notifications?',
      a: fr ? 'Oui. Chaque technicien reçoit une notification par courriel et sur mobile dès qu\'une intervention lui est assignée ou modifiée.' : 'Yes. Each technician gets an email and mobile notification as soon as a job is assigned or changed.',
    },
    {
      q: fr ? 'La synchronisation Google Calendar fonctionne-t-elle dans les deux sens ?' : 'Does Google Calendar sync work both ways?',
      a: fr ? 'Oui. Les interventions créées dans Gestivio apparaissent dans Google Calendar et vice-versa.' : 'Yes. Jobs created in Gestivio appear in Google Calendar and vice versa.',
    },
    {
      q: fr ? 'Y a-t-il une vue carte ?' : 'Is there a map view?',
      a: fr ? 'Oui. Visualisez toutes vos interventions du jour sur une carte pour optimiser vos déplacements.' : 'Yes. See all your day\'s jobs on a map to optimize your routes.',
    },
  ]

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Votre journée organisée avant même de partir' : 'Your day organized before you even leave'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Créez, assignez et suivez chaque intervention depuis votre téléphone. Fini les oublis et les appels de dernière minute.' : 'Create, assign and track every job from your phone. No more forgotten jobs or last-minute calls.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="bg-gray-100 rounded-2xl h-64 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Aperçu de la fonctionnalité' : 'Feature preview'}
            </div>
          </div>
        </div>
      </section>

      {/* Benefit 1 */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Un calendrier visuel qui simplifie tout' : 'A visual calendar that simplifies everything'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Glissez-déposez vos interventions sur le calendrier. Voyez qui est disponible, réassignez en un clic et gardez le contrôle sur votre semaine.' : 'Drag and drop jobs on the calendar. See who\'s available, reassign with one click and stay in control of your week.'}
              </p>
            </div>
            <div className="bg-gray-100 rounded-2xl h-48 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Aperçu de la fonctionnalité' : 'Feature preview'}
            </div>
          </div>
        </div>
      </section>

      {/* Benefit 2 */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-gray-100 rounded-2xl h-48 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Aperçu de la fonctionnalité' : 'Feature preview'}
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Chaque technicien sait exactement quoi faire' : 'Every technician knows exactly what to do'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Assignez plusieurs techniciens par intervention. Chacun reçoit les détails, l\'adresse et les notes directement sur son téléphone.' : 'Assign multiple technicians per job. Everyone gets the details, address, and notes directly on their phone.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Tout ce qu\'il faut pour gérer vos interventions' : 'Everything you need to manage your jobs'}
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

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            {fr ? 'Questions fréquentes' : 'Frequently asked questions'}
          </h2>
          <div className="divide-y divide-gray-200 rounded-2xl bg-white p-6 shadow-sm">
            {faqs.map((faq, i) => (
              <FaqItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-indigo-600 px-8 py-14 text-center">
            <h2 className="text-3xl font-bold text-white">
              {fr ? 'Prêt à organiser vos interventions ?' : 'Ready to organize your jobs?'}
            </h2>
            <p className="mt-4 text-indigo-100 max-w-xl mx-auto">
              {fr ? 'Essayez Gestivio gratuitement pendant 14 jours. Aucune carte de crédit requise.' : 'Try Gestivio free for 14 days. No credit card required.'}
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
