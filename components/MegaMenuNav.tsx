'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import GestivioLogo from '@/components/GestivioLogo'
import {
  Calendar,
  Users,
  FileText,
  Clock,
  CreditCard,
  Receipt,
  ClipboardList,
  Bot,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  User,
  BarChart3,
  Bell,
  Upload,
  LayoutDashboard,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ── Mega-menu item type ──────────────────────────────────────
interface MegaItem {
  icon: LucideIcon
  title: string
  titleEn: string
  subtitle: string
  subtitleEn: string
  href: string
}

const COL_TERRAIN: MegaItem[] = [
  { icon: Calendar, title: 'Interventions et calendrier', titleEn: 'Jobs & Calendar', subtitle: 'Planifiez chaque journée en secondes', subtitleEn: 'Plan every day in seconds', href: '/fonctionnalites/interventions' },
  { icon: Users, title: "Gestion d'équipe", titleEn: 'Team Management', subtitle: 'Assignez, suivez, coordonnez', subtitleEn: 'Assign, track, coordinate', href: '/fonctionnalites/equipe' },
  { icon: FileText, title: 'Contrats récurrents', titleEn: 'Recurring Contracts', subtitle: 'Gérez vos contrats saisonniers', subtitleEn: 'Manage your seasonal contracts', href: '/fonctionnalites/contrats' },
  { icon: Clock, title: 'Suivi du temps', titleEn: 'Time Tracking', subtitle: 'Feuilles de temps automatiques', subtitleEn: 'Automatic timesheets', href: '/fonctionnalites/suivi-temps' },
  { icon: Calendar, title: 'Calendrier', titleEn: 'Calendar', subtitle: 'Votre agenda toujours à jour', subtitleEn: 'Your schedule always up to date', href: '/fonctionnalites/calendrier' },
  { icon: User, title: 'Clients', titleEn: 'Clients', subtitle: 'Tout l\'historique en un clic', subtitleEn: 'Full history in one click', href: '/fonctionnalites/clients' },
]

const COL_BILLING: MegaItem[] = [
  { icon: CreditCard, title: 'Facturation professionnelle', titleEn: 'Professional Invoicing', subtitle: 'Une facture en 30 secondes', subtitleEn: 'An invoice in 30 seconds', href: '/fonctionnalites/facturation' },
  { icon: Receipt, title: 'Paiements en ligne', titleEn: 'Online Payments', subtitle: 'Encaissez le jour même', subtitleEn: 'Get paid same day', href: '/fonctionnalites/paiements' },
  { icon: ClipboardList, title: 'Soumissions', titleEn: 'Estimates', subtitle: 'Des devis approuvés en 1 clic', subtitleEn: 'Quotes approved in 1 click', href: '/fonctionnalites/soumissions' },
  { icon: BarChart3, title: 'Rapports', titleEn: 'Reports', subtitle: 'Comprenez vos chiffres', subtitleEn: 'Understand your numbers', href: '/fonctionnalites/rapports' },
  { icon: FileText, title: 'Devis', titleEn: 'Quotes', subtitle: 'Approuvés en ligne en 1 clic', subtitleEn: 'Approved online in 1 click', href: '/fonctionnalites/devis' },
]

const COL_AI: MegaItem[] = [
  { icon: Bot, title: 'Portail de réservation IA', titleEn: 'AI Booking Portal', subtitle: 'Vos clients réservent 24h/24', subtitleEn: 'Your clients book 24/7', href: '/fonctionnalites/portail-ia' },
  { icon: MessageSquare, title: 'Assistant IA', titleEn: 'AI Assistant', subtitle: 'Votre assistant toujours disponible', subtitleEn: 'Your always-available assistant', href: '/fonctionnalites/assistant-ia' },
]

const COL_PLUS: MegaItem[] = [
  { icon: Bell, title: 'Notifications', titleEn: 'Notifications', subtitle: 'Clients informés automatiquement', subtitleEn: 'Clients informed automatically', href: '/fonctionnalites/notifications' },
  { icon: Upload, title: 'Import de données', titleEn: 'Data Import', subtitle: 'Migrez en quelques minutes', subtitleEn: 'Migrate in minutes', href: '/fonctionnalites/import' },
  { icon: LayoutDashboard, title: 'Tableau de bord', titleEn: 'Dashboard', subtitle: 'Tout en un coup d\'oeil', subtitleEn: 'Everything at a glance', href: '/fonctionnalites/tableau-de-bord' },
]

// ── Column header labels ──────────────────────────────────────
const COL_HEADERS = {
  terrain: { fr: 'Opérations terrain', en: 'Field Operations' },
  billing: { fr: 'Facturation', en: 'Billing' },
  ai: { fr: 'Intelligence artificielle', en: 'Artificial Intelligence' },
  plus: { fr: 'Outils', en: 'Tools' },
}

// ── Mega-menu item renderer ──────────────────────────────────
function MegaMenuItem({ item, lang, onClick }: { item: MegaItem; lang: 'fr' | 'en'; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-indigo-50 transition-colors group"
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-indigo-100 transition-colors">
        <item.icon className="h-4.5 w-4.5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
          {lang === 'fr' ? item.title : item.titleEn}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {lang === 'fr' ? item.subtitle : item.subtitleEn}
        </p>
      </div>
    </Link>
  )
}

// ── Column renderer ──────────────────────────────────────────
function MegaColumn({ header, items, lang, onClick }: { header: { fr: string; en: string }; items: MegaItem[]; lang: 'fr' | 'en'; onClick?: () => void }) {
  return (
    <div>
      <p className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
        {lang === 'fr' ? header.fr : header.en}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <MegaMenuItem key={item.href} item={item} lang={lang} onClick={onClick} />
        ))}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────
