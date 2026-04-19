'use client'

import Link from 'next/link'
import { Target, Heart, Zap, Globe, ArrowRight } from 'lucide-react'
import GestivioLogo from '@/components/GestivioLogo'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function AboutPage() {
  const { lang } = useLanguage()

  const values = [
    {
      icon: Target,
      title: lang === 'fr' ? 'Le client d\'abord' : 'Customer-first',
      description: lang === 'fr'
        ? 'Chaque fonctionnalité commence par une question : est-ce que cela aide nos clients à réussir ? Nous écoutons sans relâche et livrons ce qui compte.'
        : 'Every feature we build starts with one question: does this make our customers more successful? We listen obsessively and ship what matters.',
    },
    {
      icon: Zap,
      title: lang === 'fr' ? 'Avancer vite' : 'Move fast',
      description: lang === 'fr'
        ? 'Nous croyons à livrer rapidement, apprendre des retours réels et itérer. Le parfait est l\'ennemi du livré — nous préférons l\'utile.'
        : 'We believe in shipping fast, learning from real feedback, and iterating. Perfect is the enemy of shipped — we prefer useful.',
    },
    {
      icon: Heart,
      title: lang === 'fr' ? 'Conçu avec soin' : 'Built with care',
      description: lang === 'fr'
        ? 'Gestivio est conçu avec fierté au Québec, Canada. Nous tenons à la qualité, la fiabilité et la confiance que nos clients nous accordent.'
        : 'Gestivio is crafted with pride in Québec, Canada. We care deeply about quality, reliability, and the trust our customers place in us.',
    },
    {
      icon: Globe,
      title: lang === 'fr' ? 'Bilingue par défaut' : 'Bilingual by default',
      description: lang === 'fr'
        ? 'Le Canada mérite un logiciel qui fonctionne dans les deux langues officielles. Gestivio est conçu en français d\'abord, pas en ajout.'
        : 'Canada deserves software that works in both official languages. Gestivio is built French-first, not French as an afterthought.',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <LanguageToggle />
      </div>

      <nav className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <GestivioLogo />
          </Link>
          <Link href="/login" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            {lang === 'fr' ? 'Commencer' : 'Get started'} <ArrowRight className="inline h-3.5 w-3.5 ml-1" />
          </Link>
        </div>
      </nav>

      <section className="py-20 bg-gradient-to-b from-indigo-50/40 to-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-4">
            {lang === 'fr' ? 'Notre histoire' : 'Our Story'}
          </p>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl leading-tight">
            {lang === 'fr' ? (
              <>Conçu par des professionnels du service,<br />pour des professionnels du service</>
            ) : (
              <>Built by field service operators,<br />for field service operators</>
            )}
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {lang === 'fr'
              ? 'Gestivio est né d\'une frustration. Trop de gens de métier et d\'entreprises de service talentueux étaient submergés par la paperasse, couraient après les factures et perdaient la trace de leurs contrats — tandis que leur logiciel d\'entreprise était conçu pour quelqu\'un d\'autre.'
              : 'Gestivio was born out of frustration. Too many great tradespeople and service businesses were drowning in paperwork, chasing invoices, and losing track of jobs — while their enterprise software was built for someone else.'}
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-12 sm:px-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {lang === 'fr' ? 'Notre mission' : 'Our Mission'}
            </h2>
            <p className="text-lg text-indigo-100 leading-relaxed max-w-2xl mx-auto">
              {lang === 'fr'
                ? 'Donner à chaque entreprise de service — peu importe sa taille — l\'accès à des outils de calibre entreprise qui les rendent plus efficaces, plus professionnels et plus rentables.'
                : 'To give every field service business — no matter how small — access to enterprise-grade tools that make them more efficient, more professional, and more profitable.'}
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {lang === 'fr' ? 'Pourquoi nous avons créé Gestivio' : 'Why we built Gestivio'}
          </h2>
          <div className="space-y-5 text-gray-600 leading-relaxed">
            <p>
              {lang === 'fr'
                ? 'Les professionnels du service — plombiers, électriciens, techniciens CVC, nettoyeurs, paysagistes — passent des heures chaque semaine sur la paperasse, à courir après les factures et à jongler avec les horaires. La plupart des logiciels existants sont soit conçus pour un autre marché, soit disponibles uniquement en anglais, soit bien trop coûteux pour une petite entreprise.'
                : 'Service professionals — plumbers, electricians, HVAC techs, cleaners, landscapers — spend hours every week on paperwork, chasing invoices, and juggling schedules. Most existing software is either built for a different market, only available in English, or far too expensive for a small operation.'}
            </p>
            <p>
              {lang === 'fr'
                ? 'Gestivio a été conçu pour combler cet écart. Une plateforme moderne pour les professionnels du service à travers le Canada, bilingue dès le premier jour, avec gestion des taxes canadiennes et hébergement des données intégrés — pas rajoutés.'
                : 'Gestivio was built to close that gap. A modern platform designed for service professionals across Canada, bilingual from day one, with Canadian tax handling and data residency built in — not bolted on.'}
            </p>
            <p>
              {lang === 'fr'
                ? 'Notre objectif est simple : donner à chaque entreprise de service, peu importe sa taille, des outils qui leur permettent d\'avoir l\'air professionnel, d\'être payés plus vite et de passer moins de temps sur l\'administratif et plus de temps sur le terrain.'
                : 'Our goal is simple: give every service business, no matter the size, the kind of tools that let them look professional, get paid faster, and spend less time on admin and more time on the job.'}
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              {lang === 'fr' ? 'Nos valeurs' : 'What we believe in'}
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 mb-4">
                  <v.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {lang === 'fr' ? 'Prêt à nous rejoindre ?' : 'Ready to join us?'}
          </h2>
          <p className="text-gray-500 mb-8">
            {lang === 'fr' ? 'Commencez votre essai gratuit de 14 jours. Aucune carte de crédit requise.' : 'Start your free 14-day trial. No credit card required.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white hover:bg-indigo-700 transition-colors">
              {lang === 'fr' ? 'Essai gratuit' : 'Start free trial'}
            </Link>
            <Link href="/contact" className="rounded-xl border border-gray-200 px-8 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              {lang === 'fr' ? 'Nous contacter' : 'Contact us'}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. {lang === 'fr' ? 'Fait avec ❤️ au Québec, Canada 🍁' : 'Made with ❤️ in Québec, Canada 🍁'}</p>
      </footer>
    </div>
  )
}
