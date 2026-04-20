import Link from 'next/link'
import { ReactNode } from 'react'
import NewsletterSignup from './NewsletterSignup'
import GestivioLogo from '@/components/GestivioLogo'
import MegaMenuNav from './MegaMenuNav'

export default function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MegaMenuNav />

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