export default function MegaMenuNav() {
  const { lang, setLang } = useLanguage()
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const megaRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close mega-menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close mobile menu on resize
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setMegaOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setMegaOpen(false), 200)
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <GestivioLogo forceDark />
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Fonctionnalites dropdown */}
            <div
              ref={megaRef}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => setMegaOpen(!megaOpen)}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {lang === 'fr' ? 'Fonctionnalités' : 'Features'}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega-menu panel */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-full pt-3 transition-all duration-200 ${
                  megaOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
              >
                <div className="w-[920px] rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/50">
                  <div className="grid grid-cols-4 gap-6">
                    <MegaColumn header={COL_HEADERS.terrain} items={COL_TERRAIN} lang={lang} onClick={() => setMegaOpen(false)} />
                    <MegaColumn header={COL_HEADERS.billing} items={COL_BILLING} lang={lang} onClick={() => setMegaOpen(false)} />
                    <MegaColumn header={COL_HEADERS.ai} items={COL_AI} lang={lang} onClick={() => setMegaOpen(false)} />
                    <MegaColumn header={COL_HEADERS.plus} items={COL_PLUS} lang={lang} onClick={() => setMegaOpen(false)} />
                  </div>
                </div>
              </div>
            </div>

            <Link href="/#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {lang === 'fr' ? 'Tarifs' : 'Pricing'}
            </Link>
            <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {lang === 'fr' ? 'Blogue' : 'Blog'}
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="hidden sm:flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button
                onClick={() => setLang('en')}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('fr')}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                FR
              </button>
            </div>

            <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {lang === 'fr' ? 'Se connecter' : 'Sign in'}
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all duration-150 hover:shadow-md"
            >
              {lang === 'fr' ? 'Essai gratuit' : 'Free trial'}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile slide-down ── */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-[90vh] border-t border-gray-100' : 'max-h-0'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6 overflow-y-auto max-h-[80vh] bg-white">
          {/* Fonctionnalites sections */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              {lang === 'fr' ? COL_HEADERS.terrain.fr : COL_HEADERS.terrain.en}
            </p>
            {COL_TERRAIN.map((item) => (
              <MegaMenuItem key={item.href} item={item} lang={lang} onClick={closeMobile} />
            ))}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              {lang === 'fr' ? COL_HEADERS.billing.fr : COL_HEADERS.billing.en}
            </p>
            {COL_BILLING.map((item) => (
              <MegaMenuItem key={item.href} item={item} lang={lang} onClick={closeMobile} />
            ))}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              {lang === 'fr' ? COL_HEADERS.ai.fr : COL_HEADERS.ai.en}
            </p>
            {COL_AI.map((item) => (
              <MegaMenuItem key={item.href} item={item} lang={lang} onClick={closeMobile} />
            ))}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              {lang === 'fr' ? COL_HEADERS.plus.fr : COL_HEADERS.plus.en}
            </p>
            {COL_PLUS.map((item) => (
              <MegaMenuItem key={item.href} item={item} lang={lang} onClick={closeMobile} />
            ))}
          </div>

          <hr className="border-gray-100" />

          {/* Direct links */}
          <div className="space-y-1">
            <Link href="/#pricing" onClick={closeMobile} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {lang === 'fr' ? 'Tarifs' : 'Pricing'}
            </Link>
            <Link href="/blog" onClick={closeMobile} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {lang === 'fr' ? 'Blogue' : 'Blog'}
            </Link>
            <Link href="/login" onClick={closeMobile} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {lang === 'fr' ? 'Se connecter' : 'Sign in'}
            </Link>
          </div>

          {/* Language toggle (mobile) */}
          <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5 w-fit">
            <button
              onClick={() => setLang('en')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('fr')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              FR
            </button>
          </div>

          {/* CTA */}
          <Link
            href="/signup"
            onClick={closeMobile}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            {lang === 'fr' ? 'Essai gratuit' : 'Free trial'}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  )
}
