'use client'

import Link from 'next/link'
import { ArrowRight, User, Phone, Briefcase, FileText, StickyNote, Search, Upload, Tag, ChevronDown } from 'lucide-react'
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

export default function ClientsContent() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: User, label: fr ? 'Profil complet par client' : 'Full client profile' },
    { icon: Phone, label: fr ? 'Coordonnees et adresses' : 'Contact info and addresses' },
    { icon: Briefcase, label: fr ? 'Historique des interventions' : 'Job history' },
    { icon: FileText, label: fr ? 'Historique des factures' : 'Invoice history' },
    { icon: StickyNote, label: fr ? 'Notes et commentaires' : 'Notes and comments' },
    { icon: Search, label: fr ? 'Recherche et filtres avances' : 'Advanced search and filters' },
    { icon: Upload, label: fr ? 'Import CSV en lot' : 'Bulk CSV import' },
    { icon: Tag, label: fr ? 'Tags et categories' : 'Tags and categories' },
  ]

  const steps = [
    { num: '1', title: fr ? 'Ajoutez un client' : 'Add a client', desc: fr ? 'Entrez les coordonnees ou importez votre liste existante en CSV.' : 'Enter contact info or import your existing list via CSV.' },
    { num: '2', title: fr ? 'Consignez les interactions' : 'Log interactions', desc: fr ? 'Chaque intervention, facture et note est liee automatiquement au profil.' : 'Every job, invoice, and note is automatically linked to the profile.' },
    { num: '3', title: fr ? 'Accedez a l\'historique partout' : 'Access history anywhere', desc: fr ? 'Consultez le dossier complet depuis votre telephone ou votre ordinateur.' : 'View the full file from your phone or computer.' },
  ]

  const faqs = [
    {
      q: fr ? 'Puis-je importer mes clients depuis Excel ?' : 'Can I import my clients from Excel?',
      a: fr ? 'Oui. Exportez votre fichier Excel en CSV et importez-le directement dans Gestivio. Les doublons sont detectes automatiquement.' : 'Yes. Export your Excel file as CSV and import it directly into Gestivio. Duplicates are detected automatically.',
    },
    {
      q: fr ? 'Y a-t-il une limite au nombre de clients ?' : 'Is there a limit to the number of clients?',
      a: fr ? 'Non. Vous pouvez ajouter autant de clients que necessaire, sans limite et sans frais supplementaires.' : 'No. You can add as many clients as you need, with no limit and no extra fees.',
    },
    {
      q: fr ? 'Puis-je voir tout l\'historique d\'un client ?' : 'Can I see a client\'s full history?',
      a: fr ? 'Oui. Le profil client affiche toutes les interventions, factures, paiements et notes associes en un seul endroit.' : 'Yes. The client profile shows all associated jobs, invoices, payments, and notes in one place.',
    },
    {
      q: fr ? 'Comment fonctionnent les tags ?' : 'How do tags work?',
      a: fr ? 'Creez des tags personnalises (ex. VIP, residentiel, commercial) et assignez-les a vos clients pour filtrer rapidement.' : 'Create custom tags (e.g., VIP, residential, commercial) and assign them to clients for quick filtering.',
    },
  ]

  const related = [
    { href: '/fonctionnalites/interventions', label: fr ? 'Interventions' : 'Jobs' },
    { href: '/fonctionnalites/facturation', label: fr ? 'Facturation' : 'Invoicing' },
    { href: '/fonctionnalites/import', label: fr ? 'Import de donnees' : 'Data Import' },
  ]

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Tous vos clients. Toute leur histoire.' : 'All your clients. Their entire history.'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Fini les infos dispersees dans des carnets et fichiers Excel. Centralisez tout sur chaque client en un seul endroit accessible partout.' : 'No more info scattered across notebooks and Excel files. Centralize everything about each client in one place, accessible anywhere.'}
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
                {fr ? 'Avant : des informations partout sauf au bon endroit' : 'Before: information everywhere except where you need it'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Numeros de telephone dans un carnet, adresses dans un fichier, historique dans votre tete. Quand un client appelle, vous cherchez partout.' : 'Phone numbers in a notebook, addresses in a file, history in your head. When a client calls, you search everywhere.'}
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Apres : tout en un seul clic' : 'After: everything in one click'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Ouvrez le profil du client et voyez ses coordonnees, ses interventions passees, ses factures et vos notes. Tout est la.' : 'Open the client profile and see their contact info, past jobs, invoices, and your notes. Everything is there.'}
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
            {fr ? 'Tout pour gerer vos clients efficacement' : 'Everything to manage clients efficiently'}
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
                {fr ? 'Un dossier client complet et toujours a jour' : 'A complete, always up-to-date client file'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Chaque intervention terminee, chaque facture envoyee et chaque paiement recu est automatiquement ajoute au profil du client. Aucune saisie manuelle requise.' : 'Every completed job, every sent invoice, and every received payment is automatically added to the client profile. No manual entry required.'}
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
                {fr ? 'Retrouvez n\'importe quel client en 2 secondes' : 'Find any client in 2 seconds'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Cherchez par nom, telephone, adresse ou tag. Les filtres avances vous permettent de segmenter vos clients par type, frequence ou statut.' : 'Search by name, phone, address, or tag. Advanced filters let you segment clients by type, frequency, or status.'}
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
              {fr ? 'Pret a centraliser vos clients ?' : 'Ready to centralize your clients?'}
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
