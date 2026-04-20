'use client'

import Link from 'next/link'
import { ArrowRight, CreditCard, Smartphone, Receipt, Zap, Shield, ChevronDown } from 'lucide-react'
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

export default function PaiementsPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: CreditCard, label: fr ? 'Carte de crédit et débit acceptées' : 'Credit and debit cards accepted' },
    { icon: Smartphone, label: fr ? 'Apple Pay et Google Pay' : 'Apple Pay and Google Pay' },
    { icon: Receipt, label: fr ? 'Reçu instantané par courriel' : 'Instant email receipt' },
    { icon: Zap, label: fr ? 'Enregistrement automatique dans Gestivio' : 'Auto-recorded in Gestivio' },
    { icon: Shield, label: fr ? 'Paiements sécurisés via Stripe' : 'Secure payments via Stripe' },
    { icon: CreditCard, label: fr ? 'Dépôt direct dans votre compte' : 'Direct deposit to your account' },
  ]

  const faqs = [
    {
      q: fr ? 'Quels modes de paiement sont acceptés ?' : 'What payment methods are accepted?',
      a: fr ? 'Visa, Mastercard, American Express, cartes de débit, Apple Pay et Google Pay.' : 'Visa, Mastercard, American Express, debit cards, Apple Pay, and Google Pay.',
    },
    {
      q: fr ? 'Combien coûtent les frais de transaction ?' : 'How much are transaction fees?',
      a: fr ? 'Les frais sont ceux de Stripe : 2,9 % + 0,30 $ par transaction. Gestivio ne prend aucune commission supplémentaire.' : 'Fees are Stripe\'s standard: 2.9% + $0.30 per transaction. Gestivio takes no additional commission.',
    },
    {
      q: fr ? 'En combien de temps l\'argent est-il dans mon compte ?' : 'How fast do I get paid?',
      a: fr ? 'Stripe effectue les virements selon votre calendrier configuré, généralement en 2 jours ouvrables.' : 'Stripe transfers funds based on your configured schedule, typically within 2 business days.',
    },
    {
      q: fr ? 'Les paiements sont-ils sécurisés ?' : 'Are payments secure?',
      a: fr ? 'Oui. Tous les paiements passent par Stripe, certifié PCI-DSS niveau 1. Gestivio ne stocke jamais les données de carte.' : 'Yes. All payments go through Stripe, PCI-DSS Level 1 certified. Gestivio never stores card data.',
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
                {fr ? 'Encaissez le jour même, pas dans 30 jours' : 'Get paid today, not in 30 days'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Vos clients paient en ligne directement depuis leur facture. L\'argent arrive dans votre compte sans délai.' : 'Your clients pay online directly from their invoice. Money arrives in your account without delay.'}
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
                {fr ? 'Un bouton « Payer » sur chaque facture' : 'A "Pay" button on every invoice'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Votre client reçoit sa facture par courriel, clique sur le bouton et paie en quelques secondes. Le paiement est automatiquement enregistré.' : 'Your client receives their invoice by email, clicks the button and pays in seconds. The payment is automatically recorded.'}
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
                {fr ? 'Reçu automatique, comptabilité à jour' : 'Automatic receipt, up-to-date books'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Dès le paiement reçu, un reçu est envoyé au client et la facture passe automatiquement au statut « Payé » dans Gestivio.' : 'As soon as payment is received, a receipt is sent to the client and the invoice automatically changes to "Paid" status in Gestivio.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Des paiements simples et sécurisés' : 'Simple and secure payments'}
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
              {fr ? 'Prêt à être payé plus vite ?' : 'Ready to get paid faster?'}
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
