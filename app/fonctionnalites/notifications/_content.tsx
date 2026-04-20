'use client'

import Link from 'next/link'
import { ArrowRight, Bell, Clock, Truck, CheckCircle, FileText, CreditCard, AlertTriangle, Settings, ChevronDown } from 'lucide-react'
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

export default function NotificationsContent() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: Clock, label: fr ? 'Rappel 24h avant l\'intervention' : '24h reminder before the job' },
    { icon: Truck, label: fr ? 'Notification "en route"' : '"On my way" notification' },
    { icon: CheckCircle, label: fr ? 'Confirmation de travail termine' : 'Job completion confirmation' },
    { icon: FileText, label: fr ? 'Facture envoyee' : 'Invoice sent' },
    { icon: CreditCard, label: fr ? 'Paiement recu' : 'Payment received' },
    { icon: AlertTriangle, label: fr ? 'Rappel de facture en retard' : 'Overdue invoice reminder' },
    { icon: Settings, label: fr ? 'Messages personnalisables' : 'Customizable messages' },
  ]

  const steps = [
    { num: '1', title: fr ? 'Configurez vos declencheurs' : 'Configure your triggers', desc: fr ? 'Choisissez quels evenements declenchent une notification : rappel, en route, termine, facture envoyee.' : 'Choose which events trigger a notification: reminder, on my way, completed, invoice sent.' },
    { num: '2', title: fr ? 'Les notifications partent seules' : 'Notifications send themselves', desc: fr ? 'Quand l\'evenement survient, le client recoit automatiquement un courriel ou un SMS.' : 'When the event occurs, the client automatically receives an email or SMS.' },
    { num: '3', title: fr ? 'Votre client reste informe' : 'Your client stays informed', desc: fr ? 'Plus besoin d\'appeler ou de texter manuellement. Tout est automatise.' : 'No more manual calling or texting. Everything is automated.' },
  ]

  const faqs = [
    {
      q: fr ? 'Quels types de notifications puis-je envoyer ?' : 'What types of notifications can I send?',
      a: fr ? 'Rappels de rendez-vous (24h avant), notifications "en route", confirmations de travail termine, envoi de factures, confirmations de paiement et rappels de factures en retard.' : 'Appointment reminders (24h before), "on my way" notifications, job completion confirmations, invoice sending, payment confirmations, and overdue invoice reminders.',
    },
    {
      q: fr ? 'Puis-je personnaliser le contenu des messages ?' : 'Can I customize the message content?',
      a: fr ? 'Oui. Modifiez le texte de chaque notification pour qu\'il corresponde au ton de votre entreprise. Des variables dynamiques (nom du client, date, etc.) sont disponibles.' : 'Yes. Edit the text of each notification to match your company\'s tone. Dynamic variables (client name, date, etc.) are available.',
    },
    {
      q: fr ? 'Les notifications sont-elles envoyees par courriel ou SMS ?' : 'Are notifications sent by email or SMS?',
      a: fr ? 'Par courriel dans le plan de base. L\'envoi par SMS est disponible en option pour les rappels et les notifications "en route".' : 'By email in the base plan. SMS sending is available as an option for reminders and "on my way" notifications.',
    },
    {
      q: fr ? 'Mon client peut-il se desabonner ?' : 'Can my client unsubscribe?',
      a: fr ? 'Oui. Chaque notification contient un lien de desabonnement conforme aux lois anti-pourriel.' : 'Yes. Each notification contains an unsubscribe link compliant with anti-spam laws.',
    },
  ]

  const related = [
    { href: '/fonctionnalites/interventions', label: fr ? 'Interventions' : 'Jobs' },
    { href: '/fonctionnalites/facturation', label: fr ? 'Facturation' : 'Invoicing' },
    { href: '/fonctionnalites/clients', label: fr ? 'Clients' : 'Clients' },
  ]

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Vos clients toujours informes, sans effort' : 'Your clients always informed, effortlessly'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Fini les textos et appels manuels a chaque etape. Gestivio notifie vos clients automatiquement au bon moment.' : 'No more manual texting and calling at every step. Gestivio notifies your clients automatically at the right time.'}
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
                {fr ? 'Avant : des textos manuels a chaque client' : 'Before: manual texts to every client'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Vous passez du temps a texter ou appeler chaque client pour confirmer, rappeler ou informer. Des oublis arrivent et certains clients ne sont pas au courant.' : 'You spend time texting or calling each client to confirm, remind, or inform. Things slip through the cracks and some clients are left in the dark.'}
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Apres : tout est automatise' : 'After: everything is automated'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Configurez une fois, oubliez ensuite. Vos clients recoivent les bonnes informations au bon moment, sans que vous leviez le petit doigt.' : 'Configure once, forget after. Your clients receive the right information at the right time, without you lifting a finger.'}
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
            {fr ? 'Des notifications pour chaque etape' : 'Notifications for every step'}
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
                {fr ? 'Un client rassure est un client fidele' : 'A reassured client is a loyal client'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Quand votre client sait que vous arrivez dans 30 minutes, il vous attend sans stress. Cette communication professionnelle vous distingue de la competition.' : 'When your client knows you\'re arriving in 30 minutes, they wait without stress. This professional communication sets you apart from the competition.'}
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
                {fr ? 'Des rappels qui reduisent les no-shows' : 'Reminders that reduce no-shows'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Le rappel automatique 24h avant le rendez-vous reduit considerablement les oublis et annulations de derniere minute.' : 'The automatic 24h reminder before the appointment significantly reduces no-shows and last-minute cancellations.'}
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
              {fr ? 'Pret a automatiser vos communications ?' : 'Ready to automate your communications?'}
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
