'use client'

import Link from 'next/link'
import { FileText, Mail, ArrowRight } from 'lucide-react'
import GestivioLogo from '@/components/GestivioLogo'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function PressPage() {
  const { lang } = useLanguage()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <LanguageToggle />
      </div>

      <nav className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <GestivioLogo />
          </Link>
        </div>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-6">
          <FileText className="h-8 w-8 text-indigo-400" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">
          {lang === 'fr' ? 'Médias' : 'Media'}
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          {lang === 'fr' ? 'Presse et médias' : 'Press & Media'}
        </h1>
        <p className="text-lg text-gray-500 max-w-md mb-4">
          {lang === 'fr'
            ? 'Pour les demandes de presse, les demandes d\'entrevue ou pour accéder à notre trousse média, veuillez nous contacter directement.'
            : 'For press inquiries, interview requests, or to access our media kit, please reach out directly.'}
        </p>
        <div className="flex items-center gap-2 text-gray-500 mb-8">
          <Mail className="h-4 w-4" />
          <a href="mailto:support@gestivio.ca" className="text-indigo-600 hover:underline">support@gestivio.ca</a>
        </div>
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
