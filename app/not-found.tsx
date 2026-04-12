'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'
import { Wrench, Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const links = [
    { href: '/dashboard', label: fr ? 'Tableau de bord' : 'Dashboard' },
    { href: '/customers', label: fr ? 'Clients' : 'Customers' },
    { href: '/jobs', label: fr ? 'Interventions' : 'Jobs' },
    { href: '/invoices', label: fr ? 'Factures' : 'Invoices' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600">
            <Wrench className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* 404 */}
        <p className="text-8xl font-black text-indigo-600/10 leading-none mb-4 select-none">404</p>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {fr ? 'Page introuvable' : 'Page not found'}
        </h1>
        <p className="text-gray-500 mb-8">
          {fr
            ? "La page que vous cherchez n'existe pas ou a été déplacée."
            : "The page you're looking for doesn't exist or has been moved."}
        </p>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
          >
            <Home className="h-4 w-4" />
            {fr ? 'Accueil' : 'Home'}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            {fr ? 'Retour' : 'Go back'}
          </button>
        </div>
      </div>
    </div>
  )
}
