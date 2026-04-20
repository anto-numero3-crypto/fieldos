'use client'

import Link from 'next/link'
import { ArrowRight, FileText, CreditCard, Mail, Hash, Eye, Sparkles, ChevronDown } from 'lucide-react'
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

export default function FacturationPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: Sparkles, label: fr ? 'Création assistée par IA' : 'AI-assisted creation' },
    { icon: FileText, label: fr ? 'Catalogue de produits et services' : 'Product and service catalog' },
    { icon: Hash, label: fr ? 'Numérotation séquentielle automatique' : 'Automatic sequential numbering' },
    { icon: CreditCard, label: fr ? 'Calcul TPS/TVQ automatique' : 'Automatic GST/QST calculation' },
    { icon: Mail, label: fr ? 'Envoi par courriel en un clic' : 'One-click email sending' },
    { icon: Eye, label: fr ? 'Suivi "vu X fois" par le client' : '"Viewed X times" client tracking' },
  ]

  const faqs = [
    {
      q: fr ? 'Les taxes TPS/TVQ sont-elles calculées automatiquement ?' : 'Are GST/QST taxes calculated automatically?',
      a: fr ? 'Oui. Gestivio applique automatiquement la TPS (5 %) et la TVQ (9,975 %) sur vos lignes de facture selon vos paramètres.' : 'Yes. Gestivio automatically applies GST (5%) and QST (9.975%) to your invoice lines based on your settings.',
    },
    {
      q: fr ? 'Puis-je personnaliser le look de mes factures ?' : 'Can I customize my invoice look?',
      a: fr ? 'Oui. Ajoutez votre logo, vos couleurs et vos coordonnées pour des factures à votre image.' : 'Yes. Add your logo, colors, and contact info for branded invoices.',
    },
    {
      q: fr ? 'Comment fonctionne la numérotation séquentielle ?' : 'How does sequential numbering work?',
      a: fr ? 'Gestivio attribue automatiquement un numéro unique et séquentiel à chaque facture. Vous pouvez personnaliser le préfixe.' : 'Gestivio automatically assigns a unique sequential number to each invoice. You can customize the prefix.',
    },
    {
      q: fr ? 'Mon client peut-il payer directement depuis la facture ?' : 'Can my client pay directly from the invoice?',
      a: fr ? 'Oui. Chaque facture envoyée par courriel contient un bouton de paiement en ligne sécurisé via Stripe.' : 'Yes. Every emailed invoice includes a secure online payment button via Stripe.',
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
                {fr ? 'Une facture professionnelle en moins de 30 secondes' : 'A professional invoice in under 30 seconds'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Créez des factures conformes, envoyez-les par courriel et encaissez en ligne. Tout depuis votre téléphone ou votre ordinateur.' : 'Create compliant invoices, send them by email and collect payments online. All from your phone or computer.'}
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
                {fr ? 'L\'IA rédige votre facture pour vous' : 'AI drafts your invoice for you'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Décrivez le travail effectué et Gestivio génère automatiquement les lignes de facture avec les bons produits, quantités et prix de votre catalogue.' : 'Describe the work done and Gestivio automatically generates invoice lines with the right products, quantities, and prices from your catalog.'}
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
                {fr ? 'Sachez quand votre client ouvre sa facture' : 'Know when your client opens their invoice'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Le suivi "vu X fois" vous indique si votre client a consulté sa facture. Plus besoin de relancer à l\'aveugle.' : 'The "viewed X times" tracker tells you if your client has seen their invoice. No more blind follow-ups.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Une facturation complète et conforme' : 'Complete and compliant invoicing'}
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
              {fr ? 'Prêt à simplifier votre facturation ?' : 'Ready to simplify your invoicing?'}
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
