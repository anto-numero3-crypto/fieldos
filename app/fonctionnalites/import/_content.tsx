'use client'

import Link from 'next/link'
import { ArrowRight, Upload, Download, Users, FileText, CheckCircle, Loader, Mail, ChevronDown } from 'lucide-react'
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

export default function ImportContent() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const features = [
    { icon: Users, label: fr ? 'Import de clients' : 'Client import' },
    { icon: FileText, label: fr ? 'Import de factures' : 'Invoice import' },
    { icon: Upload, label: fr ? 'Traitement en lot (10 000+ lignes)' : 'Batch processing (10,000+ rows)' },
    { icon: CheckCircle, label: fr ? 'Detection de doublons' : 'Duplicate detection' },
    { icon: Loader, label: fr ? 'Suivi de progression' : 'Progress tracking' },
    { icon: Mail, label: fr ? 'Courriel quand c\'est termine' : 'Email when done' },
  ]

  const steps = [
    { num: '1', title: fr ? 'Telechargez le modele CSV' : 'Download the CSV template', desc: fr ? 'Recuperez notre modele pre-formate pour savoir exactement quelles colonnes remplir.' : 'Get our pre-formatted template to know exactly which columns to fill.' },
    { num: '2', title: fr ? 'Remplissez avec vos donnees' : 'Fill with your data', desc: fr ? 'Copiez-collez vos clients, factures ou produits depuis votre fichier existant.' : 'Copy-paste your clients, invoices, or products from your existing file.' },
    { num: '3', title: fr ? 'Telechargez et importez' : 'Upload and import', desc: fr ? 'Deposez le fichier dans Gestivio. L\'import demarre et vous recevez un courriel une fois termine.' : 'Drop the file into Gestivio. The import starts and you receive an email when done.' },
  ]

  const faqs = [
    {
      q: fr ? 'Quels formats de fichier sont acceptes ?' : 'What file formats are accepted?',
      a: fr ? 'Gestivio accepte les fichiers CSV (comma-separated values). Vous pouvez exporter en CSV depuis Excel, Google Sheets ou la plupart des logiciels.' : 'Gestivio accepts CSV (comma-separated values) files. You can export to CSV from Excel, Google Sheets, or most software.',
    },
    {
      q: fr ? 'Combien de lignes puis-je importer ?' : 'How many rows can I import?',
      a: fr ? 'Il n\'y a pas de limite pratique. Le systeme gere facilement des fichiers de plus de 10 000 lignes. Les imports sont traites en arriere-plan.' : 'There is no practical limit. The system easily handles files with over 10,000 rows. Imports are processed in the background.',
    },
    {
      q: fr ? 'Que se passe-t-il si j\'ai des doublons ?' : 'What happens if I have duplicates?',
      a: fr ? 'Gestivio detecte les doublons (par courriel ou telephone) et vous les signale avant l\'import. Vous decidez de les ignorer ou de les mettre a jour.' : 'Gestivio detects duplicates (by email or phone) and flags them before import. You decide to skip or update them.',
    },
    {
      q: fr ? 'Puis-je annuler un import ?' : 'Can I undo an import?',
      a: fr ? 'Oui. Apres un import, vous pouvez annuler l\'operation en lot dans les 24 heures suivantes si necessaire.' : 'Yes. After an import, you can undo the operation in bulk within the next 24 hours if needed.',
    },
  ]

  const related = [
    { href: '/fonctionnalites/clients', label: fr ? 'Clients' : 'Clients' },
    { href: '/fonctionnalites/facturation', label: fr ? 'Facturation' : 'Invoicing' },
    { href: '/fonctionnalites/rapports', label: fr ? 'Rapports' : 'Reports' },
  ]

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Migrez vers Gestivio en quelques minutes' : 'Migrate to Gestivio in minutes'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr ? 'Fini de ressaisir toutes vos donnees a la main. Importez vos clients et factures en un seul fichier CSV.' : 'No more re-entering all your data by hand. Import your clients and invoices in a single CSV file.'}
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
                {fr ? 'Avant : des heures de saisie manuelle' : 'Before: hours of manual data entry'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Changer de logiciel signifie re-entrer chaque client, chaque facture, une par une. Ca peut prendre des jours.' : 'Switching software means re-entering every client, every invoice, one by one. It can take days.'}
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Apres : un import en quelques clics' : 'After: an import in a few clicks'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Exportez vos donnees existantes en CSV, deposez le fichier dans Gestivio et tout est importe automatiquement. 5 minutes maximum.' : 'Export your existing data as CSV, drop the file into Gestivio, and everything is imported automatically. 5 minutes max.'}
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
            {fr ? 'Un import robuste et fiable' : 'A robust and reliable import'}
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
                {fr ? 'Detection intelligente des doublons' : 'Smart duplicate detection'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Gestivio compare vos imports avec vos donnees existantes et vous signale les doublons potentiels. Vous decidez de les ignorer ou de mettre a jour les fiches.' : 'Gestivio compares your imports with existing data and flags potential duplicates. You decide to skip or update the records.'}
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
                {fr ? 'Suivi en temps reel de votre import' : 'Real-time tracking of your import'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr ? 'Suivez la progression de votre import en temps reel. Une barre de progression vous montre ou vous en etes et un courriel vous previent une fois termine.' : 'Track your import progress in real time. A progress bar shows you where you are, and an email notifies you once done.'}
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
              {fr ? 'Pret a migrer vos donnees ?' : 'Ready to migrate your data?'}
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
