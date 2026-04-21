'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { PLAN_PRICING, PLAN_LIMITS } from '@/lib/plan-limits'
import MegaMenuNav from '@/components/MegaMenuNav'
import GestivioLogo from '@/components/GestivioLogo'
import MockupMobileDashboard from '@/components/mockups/MockupMobileDashboard'
import MockupCalendar from '@/components/mockups/MockupCalendar'
import MockupInvoice from '@/components/mockups/MockupInvoice'
import MockupChat from '@/components/mockups/MockupChat'
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Calendar,
  CreditCard,
  Bot,
  Users,
  FileText,
  Phone,
  ClipboardX,
  Moon,
  PhoneOff,
  UserX,
  MapPin,
  Shield,
  Globe,
  Leaf,
  MessageSquare,
  Zap,
  UserPlus,
  ListPlus,
  Play,
} from 'lucide-react'

// ── Scroll-reveal hook ────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ── FAQ Accordion ─────────────────────────────────────────────
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-base font-semibold text-gray-900 dark:text-white pr-4">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96 pb-5' : 'max-h-0'}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function LandingPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  // ── Pricing plans from plan-limits ──
  const plans = (['demarrage', 'pro', 'croissance'] as const).map((key) => {
    const p = PLAN_PRICING[key]
    const lim = PLAN_LIMITS[key]
    return { key, p, lim }
  })

  const pricingFeatures: Record<string, string[]> = {
    demarrage: fr
      ? ['1 utilisateur', "Jusqu'à 50 clients", '25 interventions / mois', '30 messages IA / mois', 'Facturation illimitée', 'Paiements en ligne via Stripe', 'Support courriel']
      : ['1 user', 'Up to 50 customers', '25 jobs / month', '30 AI messages / month', 'Unlimited invoicing', 'Online payments via Stripe', 'Email support'],
    pro: fr
      ? ['Tout illimité + IA', "Jusqu'à 5 utilisateurs", 'Gestion d\'équipe', 'Contrats récurrents', 'Suivi du temps', 'Export CSV + rapports complets', 'Support prioritaire']
      : ['Everything unlimited + AI', 'Up to 5 users', 'Team management', 'Recurring contracts', 'Time tracking', 'CSV export + full reports', 'Priority support'],
    croissance: fr
      ? ['Tout ce qui est dans Pro', "Jusqu'à 15 utilisateurs", 'Emplacements multiples', 'Marque blanche', 'SMS', 'Automatisation avancée', 'Export QuickBooks', 'Support prioritaire (1 j ouvrable)']
      : ['Everything in Pro', 'Up to 15 users', 'Multiple locations', 'White label', 'SMS', 'Advanced automation', 'QuickBooks export', 'Priority support (1 business day)'],
  }

  // ── Feature showcase sections ──
  const showcases = [
    {
      label: fr ? 'Interventions' : 'Jobs',
      title: fr ? 'Votre journée organisée avant même de partir' : 'Your day organized before you even leave',
      checks: fr
        ? ['Vue calendrier avec glisser-déposer', 'Statuts en temps réel pour chaque intervention', 'Notifications et rappels automatiques']
        : ['Calendar view with drag and drop', 'Real-time status for every job', 'Automatic notifications and reminders'],
      href: '/fonctionnalites/interventions',
      linkLabel: fr ? 'En savoir plus' : 'Learn more',
    },
    {
      label: fr ? 'Facturation IA' : 'AI Invoicing',
      title: fr ? "Décrivez votre travail. L'IA crée la facture." : 'Describe your work. AI creates the invoice.',
      checks: fr
        ? ['Factures professionnelles en 30 secondes', 'TPS/TVQ calculées automatiquement', 'Paiement en ligne Stripe intégré']
        : ['Professional invoices in 30 seconds', 'Tax calculations built in', 'Stripe online payment integrated'],
      href: '/fonctionnalites/facturation',
      linkLabel: fr ? 'En savoir plus' : 'Learn more',
    },
    {
      label: fr ? 'Portail IA' : 'AI Portal',
      title: fr ? 'Vos clients réservent même quand vous dormez' : 'Your clients book even while you sleep',
      checks: fr
        ? ['Agent IA personnalisé à votre entreprise', 'Collecte les détails, coordonnées et disponibilités', 'Fonctionne 24h/24 en français et en anglais']
        : ['AI agent customized to your business', 'Collects details, contact info and availability', 'Works 24/7 in French and English'],
      href: '/fonctionnalites/portail-ia',
      linkLabel: fr ? 'En savoir plus' : 'Learn more',
    },
    {
      label: fr ? 'Équipe' : 'Team',
      title: fr ? 'Vos techniciens savent toujours où aller' : 'Your technicians always know where to go',
      checks: fr
        ? ['Assignation en un clic', 'Suivi des heures et performances', 'Chaque technicien voit ses interventions du jour']
        : ['One-click assignment', 'Time and performance tracking', 'Each technician sees their daily jobs'],
      href: '/fonctionnalites/equipe',
      linkLabel: fr ? 'En savoir plus' : 'Learn more',
    },
  ]

  // ── FAQ data ──
  const faqs = [
    {
      q: fr ? 'Puis-je essayer Gestivio gratuitement ?' : 'Can I try Gestivio for free?',
      a: fr ? "Oui ! Vous avez 14 jours d'essai gratuit complet, sans carte de crédit requise. Vous pouvez annuler à tout moment." : 'Yes! You get a full 14-day free trial with no credit card required. Cancel anytime.',
    },
    {
      q: fr ? 'Est-ce que mes données sont hébergées au Canada ?' : 'Is my data hosted in Canada?',
      a: fr ? 'Oui. Toutes vos données sont hébergées sur des serveurs canadiens, chiffrées au repos et en transit. Nous sommes conformes à la Loi 25 du Québec et à la LPRPDE.' : 'Yes. All your data is hosted on Canadian servers, encrypted at rest and in transit. We comply with Quebec Law 25 and PIPEDA.',
    },
    {
      q: fr ? 'Comment fonctionne le portail de réservation IA ?' : 'How does the AI booking portal work?',
      a: fr ? "Vous partagez un lien avec vos clients. Ils clavardent avec votre agent IA personnalisé qui collecte les détails du service, les coordonnées et les préférences de date. La réservation apparaît dans votre tableau de bord." : 'You share a link with your customers. They chat with your branded AI agent that collects service details, contact info, and scheduling preferences. The booking appears in your dashboard automatically.',
    },
    {
      q: fr ? 'Comment sont traités les paiements ?' : 'How are payments processed?',
      a: fr ? "Les paiements en ligne sont traités par Stripe. Gestivio ne stocke jamais les informations de carte de crédit." : 'Online payments are processed by Stripe. Gestivio never stores credit card information.',
    },
    {
      q: fr ? 'Puis-je changer de forfait à tout moment ?' : 'Can I change plans at any time?',
      a: fr ? "Oui, vous pouvez passer à un forfait supérieur ou inférieur à tout moment. Le changement est immédiat et au prorata." : 'Yes, you can upgrade or downgrade at any time. Changes are immediate and prorated.',
    },
    {
      q: fr ? 'Gestivio fonctionne-t-il sur mobile ?' : 'Does Gestivio work on mobile?',
      a: fr ? "Oui, Gestivio est entièrement responsive et optimisé pour mobile. Vous pouvez gérer votre entreprise depuis votre téléphone." : 'Yes, Gestivio is fully responsive and optimized for mobile. You can manage your business from your phone.',
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* ── Navigation ── */}
      <MegaMenuNav />

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[700px] w-[900px] rounded-full bg-gradient-to-br from-indigo-100 via-violet-50 to-blue-50 dark:from-indigo-950/60 dark:via-violet-950/40 dark:to-blue-950/30 opacity-70 blur-3xl" />
          <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-violet-100 dark:bg-violet-900/30 opacity-40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left copy */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-950/50 px-4 py-1.5 mb-6">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  {fr ? 'Fait au Québec · Bilingue FR/EN' : 'Made in Quebec · Bilingual FR/EN'}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                  {fr
                    ? 'Gérez votre entreprise de services terrain '
                    : 'Manage your field service business '}
                </span>
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  {fr ? 'depuis votre téléphone' : 'from your phone'}
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
                {fr
                  ? "Interventions, facturation, équipe, réservation en ligne — tout au même endroit. Propulsé par l'IA, conçu pour les entrepreneurs québécois."
                  : 'Jobs, invoicing, team, online booking — all in one place. Powered by AI, built for Quebec entrepreneurs.'}
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 min-h-12 text-base font-semibold text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                >
                  {fr ? 'Essai gratuit 14 jours' : 'Start 14-day free trial'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3.5 min-h-12 text-base font-semibold text-gray-700 dark:text-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <Play className="h-4 w-4 text-indigo-600 fill-indigo-600" />
                  {fr ? 'Voir comment ça marche' : 'See how it works'}
                </a>
              </div>

              {/* Trust signals */}
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {[
                  fr ? 'Aucune carte' : 'No credit card',
                  fr ? '5 minutes' : '5 minutes',
                  fr ? 'Données au Canada' : 'Data in Canada',
                  fr ? 'Support français' : 'French support',
                ].map((sig) => (
                  <span key={sig} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    {sig}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Phone mockup */}
            <div className="flex justify-center lg:justify-end">
              <MockupMobileDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PAIN POINTS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-24 bg-[#0F172A]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                {fr ? 'Des problèmes que vous connaissez trop bien' : 'Problems you know all too well'}
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Moon,
                title: fr ? 'La paperasse le soir' : 'Paperwork at night',
                desc: fr
                  ? "Vous terminez vos interventions à 17 h, puis passez votre soirée à rédiger des factures et organiser le lendemain."
                  : "You finish your jobs at 5 PM, then spend your evening writing invoices and organizing tomorrow.",
              },
              {
                icon: PhoneOff,
                title: fr ? 'Les appels manqués sur le terrain' : 'Missed calls on site',
                desc: fr
                  ? "Chaque appel manqué est un client potentiel perdu. Vous ne pouvez pas répondre au téléphone les mains dans la tuyauterie."
                  : "Every missed call is a potential lost client. You can't answer the phone with your hands in the plumbing.",
              },
              {
                icon: UserX,
                title: fr ? 'Techniciens sans info' : 'Technicians without info',
                desc: fr
                  ? "Vos techniciens appellent pour demander l'adresse, le type de travail ou l'historique du client. Chaque jour."
                  : "Your technicians call to ask for the address, job type, or customer history. Every single day.",
              },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 100}>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-7 hover:bg-white/10 transition-colors">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/20 mb-5">
                    <card.icon className="h-5 w-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{card.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <p className="text-center mt-12 text-lg font-semibold text-indigo-400">
              {fr ? 'Gestivio règle ces problèmes.' : 'Gestivio solves these problems.'}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          THREE PILLARS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">
                {fr ? 'Plateforme' : 'Platform'}
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Tout ce dont vous avez besoin' : 'Everything you need'}
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Calendar,
                title: fr ? 'Terrain' : 'Field',
                desc: fr
                  ? "Planifiez vos interventions, assignez vos techniciens et suivez l'avancement en temps réel depuis votre calendrier."
                  : 'Schedule jobs, assign technicians, and track progress in real time from your calendar.',
                color: 'bg-blue-50 dark:bg-blue-950/50',
                iconColor: 'text-blue-600 dark:text-blue-400',
                mockup: <MockupCalendar />,
              },
              {
                icon: CreditCard,
                title: fr ? 'Facturation' : 'Invoicing',
                desc: fr
                  ? "Créez des factures professionnelles en quelques secondes. Envoyez-les par courriel avec un bouton de paiement en ligne."
                  : 'Create professional invoices in seconds. Send them by email with an online payment button.',
                color: 'bg-emerald-50 dark:bg-emerald-950/50',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
                mockup: <MockupInvoice />,
              },
              {
                icon: Bot,
                title: fr ? 'Intelligence artificielle' : 'Artificial Intelligence',
                desc: fr
                  ? "Laissez l'IA prendre vos réservations 24h/24, répondre aux questions de vos clients et vous aider à gérer votre entreprise."
                  : 'Let AI handle bookings 24/7, answer customer questions, and help you manage your business.',
                color: 'bg-violet-50 dark:bg-violet-950/50',
                iconColor: 'text-violet-600 dark:text-violet-400',
                mockup: <MockupChat />,
              },
            ].map((pillar, i) => (
              <Reveal key={pillar.title} delay={i * 100}>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full flex flex-col">
                  <div className="p-6 flex-1">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${pillar.color} mb-4`}>
                      <pillar.icon className={`h-5 w-5 ${pillar.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{pillar.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{pillar.desc}</p>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4 h-48 overflow-hidden">
                    <div className="transform scale-[0.6] origin-top-left w-[166%]">
                      {pillar.mockup}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURE SHOWCASE — 4 alternating sections
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 dark:bg-gray-900">
        {showcases.map((s, i) => {
          const isEven = i % 2 === 0
          const mockups = [
            <MockupCalendar key="cal" />,
            <MockupInvoice key="inv" />,
            <MockupChat key="chat" />,
            <MockupCalendar key="team" />,
          ]
          return (
            <div key={s.title} className="py-20 lg:py-24">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className={`grid items-center gap-12 lg:grid-cols-2 ${isEven ? '' : 'lg:[direction:rtl]'}`}>
                  {/* Text */}
                  <Reveal>
                    <div className={isEven ? '' : 'lg:[direction:ltr]'}>
                      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">{s.label}</p>
                      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-5">{s.title}</h2>
                      <ul className="space-y-3 mb-8">
                        {s.checks.map((c) => (
                          <li key={c} className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                              <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{c}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={s.href}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        {s.linkLabel}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </Reveal>

                  {/* Mockup */}
                  <Reveal delay={150}>
                    <div className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg overflow-hidden ${isEven ? '' : 'lg:[direction:ltr]'}`}>
                      <div className="p-4 max-h-80 overflow-hidden">
                        <div className="transform scale-[0.75] origin-top-left w-[133%]">
                          {mockups[i]}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">
                {fr ? 'Démarrage rapide' : 'Quick start'}
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Opérationnel en 15 minutes' : 'Up and running in 15 minutes'}
              </h2>
            </div>
          </Reveal>

          <div className="relative grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {/* Connector line */}
            <div className="absolute top-8 left-1/4 right-1/4 hidden md:block h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 dark:from-indigo-800 dark:via-indigo-600 dark:to-indigo-800" />
            {[
              {
                step: '01',
                icon: UserPlus,
                title: fr ? 'Créez votre compte' : 'Create your account',
                desc: fr ? "En 2 minutes, sans carte de crédit. Votre espace est prêt immédiatement." : 'In 2 minutes, no credit card. Your workspace is ready immediately.',
              },
              {
                step: '02',
                icon: ListPlus,
                title: fr ? 'Ajoutez vos services' : 'Add your services',
                desc: fr ? 'Configurez vos types de services, tarifs et zones de couverture.' : 'Set up your service types, rates, and coverage areas.',
              },
              {
                step: '03',
                icon: Zap,
                title: fr ? 'Première intervention' : 'First job',
                desc: fr ? "Planifiez votre première intervention et envoyez votre première facture le même jour." : 'Schedule your first job and send your first invoice the same day.',
              },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 120}>
                <div className="relative text-center bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-indigo-200">
                    {s.step}
                  </div>
                  <div className="mx-auto mb-5 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950">
                    <s.icon className="h-7 w-7 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{s.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          QUEBEC TRUST
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-24 bg-slate-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-5">
                {fr ? 'Conçu pour les entrepreneurs québécois' : 'Built for Quebec entrepreneurs'}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr
                  ? "Gestivio est développé au Québec, en français d'abord. Vos données restent au Canada, votre support est en français, et la plateforme est pensée pour les réalités du marché québécois."
                  : 'Gestivio is developed in Quebec, French-first. Your data stays in Canada, your support is in French, and the platform is designed for the realities of the Quebec market.'}
              </p>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
            {[
              { icon: Leaf, label: fr ? 'Fait au Québec' : 'Made in Quebec' },
              { icon: Shield, label: fr ? 'Données au Canada' : 'Data in Canada' },
              { icon: MessageSquare, label: fr ? 'Support français' : 'French support' },
              { icon: Globe, label: fr ? 'Bilingue FR/EN' : 'Bilingual FR/EN' },
            ].map((badge, i) => (
              <Reveal key={badge.label} delay={i * 80}>
                <div className="flex flex-col items-center rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 text-center shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 mb-3">
                    <badge.icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{badge.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">
                {fr ? 'Tarification' : 'Pricing'}
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Des prix simples et transparents' : 'Simple, transparent pricing'}
              </h2>
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                {fr ? 'Essai gratuit de 14 jours. Aucune carte de crédit requise.' : 'Start free for 14 days. No credit card required.'}
              </p>
              {/* Billing toggle */}
              <div className="mt-8 inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 shadow-sm">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${billing === 'monthly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {fr ? 'Mensuel' : 'Monthly'}
                </button>
                <button
                  onClick={() => setBilling('annual')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${billing === 'annual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {fr ? 'Annuel' : 'Annual'}
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${billing === 'annual' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                    {fr ? '-10 %' : '-10%'}
                  </span>
                </button>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {plans.map(({ key, p }, i) => {
              const highlighted = key === 'pro'
              const price = billing === 'annual' ? p.annual : p.monthly
              const annualTotal = p.annual * 12
              const features = pricingFeatures[key] || []

              return (
                <Reveal key={key} delay={i * 80}>
                  <div className={`relative flex flex-col rounded-2xl p-7 h-full ${highlighted ? 'bg-indigo-600 shadow-2xl shadow-indigo-200 dark:shadow-indigo-950/50 ring-1 ring-indigo-500' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm'}`}>
                    {highlighted && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                          <Sparkles className="h-3 w-3" />
                          {fr ? 'Plus populaire' : 'Most popular'}
                        </span>
                      </div>
                    )}
                    <div className="mb-5">
                      <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${highlighted ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                        {fr ? p.label : p.labelEn}
                      </p>
                      <div className="flex items-end gap-1 mb-2">
                        <span className={`text-4xl font-bold ${highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>${price}</span>
                        <span className={`mb-1 text-sm ${highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {fr ? '/mois' : '/month'}
                        </span>
                      </div>
                      {billing === 'annual' && (
                        <p className={`text-xs ${highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {fr ? `Facturé $${annualTotal}/an` : `Billed $${annualTotal}/year`}
                        </p>
                      )}
                      <p className={`text-sm mt-2 ${highlighted ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {fr ? p.tagline : p.taglineEn}
                      </p>
                    </div>
                    <ul className="space-y-2.5 mb-7 flex-1">
                      {features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <Check className={`h-4 w-4 shrink-0 mt-0.5 ${highlighted ? 'text-indigo-200' : 'text-indigo-500'}`} />
                          <span className={highlighted ? 'text-indigo-50' : 'text-gray-600 dark:text-gray-300'}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/signup?plan=${key}&cycle=${billing}`}
                      className={`inline-flex items-center justify-center rounded-xl px-5 py-3 min-h-11 text-sm font-semibold transition-all duration-150 ${highlighted ? 'bg-white text-indigo-700 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5'}`}
                    >
                      {fr ? 'Essai gratuit' : 'Start free trial'}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </Reveal>
              )
            })}
          </div>

          <Reveal>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />{fr ? 'Essai gratuit 14 jours' : '14-day free trial'}</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />{fr ? 'Aucune carte de crédit' : 'No credit card required'}</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />{fr ? 'Annulable à tout moment' : 'Cancel anytime'}</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-24 bg-slate-50 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">FAQ</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Questions fréquemment posées' : 'Frequently asked questions'}
              </h2>
            </div>
          </Reveal>
          <Reveal>
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 shadow-sm">
              {faqs.map((faq, i) => (
                <FAQ key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-8 py-16 sm:py-20 shadow-2xl shadow-indigo-200 dark:shadow-indigo-950/50 text-center relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5" />
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5" />
              </div>
              <div className="relative">
                <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                  {fr ? "Arrêtez de gérer votre business à l'ancienne." : 'Stop managing your business the old way.'}
                </h2>
                <p className="mt-4 text-lg text-indigo-100 max-w-xl mx-auto">
                  {fr
                    ? "Rejoignez les entrepreneurs qui gèrent tout depuis leur téléphone."
                    : 'Join the entrepreneurs who manage everything from their phone.'}
                </p>
                <div className="mt-10">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 min-h-12 text-base font-semibold text-indigo-700 hover:bg-indigo-50 transition-all shadow-lg hover:-translate-y-0.5 duration-200"
                  >
                    {fr ? 'Essai gratuit 14 jours' : 'Start 14-day free trial'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <p className="mt-5 text-sm text-indigo-200">
                  {fr ? '14 jours gratuits · Aucune carte · Annulable à tout moment' : '14 days free · No credit card · Cancel anytime'}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {/* Col 1 — Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GestivioLogo forceDark />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
                {fr
                  ? "La façon plus intelligente de gérer votre entreprise de services."
                  : 'The smarter way to run your field service business.'}
              </p>
              <p className="text-xs text-gray-400">{fr ? 'Fait au Québec, Canada' : 'Made in Québec, Canada'}</p>
            </div>

            {/* Col 2 — Company */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{fr ? 'Entreprise' : 'Company'}</h4>
              <ul className="space-y-3">
                {[
                  { label: fr ? 'À propos' : 'About Us', href: '/about' },
                  { label: fr ? 'Nous contacter' : 'Contact Us', href: '/contact' },
                ].map((link) => (
                  <li key={link.label}><a href={link.href} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{link.label}</a></li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Legal & Support */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{fr ? 'Légal & Support' : 'Legal & Support'}</h4>
              <ul className="space-y-3">
                {[
                  { label: fr ? 'Politique de confidentialité' : 'Privacy Policy', href: '/privacy' },
                  { label: fr ? "Conditions d'utilisation" : 'Terms of Service', href: '/terms' },
                  { label: fr ? 'Sécurité' : 'Security', href: '/security' },
                  { label: fr ? 'Accessibilité' : 'Accessibility', href: '/accessibility' },
                  { label: fr ? 'Cookies' : 'Cookie Policy', href: '/cookies' },
                  { label: fr ? "Centre d'aide" : 'Support Center', href: '/support' },
                ].map((link) => (
                  <li key={link.label}><a href={link.href} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{link.label}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-800 pt-8">
            <p className="text-sm text-gray-400">
              {fr ? '© 2026 Gestivio. Tous droits réservés.' : '© 2026 Gestivio. All rights reserved.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
              <a href="/privacy" className="hover:text-gray-600">{fr ? 'Confidentialité' : 'Privacy'}</a>
              <span>·</span>
              <a href="/terms" className="hover:text-gray-600">{fr ? 'Conditions' : 'Terms'}</a>
              <span>·</span>
              <a href="/cookies" className="hover:text-gray-600">Cookies</a>
              <span>·</span>
              <a href="/security" className="hover:text-gray-600">{fr ? 'Sécurité' : 'Security'}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
