import Link from 'next/link'
import { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import NewsletterSignup from './NewsletterSignup'
import GestivioLogo from '@/components/GestivioLogo'

export default function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8 sticky top-0 bg-white/90 backdrop-blur-sm z-30">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <GestivioLogo forceDark />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/pricing" className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-gray-900">Tarifs</Link>
            <Link href="/contact" className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-gray-900">Contact</Link>
            <Link href="/about" className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-gray-900">À propos</Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Connexion</Link>
            <Link href="/signup" className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              Essayer <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-100 bg-gray-50 mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <GestivioLogo forceDark />
            </Link>
            <p className="text-sm text-gray-500">La plateforme pour les entrepreneurs en services. Fait au Québec 🍁.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Ressources</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/pricing" className="hover:text-gray-900">Tarifs</Link></li>
              <li><Link href="/about" className="hover:text-gray-900">À propos</Link></li>
              <li><Link href="/contact" className="hover:text-gray-900">Contact</Link></li>
              <li><Link href="/montreal" className="hover:text-gray-900">Montréal</Link></li>
              <li><Link href="/vs/jobber" className="hover:text-gray-900">Gestivio vs Jobber</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Infolettre</p>
            <NewsletterSignup compact />
          </div>
        </div>
        <div className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Gestivio Inc. · Fait au Québec · Données hébergées au Canada</p>
        </div>
      </footer>
    </div>
  )
}
