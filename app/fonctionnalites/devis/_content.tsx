'use client'

import Link from 'next/link'
import { ArrowRight, FileText, ListChecks, Mail, CheckCircle, RefreshCw, Edit, Download, ChevronDown } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import { MockupInvoice, MockupQuote } from '@/components/mockups'
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
      {open && <p className="pb-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{answer}</p>}
    </div>
  )
}

export default function DevisContent() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: ListChecks, label: fr ? 'Catalogue de produits et services' : 'Product and service catalog' },
    { icon: FileText, label: fr ? 'Mise en page professionnelle' : 'Professional layout' },
    { icon: Mail, label: fr ? 'Envoi par courriel' : 'Email delivery' },
    { icon: CheckCircle, label: fr ? 'Approbation en ligne' : 'Online approval' },
    { icon: Edit, label: fr ? 'Demandes de modification' : 'Modification requests' },
    { icon: RefreshCw, label: fr ? 'Conversion automatique en facture' : 'Auto convert to invoice' },
    { icon: Download, label: fr ? 'Export PDF' : 'PDF export' },
  ]

  const steps = [
    { num: '1', title: fr ? 'Creez depuis votre catalogue' : 'Create from your catalog', desc: fr ? 'Selectionnez vos produits et services, ajustez les quantites et le devis est pret en quelques clics.' : 'Select your products and services, adjust quantities, and the quote is ready in a few clicks.' },
    { num: '2', title: fr ? 'Envoyez au client' : 'Send to the client', desc: fr ? 'Envoyez le devis par courriel d\'un clic. Votre client recoit un lien pour le consulter en ligne.' : 'Send the quote by email with one click. Your client receives a link to view it online.' },
    { num: '3', title: fr ? 'Le client approuve en ligne' : 'Client approves online', desc: fr ? 'Votre client peut approuver, demander une modification ou refuser — tout en ligne, sans compte a creer.' : 'Your client can approve, request a change, or decline — all online, no account needed.' },
  ]

  const faqs = [
    {
      q: fr ? 'Mon client peut-il approuver sans creer de compte ?' : 'Can my client approve without creating an account?',
      a: fr ? 'Oui. Votre client recoit un lien unique par courriel et peut approuver le devis en un seul clic, sans inscription.' : 'Yes. Your client receives a unique link by email and can approve the quote in a single click, without signing up.',
    },
    {
      q: fr ? 'Puis-je convertir un devis approuve en facture ?' : 'Can I convert an approved quote to an invoice?',
      a: fr ? 'Oui. Une fois le devis approuve, convertissez-le en facture en un clic. Toutes les lignes, prix et taxes sont conserves.' : 'Yes. Once the quote is approved, convert it to an invoice with one click. All lines, prices, and taxes are preserved.',
    },
    {
      q: fr ? 'Le client peut-il demander une modification ?' : 'Can the client request a modification?',
      a: fr ? 'Oui. Si le client souhaite un ajustement, il peut envoyer une demande de modification directement depuis le devis en ligne. Vous recevez une notification.' : 'Yes. If the client wants an adjustment, they can send a modification request directly from the online quote. You receive a notification.',
    },
  ]

  const related = [
    { href: '/fonctionnalites/facturation', label: fr ? 'Facturation' : 'Invoicing' },
    { href: '/fonctionnalites/contrats', label: fr ? 'Contrats' : 'Contracts' },
    { href: '/fonctionnalites/clients', label: fr ? 'Clients' : 'Customers' },
  ]

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
                {fr ? 'Des devis professionnels approuves en 1 clic' : 'Professional quotes approved in 1 click'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Fini le processus de devis qui traine. Creez, envoyez et faites approuver vos devis en ligne en quelques minutes.' : 'No more dragging quote process. Create, send, and get your quotes approved online in minutes.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"><div className="overflow-x-auto"><div className="min-w-[600px]"><MockupQuote /></div></div></div>
          </div>
        </div>
      </section>

      {/* Avant / Apres */}
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Avant : un processus de devis qui traine' : 'Before: a slow quoting process'}
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr ? 'Vous redigez un devis dans Word, l\'envoyez par courriel, attendez une reponse, relancez, puis ressaisissez tout pour la facture. Des jours perdus.' : 'You draft a quote in Word, email it, wait for a response, follow up, then re-enter everything for the invoice. Days lost.'}
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Apres : du devis a la facture en minutes' : 'After: from quote to invoice in minutes'}
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr ? 'Creez le devis depuis votre catalogue, envoyez-le en un clic, le client approuve en ligne et vous le convertissez en facture instantanement.' : 'Create the quote from your catalog, send it in one click, the client approves online, and you convert it to an invoice instantly.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Steps */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {fr ? 'Comment ca fonctionne' : 'How it works'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-lg font-bold">{s.num}</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities grid */}
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {fr ? 'Des devis professionnels en toute simplicite' : 'Professional quotes made simple'}
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
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Une mise en page qui inspire confiance' : 'A layout that inspires trust'}
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr ? 'Vos devis sont generes avec votre logo, vos coordonnees et une mise en page professionnelle. Votre client recoit un document digne d\'une grande entreprise.' : 'Your quotes are generated with your logo, contact info, and professional layout. Your client receives a document worthy of a large company.'}
              </p>
            </div>
            <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"><div className="overflow-x-auto"><div className="min-w-[600px]"><MockupQuote /></div></div></div>
          </div>
        </div>
      </section>

      {/* Detail section 2 */}
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 w-full rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"><div className="overflow-x-auto"><div className="min-w-[600px]"><MockupInvoice /></div></div></div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Du devis a la facture en un clic' : 'From quote to invoice in one click'}
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr ? 'Des que votre client approuve le devis, convertissez-le en facture instantanement. Toutes les lignes, quantites, prix et taxes sont conserves.' : 'As soon as your client approves the quote, convert it to an invoice instantly. All lines, quantities, prices, and taxes are preserved.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">
            {fr ? 'Questions frequentes' : 'Frequently asked questions'}
          </h2>
          <div className="divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
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
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-indigo-600 px-8 py-14 text-center">
            <h2 className="text-3xl font-bold text-white">
              {fr ? 'Pret a envoyer des devis professionnels ?' : 'Ready to send professional quotes?'}
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
