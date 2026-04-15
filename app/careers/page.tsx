'use client'

import Link from 'next/link'
import { Wrench, Clock, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function CareersPage() {
  const { lang } = useLanguage()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <LanguageToggle />
      </div>

      <nav className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600"><Wrench className="h-4 w-4 text-white" strokeWidth={2.5} /></div>
            <span className="text-base font-bold text-gray-900">Gestivio</span>
          </Link>
        </div>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-6">
          <Clock className="h-8 w-8 text-indigo-400" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">
          {lang === 'fr' ? 'Bientôt disponible' : 'Coming Soon'}
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          {lang === 'fr' ? 'Nous embauchons' : 'We\'re Hiring'}
        </h1>
        <p className="text-lg text-gray-500 max-w-md mb-4">
          {lang === 'fr'
            ? 'Nous sommes une petite équipe en croissance basée au Québec, Canada. Les postes ouverts seront affichés ici bientôt.'
            : 'We\'re a small but growing team based in Québec, Canada. Open positions will be listed here soon.'}
        </p>
        <p className="text-gray-500 mb-8">
          {lang === 'fr' ? 'Entre-temps, envoyez votre CV à ' : 'In the meantime, send your résumé to '}
          <a href="mailto:jobs@gestivio.ca" className="text-indigo-600 hover:underline">jobs@gestivio.ca</a>
        </p>
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
          {lang === 'fr' ? 'Retour à l\'accueil' : 'Back to homepage'} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio</p>
      </footer>
    </div>
  )
}
