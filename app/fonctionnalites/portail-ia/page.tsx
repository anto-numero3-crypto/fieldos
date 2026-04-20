'use client'

import Link from 'next/link'
import { ArrowRight, Bot, Clock, Globe, Mail, LayoutDashboard, ChevronDown } from 'lucide-react'
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

export default function PortailIAPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: Clock, label: fr ? 'Disponible 24 heures sur 24, 7 jours sur 7' : 'Available 24/7' },
    { icon: Globe, label: fr ? 'Bilingue français et anglais' : 'Bilingual French and English' },
    { icon: Bot, label: fr ? 'Collecte toutes les informations nécessaires' : 'Collects all necessary information' },
    { icon: Mail, label: fr ? 'Confirmation par courriel automatique' : 'Automatic email confirmation' },
    { icon: LayoutDashboard, label: fr ? 'Intégration directe au tableau de bord' : 'Direct dashboard integration' },
    { icon: Bot, label: fr ? 'Personnalisable selon vos services' : 'Customizable to your services' },
  ]

  const faqs = [
    {
      q: fr ? 'Comment fonctionne le portail IA ?' : 'How does the AI portal work?',
      a: fr ? 'Votre client visite votre lien de réservation et converse avec un assistant IA qui recueille le type de service, la date souhaitée, l\'adresse et les coordonnées. La demande apparaît ensuite dans votre tableau de bord.' : 'Your client visits your booking link and chats with an AI assistant that collects the service type, preferred date, address, and contact info. The request then appears in your dashboard.',
    },
    {
      q: fr ? 'L\'assistant comprend-il le français et l\'anglais ?' : 'Does the assistant understand French and English?',
      a: fr ? 'Oui. L\'assistant détecte automatiquement la langue du client et répond dans la même langue.' : 'Yes. The assistant automatically detects the client\'s language and responds accordingly.',
    },
    {
      q: fr ? 'Puis-je personnaliser les questions posées ?' : 'Can I customize the questions asked?',
      a: fr ? 'Oui. Vous définissez vos services, zones de couverture et questions personnalisées que l\'assistant posera à vos clients.' : 'Yes. You define your services, coverage areas, and custom questions the assistant will ask your clients.',
    },
    {
      q: fr ? 'Le client reçoit-il une confirmation ?' : 'Does the client get a confirmation?',
      a: fr ? 'Oui. Un courriel de confirmation est envoyé automatiquement au client avec un résumé de sa demande.' : 'Yes. A confirmation email is automatically sent to the client with a summary of their request.',
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
                {fr ? 'Votre assistant IA prend les rendez-vous à votre place' : 'Your AI assistant books appointments for you'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Un portail de réservation intelligent qui accueille vos clients en français ou en anglais, recueille les informations et ajoute la demande à votre calendrier.' : 'A smart booking portal that greets your clients in French or English, collects information and adds the request to your calendar.'}
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
                {fr ? 'Ne manquez plus jamais une demande' : 'Never miss a request again'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Votre portail IA est disponible jour et nuit. Même quand vous êtes sur un chantier, l\'assistant accueille vos clients et recueille leur demande complète.' : 'Your AI portal is available day and night. Even when you\'re on a job site, the assistant welcomes your clients and collects their full request.'}
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
                {fr ? 'Les demandes arrivent directement dans votre tableau de bord' : 'Requests land directly in your dashboard'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Chaque réservation crée automatiquement une intervention dans Gestivio avec toutes les informations du client. Il ne reste plus qu\'à confirmer.' : 'Each booking automatically creates a job in Gestivio with all the client\'s information. All that\'s left is to confirm.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Un portail intelligent à votre image' : 'A smart portal that represents you'}
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
              {fr ? 'Prêt à automatiser vos réservations ?' : 'Ready to automate your bookings?'}
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
