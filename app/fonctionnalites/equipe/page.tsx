'use client'

import Link from 'next/link'
import { ArrowRight, UserPlus, Shield, Smartphone, Clock, FileSpreadsheet, ChevronDown } from 'lucide-react'
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

export default function EquipePage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: UserPlus, label: fr ? 'Invitation par courriel en un clic' : 'One-click email invitation' },
    { icon: Shield, label: fr ? 'Accès limité et sécurisé pour les employés' : 'Secure limited access for employees' },
    { icon: Smartphone, label: fr ? 'Vue mobile optimisée pour le terrain' : 'Mobile view optimized for the field' },
    { icon: Clock, label: fr ? 'Pointage début / fin de journée' : 'Punch in / out for the day' },
    { icon: FileSpreadsheet, label: fr ? 'Feuilles de temps automatiques' : 'Automatic timesheets' },
    { icon: UserPlus, label: fr ? 'Nombre illimité de membres d\'équipe' : 'Unlimited team members' },
  ]

  const faqs = [
    {
      q: fr ? 'Mes techniciens voient-ils toutes les informations ?' : 'Do my technicians see all the information?',
      a: fr ? 'Non. Chaque technicien ne voit que les interventions qui lui sont assignées et les informations nécessaires pour les compléter.' : 'No. Each technician only sees the jobs assigned to them and the information needed to complete them.',
    },
    {
      q: fr ? 'Comment inviter un membre d\'équipe ?' : 'How do I invite a team member?',
      a: fr ? 'Entrez simplement l\'adresse courriel de votre employé. Il recevra un lien d\'invitation pour créer son compte avec accès limité.' : 'Simply enter your employee\'s email address. They\'ll receive an invitation link to create their account with limited access.',
    },
    {
      q: fr ? 'Le pointage fonctionne-t-il sur mobile ?' : 'Does punch in/out work on mobile?',
      a: fr ? 'Oui. Vos techniciens pointent leur arrivée et leur départ directement depuis l\'application mobile.' : 'Yes. Your technicians clock in and out directly from the mobile app.',
    },
    {
      q: fr ? 'Puis-je voir les heures travaillées de toute mon équipe ?' : 'Can I see my whole team\'s work hours?',
      a: fr ? 'Oui. Le tableau de bord vous donne un aperçu complet des heures pointées par chaque membre de votre équipe.' : 'Yes. The dashboard gives you a complete overview of the hours clocked by each team member.',
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
                {fr ? 'Vos techniciens savent toujours où aller' : 'Your technicians always know where to go'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Invitez votre équipe, assignez les interventions et suivez les heures travaillées. Chacun a accès à ce qu\'il a besoin, rien de plus.' : 'Invite your team, assign jobs and track hours worked. Everyone has access to what they need, nothing more.'}
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
                {fr ? 'Un accès sécurisé pour chaque rôle' : 'Secure access for every role'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Vos techniciens accèdent uniquement aux interventions qui les concernent. Vos données financières et clients restent protégées.' : 'Your technicians only access the jobs that concern them. Your financial and client data stays protected.'}
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
                {fr ? 'Pointage et feuilles de temps intégrés' : 'Built-in punch clock and timesheets'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Vos employés pointent leurs heures depuis leur téléphone. Les feuilles de temps se génèrent automatiquement pour simplifier votre paie.' : 'Your employees clock their hours from their phone. Timesheets are generated automatically to simplify your payroll.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Tout pour gérer votre équipe terrain' : 'Everything to manage your field team'}
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
              {fr ? 'Prêt à mieux coordonner votre équipe ?' : 'Ready to better coordinate your team?'}
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
