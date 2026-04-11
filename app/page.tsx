'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import {
  Wrench, Users, Briefcase, FileText, Sparkles, CheckCircle,
  ArrowRight, BarChart3, Shield, Zap, Star, Check,
  ChevronRight, ChevronDown, CreditCard, Calendar, Play,
  MessageSquare, Building2,
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
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-base font-semibold text-gray-900 pr-4">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96 pb-5' : 'max-h-0'}`}>
        <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function LandingPage() {
  const { lang, setLang, t } = useLanguage()
  const l = t.landing
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  // Feature cards per spec
  const features = [
    { icon: Calendar,      title: lang === 'fr' ? 'Planification intelligente'    : 'Smart Scheduling',    description: lang === 'fr' ? 'Créez, assignez et suivez vos interventions avec vue calendrier, glisser-déposer et rappels automatiques.'                       : 'Create, assign, and track jobs with calendar view, drag-and-drop scheduling, and automatic reminders.',                  color: 'bg-blue-500',    bg: 'bg-blue-50'    },
    { icon: Sparkles,      title: lang === 'fr' ? 'Assistant IA'                  : 'AI Assistant',        description: lang === 'fr' ? "Posez n'importe quelle question sur votre activité. Obtenez des insights, rédigez des courriels, analysez vos revenus."         : 'Ask anything about your business. Get instant insights, draft follow-up emails, and analyse your revenue.',             color: 'bg-violet-500',  bg: 'bg-violet-50'  },
    { icon: CreditCard,    title: lang === 'fr' ? 'Paiements en ligne'            : 'Online Payments',     description: lang === 'fr' ? "Envoyez des factures par courriel avec un bouton Payer maintenant. Stripe gère l'encaissement."                                  : 'Send invoices with a Pay Now button. Stripe handles the checkout — you get paid faster.',                               color: 'bg-emerald-500', bg: 'bg-emerald-50' },
    { icon: Users,         title: lang === 'fr' ? 'Portail clients'               : 'Customer Portal',     description: lang === 'fr' ? "Vos clients peuvent réserver en ligne 24h/24 grâce au portail IA — sans que vous n'ayez à répondre au téléphone."               : 'Customers can book online 24/7 via the AI portal — no phone calls, no back-and-forth.',                                 color: 'bg-amber-500',   bg: 'bg-amber-50'   },
    { icon: Building2,     title: lang === 'fr' ? "Gestion d'équipe"              : 'Team Management',     description: lang === 'fr' ? 'Invitez des techniciens, assignez des interventions, suivez les heures et les performances en temps réel.'                       : 'Invite technicians, assign jobs, track hours and performance in real time.',                                            color: 'bg-pink-500',    bg: 'bg-pink-50'    },
    { icon: BarChart3,     title: lang === 'fr' ? 'Rapports en temps réel'        : 'Real-time Reports',   description: lang === 'fr' ? 'Revenus, taux de complétion, clients inactifs — tout est visible dans des tableaux de bord en direct avec filtres par période.' : 'Revenue, job completion rates, dormant customers — visible in live dashboards with date-range filters.',                  color: 'bg-cyan-500',    bg: 'bg-cyan-50'    },
  ]

  const pricingPlans = [
    { key: 'starter',    name: lang === 'fr' ? 'Démarrage'   : 'Starter',    monthlyPrice: 39,  description: l.starterDesc,     features: l.pricingFeatures.starter,    cta: l.pricingCtaStarter,    highlighted: false, href: '/login' },
    { key: 'growth',     name: lang === 'fr' ? 'Croissance'  : 'Growth',     monthlyPrice: 99,  description: l.growthDesc,      features: l.pricingFeatures.growth,     cta: l.pricingCtaGrowth,     highlighted: true,  href: '/login' },
    { key: 'pro',        name: lang === 'fr' ? 'Pro'         : 'Pro',        monthlyPrice: 199, description: l.proDesc,         features: l.pricingFeatures.pro,        cta: l.pricingCtaPro,        highlighted: false, href: '/login' },
    { key: 'enterprise', name: lang === 'fr' ? 'Entreprise'  : 'Enterprise', monthlyPrice: 399, description: l.enterpriseDesc,  features: l.pricingFeatures.enterprise, cta: l.pricingCtaEnterprise, highlighted: false, href: '/login' },
  ]

  const stats = [
    { value: '500+',     label: l.statsCompanies },
    { value: '180 000+', label: l.statsJobs },
    { value: '42 M$+',   label: l.statsRevenue },
    { value: '4.9 / 5',  label: l.statsRating },
  ]

  const testimonials = [
    {
      text: lang === 'fr'
        ? "FieldOS a changé notre façon de travailler. On a réduit le temps admin de moitié et nos clients adorent recevoir leurs factures en un clic."
        : "FieldOS changed how we run our whole operation. We cut admin time in half and our clients love getting their invoices with a single click.",
      name: 'Marc Tremblay',
      role: lang === 'fr' ? 'Propriétaire, CVC Tremblay' : 'Owner, Tremblay HVAC',
      initials: 'MT',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      text: lang === 'fr'
        ? "Le portail de réservation IA est incroyable. Mes clients prennent rendez-vous la nuit, le week-end — sans que j'aie à décrocher le téléphone."
        : "The AI booking portal is incredible. Clients schedule at midnight on weekends — I wake up to new bookings without ever picking up the phone.",
      name: 'Sarah Côté',
      role: lang === 'fr' ? 'Propriétaire, Plomberie Côté' : 'Owner, Côté Plumbing',
      initials: 'SC',
      color: 'bg-violet-100 text-violet-700',
    },
    {
      text: lang === 'fr'
        ? "L'assistant IA répond à toutes mes questions sur mes revenus et mes clients en quelques secondes. C'est comme avoir un comptable disponible 24h/24."
        : "The AI assistant answers every question I have about revenue and clients in seconds. It's like having a bookkeeper available 24/7.",
      name: 'Luc Beauchamp',
      role: lang === 'fr' ? "Propriétaire, Électricité Beauchamp" : 'Owner, Beauchamp Electric',
      initials: 'LB',
      color: 'bg-emerald-100 text-emerald-700',
    },
  ]

  const faqs = [
    {
      q: lang === 'fr' ? 'Puis-je essayer FieldOS gratuitement ?' : 'Can I try FieldOS for free?',
      a: lang === 'fr' ? 'Oui ! Vous avez 14 jours d\'essai gratuit complet, sans carte de crédit requise. Vous pouvez annuler à tout moment.' : 'Yes! You get a full 14-day free trial with no credit card required. You can cancel at any time with no questions asked.',
    },
    {
      q: lang === 'fr' ? 'Est-ce que mes données sont sécurisées ?' : 'Is my data secure?',
      a: lang === 'fr' ? 'Absolument. Toutes les données sont chiffrées avec AES-256 au repos et en transit. Nous sommes hébergés sur une infrastructure SOC 2 certifiée.' : 'Absolutely. All data is encrypted with AES-256 at rest and in transit. We run on SOC 2 certified infrastructure with daily backups.',
    },
    {
      q: lang === 'fr' ? 'Puis-je changer de forfait à tout moment ?' : 'Can I change plans at any time?',
      a: lang === 'fr' ? 'Oui, vous pouvez passer à un forfait supérieur ou inférieur à tout moment. Le changement est immédiat et au prorata.' : 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately and billing is prorated automatically.',
    },
    {
      q: lang === 'fr' ? 'Comment fonctionne le portail de réservation IA ?' : 'How does the AI booking portal work?',
      a: lang === 'fr' ? 'Vous partagez un lien avec vos clients. Ils clavardent avec votre agent IA personnalisé qui collecte les détails du service, les coordonnées et les préférences de date. La réservation apparaît dans votre tableau de bord.' : 'You share a link with your customers. They chat with your branded AI agent that collects service details, contact info, and scheduling preferences. The booking appears in your dashboard automatically.',
    },
    {
      q: lang === 'fr' ? 'Comment sont traités les paiements ?' : 'How are payments processed?',
      a: lang === 'fr' ? "Les paiements en ligne sont traités par Stripe, la norme de l'industrie pour les paiements sécurisés. FieldOS ne stocke jamais les informations de carte de crédit." : 'Online payments are processed by Stripe, the industry standard for secure payments. FieldOS never stores credit card information directly.',
    },
    {
      q: lang === 'fr' ? 'Y a-t-il une application mobile ?' : 'Is there a mobile app?',
      a: lang === 'fr' ? "FieldOS est entièrement responsive et fonctionne parfaitement depuis votre navigateur mobile. Une application native iOS/Android est en développement." : 'FieldOS is fully responsive and works perfectly from your mobile browser. A native iOS/Android app is in development.',
    },
    {
      q: lang === 'fr' ? 'Puis-je importer mes données existantes ?' : 'Can I import my existing data?',
      a: lang === 'fr' ? "Oui, vous pouvez importer vos clients via CSV. Pour les migrations complexes, notre équipe d'onboarding vous accompagne gratuitement." : 'Yes, you can import customers via CSV. For complex migrations, our onboarding team will help you get set up at no extra cost.',
    },
    {
      q: lang === 'fr' ? "Que se passe-t-il si j'annule ?" : 'What happens if I cancel?',
      a: lang === 'fr' ? "Vous pouvez annuler à tout moment depuis vos paramètres. Votre compte reste actif jusqu'à la fin de la période de facturation et vous pouvez exporter vos données." : "You can cancel anytime from your settings. Your account stays active until the end of the billing period and you can export all your data at any time.",
    },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
                <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-base font-semibold text-gray-900">FieldOS</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features"     className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">{l.navFeatures}</a>
              <a href="#pricing"      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">{l.navPricing}</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">{l.navHowItWorks}</a>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <button onClick={() => setLang('en')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>EN</button>
                <button onClick={() => setLang('fr')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>FR</button>
              </div>
              <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">{l.navSignIn}</Link>
              <Link href="/login" className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all duration-150 hover:shadow-md">
                {l.navGetStarted}<ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pb-24 pt-16 sm:pt-28">
        {/* Animated gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[700px] w-[900px] rounded-full bg-gradient-to-br from-indigo-100 via-violet-50 to-blue-50 opacity-70 blur-3xl" />
          <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-violet-100 opacity-40 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[400px] rounded-full bg-blue-50 opacity-50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Social proof badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 mb-6">
            <div className="flex -space-x-1">
              {['bg-blue-400','bg-emerald-400','bg-violet-400','bg-amber-400'].map((c,i) => (
                <div key={i} className={`h-5 w-5 rounded-full border-2 border-white ${c}`} />
              ))}
            </div>
            <span className="text-xs font-semibold text-indigo-700">{l.socialProof}</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl leading-[1.08]">
            {l.heroTitle1}{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {l.heroTitle2}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 sm:text-xl leading-relaxed">{l.heroSub}</p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              {l.ctaPrimary}<ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-base font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:-translate-y-0.5 transition-all duration-200">
              <Play className="h-4 w-4 text-indigo-600 fill-indigo-600" />{l.watchDemo}
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">{l.noCreditCard}</p>

          {/* App mockup */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/80 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto flex h-6 w-64 items-center justify-center rounded-md bg-white border border-gray-200">
                  <span className="text-xs text-gray-400">app.fieldos.com/dashboard</span>
                </div>
              </div>
              <div className="flex h-80 bg-gray-50">
                <div className="hidden sm:flex w-48 flex-col border-r border-gray-100 bg-white px-3 py-4">
                  <div className="flex items-center gap-2 px-2 mb-5">
                    <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center"><Wrench className="h-3 w-3 text-white" /></div>
                    <div className="h-3 w-16 rounded-full bg-gray-900" />
                  </div>
                  {[t.nav.dashboard, t.nav.customers, t.nav.jobs, t.nav.invoices, t.nav.assistant].map((item, i) => (
                    <div key={item} className={`flex items-center gap-2 px-2 py-2 rounded-lg mb-0.5 ${i === 0 ? 'bg-indigo-50' : ''}`}>
                      <div className={`h-3.5 w-3.5 rounded-sm ${i === 0 ? 'bg-indigo-400' : 'bg-gray-200'}`} />
                      <div className={`h-2.5 rounded-full ${i === 0 ? 'bg-indigo-600 w-16' : 'bg-gray-200 w-14'}`} />
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: t.nav.customers, color: 'bg-blue-50 border-blue-100', val: '124' },
                      { label: t.nav.jobs, color: 'bg-violet-50 border-violet-100', val: '38' },
                      { label: t.invoices.totalInvoiced, color: 'bg-emerald-50 border-emerald-100', val: '$24k' },
                      { label: t.dashboard.amountPaid, color: 'bg-amber-50 border-amber-100', val: '$18k' },
                    ].map((kpi) => (
                      <div key={kpi.label} className={`rounded-xl border ${kpi.color} p-3`}>
                        <div className="h-2 w-12 rounded-full bg-gray-300 mb-2" />
                        <div className="text-sm font-bold text-gray-800">{kpi.val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 bg-gray-50">
                      <div className="h-2.5 w-20 rounded-full bg-gray-300" />
                      <div className="ml-auto h-6 w-20 rounded-lg bg-indigo-100" />
                    </div>
                    {['HVAC Repair — Johnson', 'Plumbing Fix — Rivera', 'Electrical — Bouchard'].map((row) => (
                      <div key={row} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                        <div className="h-7 w-7 rounded-full bg-gray-100 shrink-0" />
                        <div className="flex-1">
                          <div className="h-2.5 w-32 rounded-full bg-gray-300 mb-1" />
                          <div className="h-2 w-20 rounded-full bg-gray-200" />
                        </div>
                        <div className="h-5 w-14 rounded-full bg-emerald-100" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div className="absolute -left-6 top-1/3 hidden lg:block">
              <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-xl shadow-gray-100/80">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle className="h-4 w-4 text-emerald-600" /></div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{lang === 'fr' ? 'Intervention terminée' : 'Job completed'}</p>
                    <p className="text-xs text-gray-400">{lang === 'fr' ? 'Réparation CVC · il y a 2 min' : 'HVAC Repair · 2 min ago'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-6 bottom-16 hidden lg:block">
              <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-xl shadow-gray-100/80">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center"><Sparkles className="h-4 w-4 text-indigo-600" /></div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{lang === 'fr' ? 'Nouvelle réservation IA' : 'New AI Booking'}</p>
                    <p className="text-xs text-gray-400">{lang === 'fr' ? 'Plomberie · Demain 9h' : 'Plumbing · Tomorrow 9am'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-gray-900 sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">{l.featuresLabel}</p>
              <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">{l.featuresTitle}</h2>
              <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">{l.featuresSub}</p>
            </div>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-lg hover:border-gray-200 hover:-translate-y-1 transition-all duration-200 h-full">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg} mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <f.icon className={`h-6 w-6 ${f.color.replace('bg-', 'text-')}`} />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">{l.howLabel}</p>
              <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">{l.howTitle}</h2>
            </div>
          </Reveal>
          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connector line */}
            <div className="absolute top-8 left-1/4 right-1/4 hidden md:block h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200" />
            {[
              { step: '01', title: l.step1Title, description: l.step1Desc, icon: Users },
              { step: '02', title: l.step2Title, description: l.step2Desc, icon: Briefcase },
              { step: '03', title: l.step3Title, description: l.step3Desc, icon: FileText },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 120}>
                <div className="relative text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-indigo-200">
                    {s.step}
                  </div>
                  <div className="mx-auto mb-5 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                    <s.icon className="h-7 w-7 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Booking Portal Feature ── */}
      <section className="py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">{l.aiBookingLabel}</p>
                <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl leading-tight mb-5">{l.aiBookingTitle}</h2>
                <p className="text-lg text-gray-500 leading-relaxed mb-8">{l.aiBookingSub}</p>
                <ul className="space-y-3 mb-8">
                  {[l.aiBookingF1, l.aiBookingF2, l.aiBookingF3, l.aiBookingF4].map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                        <Check className="h-3 w-3 text-indigo-600" />
                      </div>
                      <span className="text-sm text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/book" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-indigo-100">
                  {l.aiBookingCta}<ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="relative">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-100 overflow-hidden">
                  {/* Chat header */}
                  <div className="flex items-center gap-3 border-b border-gray-100 bg-indigo-600 px-4 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{lang === 'fr' ? 'Alex — Assistant IA' : 'Alex — AI Assistant'}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        <p className="text-xs text-indigo-100">{lang === 'fr' ? 'En ligne · Répond en quelques secondes' : 'Online · Responds in seconds'}</p>
                      </div>
                    </div>
                  </div>
                  {/* Chat messages */}
                  <div className="space-y-4 px-4 py-5">
                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      </div>
                      <div className="rounded-2xl rounded-tl-none bg-gray-100 px-4 py-3 max-w-xs">
                        <p className="text-sm text-gray-800">{lang === 'fr' ? "Bonjour ! Je suis Alex. Quel service pouvons-nous faire pour vous aujourd'hui ?" : "Hi! I'm Alex. What service can we help you with today?"}</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-tr-none bg-indigo-600 px-4 py-3 max-w-xs">
                        <p className="text-sm text-white">{lang === 'fr' ? "J'ai besoin d'une réparation de plomberie urgente." : "I need an urgent plumbing repair."}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      </div>
                      <div className="rounded-2xl rounded-tl-none bg-gray-100 px-4 py-3 max-w-xs">
                        <p className="text-sm text-gray-800">{lang === 'fr' ? "Bien sûr ! Pouvez-vous me dire votre nom et votre adresse ?" : "Of course! Can I get your name and service address?"}</p>
                      </div>
                    </div>
                  </div>
                  {/* Input area */}
                  <div className="border-t border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5">
                      <span className="flex-1 text-sm text-gray-400">{lang === 'fr' ? 'Écrire un message...' : 'Type a message...'}</span>
                      <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <ArrowRight className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Badge */}
                <div className="absolute -bottom-4 -right-4 rounded-xl bg-emerald-500 px-4 py-2 shadow-lg shadow-emerald-100">
                  <p className="text-xs font-semibold text-white">{lang === 'fr' ? '✓ Réservation confirmée !' : '✓ Booking confirmed!'}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">{l.pricingLabel}</p>
              <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">{l.pricingTitle}</h2>
              <p className="mt-4 text-lg text-gray-500">{l.pricingSub}</p>
              {/* Billing toggle */}
              <div className="mt-8 inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${billing === 'monthly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {l.billingMonthly}
                </button>
                <button
                  onClick={() => setBilling('annual')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${billing === 'annual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {l.billingAnnual}
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${billing === 'annual' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>{l.savePercent}</span>
                </button>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pricingPlans.map((plan, i) => {
              const price = billing === 'annual' ? Math.round(plan.monthlyPrice * 0.8) : plan.monthlyPrice
              return (
                <Reveal key={plan.key} delay={i * 80}>
                  <div className={`relative flex flex-col rounded-2xl p-7 h-full ${plan.highlighted ? 'bg-indigo-600 shadow-2xl shadow-indigo-200 ring-1 ring-indigo-500' : 'bg-white border border-gray-200 shadow-sm'}`}>
                    {plan.highlighted && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                          <Star className="h-3 w-3 fill-amber-900" />{l.mostPopular}
                        </span>
                      </div>
                    )}
                    <div className="mb-5">
                      <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${plan.highlighted ? 'text-indigo-200' : 'text-gray-500'}`}>{plan.name}</p>
                      <div className="flex items-end gap-1 mb-2">
                        <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>${price}</span>
                        <span className={`mb-1 text-sm ${plan.highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>{l.pricingMonthly}</span>
                      </div>
                      {billing === 'annual' && (
                        <p className={`text-xs ${plan.highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {lang === 'fr' ? `Facturé $${plan.monthlyPrice * 12 * 0.8}/an` : `Billed $${Math.round(plan.monthlyPrice * 12 * 0.8)}/year`}
                        </p>
                      )}
                      <p className={`text-sm mt-2 ${plan.highlighted ? 'text-indigo-100' : 'text-gray-500'}`}>{plan.description}</p>
                    </div>
                    <ul className="space-y-2.5 mb-7 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlighted ? 'text-indigo-200' : 'text-indigo-500'}`} />
                          <span className={plan.highlighted ? 'text-indigo-50' : 'text-gray-600'}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={plan.href} className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150 ${plan.highlighted ? 'bg-white text-indigo-700 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5'}`}>
                      {plan.cta}<ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </Reveal>
              )
            })}
          </div>
          <Reveal>
            <p className="mt-8 text-center text-sm text-gray-400">
              {lang === 'fr' ? '✓ Essai gratuit 14 jours  ·  ✓ Aucune carte de crédit  ·  ✓ Annulable à tout moment' : '✓ 14-day free trial  ·  ✓ No credit card required  ·  ✓ Cancel anytime'}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">{l.testimonialsLabel}</p>
              <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">{l.testimonialsTitle}</h2>
            </div>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-7 shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-6">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${t.color}`}>{t.initials}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust signals ── */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Shield, title: l.trust1Title, description: l.trust1Desc },
              { icon: Zap,    title: l.trust2Title, description: l.trust2Desc },
              { icon: Sparkles, title: l.trust3Title, description: l.trust3Desc },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50">
                  <item.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">{l.faqLabel}</p>
              <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">{l.faqTitle}</h2>
            </div>
          </Reveal>
          <Reveal>
            <div className="rounded-2xl border border-gray-100 bg-white px-6 shadow-sm">
              {faqs.map((faq, i) => (
                <FAQ key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-8 py-16 sm:py-20 shadow-2xl shadow-indigo-200 text-center relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5" />
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5" />
              </div>
              <div className="relative">
                <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">{l.ctaBannerTitle}</h2>
                <p className="mt-4 text-lg text-indigo-100 max-w-xl mx-auto">{l.ctaBannerSub}</p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors shadow-lg hover:-translate-y-0.5 duration-200">
                    {l.ctaBannerBtn}<ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <p className="mt-5 text-sm text-indigo-200">{l.ctaBannerNote}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
                  <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-base font-semibold text-gray-900">FieldOS</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                {lang === 'fr'
                  ? 'La plateforme tout-en-un pour les entreprises de services terrain.'
                  : 'The all-in-one platform for field service businesses.'}
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"><MessageSquare className="h-4 w-4" /></a>
                <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"><Building2 className="h-4 w-4" /></a>
              </div>
            </div>
            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">{lang === 'fr' ? 'Produit' : 'Product'}</h4>
              <ul className="space-y-3">
                {[
                  { label: l.navFeatures, href: '#features' },
                  { label: l.navPricing, href: '#pricing' },
                  { label: l.navHowItWorks, href: '#how-it-works' },
                  { label: lang === 'fr' ? 'Portail de réservation' : 'Booking Portal', href: '/book' },
                ].map((link) => (
                  <li key={link.label}><a href={link.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{link.label}</a></li>
                ))}
              </ul>
            </div>
            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">{lang === 'fr' ? 'Entreprise' : 'Company'}</h4>
              <ul className="space-y-3">
                {[
                  { label: lang === 'fr' ? 'À propos' : 'About', href: '#' },
                  { label: lang === 'fr' ? 'Blogue' : 'Blog', href: '#' },
                  { label: lang === 'fr' ? 'Carrières' : 'Careers', href: '#' },
                  { label: l.footerContact, href: '#' },
                ].map((link) => (
                  <li key={link.label}><a href={link.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{link.label}</a></li>
                ))}
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">{lang === 'fr' ? 'Légal' : 'Legal'}</h4>
              <ul className="space-y-3">
                {[
                  { label: l.footerPrivacy, href: '#' },
                  { label: l.footerTerms, href: '#' },
                  { label: lang === 'fr' ? 'Sécurité' : 'Security', href: '#' },
                  { label: lang === 'fr' ? 'Accessibilité' : 'Accessibility', href: '#' },
                ].map((link) => (
                  <li key={link.label}><a href={link.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{link.label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-8">
            <p className="text-sm text-gray-400">{l.footerCopyright}</p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>🍁</span>
              <span>{lang === 'fr' ? 'Fait avec fierté au Québec, Canada' : 'Made with pride in Québec, Canada'}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
