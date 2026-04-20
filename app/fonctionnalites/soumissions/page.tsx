'use client'

import Link from 'next/link'
import { ArrowRight, FileText, Mail, CheckCircle, RefreshCw, ListChecks, ChevronDown } from 'lucide-react'
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

export default function SoumissionsPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: ListChecks, label: fr ? 'Modèles avec votre catalogue de produits' : 'Templates with your product catalog' },
    { icon: Mail, label: fr ? 'Envoi par courriel professionnel' : 'Professional email sending' },
    { icon: CheckCircle, label: fr ? 'Approbation en ligne par le client' : 'Online approval by client' },
    { icon: RefreshCw, label: fr ? 'Conversion en facture en un clic' : 'One-click conversion to invoice' },
    { icon: FileText, label: fr ? 'Numérotation séquentielle' : 'Sequential numbering' },
    { icon: FileText, label: fr ? 'Suivi du statut (envoyé, vu, approuvé)' : 'Status tracking (sent, viewed, approved)' },
  ]

  const faqs = [
    {
      q: fr ? 'Puis-je utiliser mon catalogue de produits ?' : 'Can I use my product catalog?',
      a: fr ? 'Oui. Sélectionnez vos produits et services directement depuis votre catalogue pour créer une soumission en quelques clics.' : 'Yes. Select your products and services directly from your catalog to create a quote in a few clicks.',
    },
    {
      q: fr ? 'Mon client peut-il approuver en ligne ?' : 'Can my client approve online?',
      a: fr ? 'Oui. Votre client reçoit un lien par courriel et peut approuver la soumission d\'un seul clic, sans créer de compte.' : 'Yes. Your client receives a link by email and can approve the quote with a single click, without creating an account.',
    },
    {
      q: fr ? 'Puis-je convertir une soumission en facture ?' : 'Can I convert a quote to an invoice?',
      a: fr ? 'Oui. Une fois la soumission approuvée, convertissez-la en facture en un clic. Toutes les lignes, prix et taxes sont conservés.' : 'Yes. Once the quote is approved, convert it to an invoice with one click. All lines, prices, and taxes are preserved.',
    },
    {
      q: fr ? 'Les soumissions sont-elles numérotées ?' : 'Are quotes numbered?',
      a: fr ? 'Oui. Gestivio attribue un numéro séquentiel unique à chaque soumission pour un suivi professionnel.' : 'Yes. Gestivio assigns a unique sequential number to each quote for professional tracking.',
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
                {fr ? 'Un devis professionnel en quelques minutes' : 'A professional quote in minutes'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Créez des soumissions à partir de votre catalogue, envoyez-les par courriel et convertissez-les en factures dès qu\'elles sont approuvées.' : 'Create quotes from your catalog, send them by email and convert them to invoices as soon as they\'re approved.'}
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
                {fr ? 'Votre catalogue, vos prix, en quelques clics' : 'Your catalog, your prices, in a few clicks'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Sélectionnez les produits et services de votre catalogue, ajustez les quantités et votre soumission est prête. Les taxes sont calculées automatiquement.' : 'Select products and services from your catalog, adjust quantities and your quote is ready. Taxes are calculated automatically.'}
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
                {fr ? 'De la soumission à la facture en un clic' : 'From quote to invoice in one click'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Dès que votre client approuve en ligne, convertissez la soumission en facture instantanément. Aucune ressaisie nécessaire.' : 'As soon as your client approves online, convert the quote to an invoice instantly. No re-entry needed.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Des soumissions professionnelles en toute simplicité' : 'Professional quotes made simple'}
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
              {fr ? 'Prêt à envoyer des soumissions professionnelles ?' : 'Ready to send professional quotes?'}
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
