'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'
import {
  Wrench, Users, Briefcase, FileText, Sparkles, CheckCircle,
  ArrowRight, BarChart3, Smartphone, Shield, Zap, Star, Check, ChevronRight,
} from 'lucide-react'

export default function LandingPage() {
  const { lang, setLang, t } = useLanguage()
  const l = t.landing

  const features = [
    { icon: Users, title: lang === 'fr' ? 'Gestion des clients' : 'Customer Management', description: lang === 'fr' ? 'Centralisez toutes vos données clients. Suivez les contacts, l\'historique et les préférences sans effort.' : 'Keep all your client data in one place. Track contacts, history, and preferences effortlessly.', color: 'bg-blue-500' },
    { icon: Briefcase, title: lang === 'fr' ? 'Planification des interventions' : 'Job Scheduling', description: lang === 'fr' ? 'Créez, assignez et suivez vos interventions terrain de la planification à la clôture.' : 'Create, assign, and track field jobs from scheduled to complete. Never miss a service call.', color: 'bg-violet-500' },
    { icon: FileText, title: lang === 'fr' ? 'Facturation automatisée' : 'Invoice Automation', description: lang === 'fr' ? 'Générez des factures professionnelles instantanément. Suivez les paiements et envoyez des rappels automatiquement.' : 'Generate professional invoices instantly. Track payment status and send reminders automatically.', color: 'bg-emerald-500' },
    { icon: Sparkles, title: lang === 'fr' ? 'Analyses propulsées par IA' : 'AI-Powered Insights', description: lang === 'fr' ? 'Posez n\'importe quelle question sur votre entreprise à votre assistant IA. Obtenez des réponses instantanées.' : 'Ask your AI assistant anything about your business. Get instant answers and smart suggestions.', color: 'bg-amber-500' },
    { icon: BarChart3, title: lang === 'fr' ? 'Analyses en temps réel' : 'Real-time Analytics', description: lang === 'fr' ? 'Surveillez les revenus, les taux de complétion et les performances avec des tableaux de bord en direct.' : 'Monitor revenue, job completion rates, and team performance with live dashboards.', color: 'bg-pink-500' },
    { icon: Smartphone, title: lang === 'fr' ? 'Conçu pour mobile' : 'Mobile First', description: lang === 'fr' ? 'Votre équipe peut accéder à tout depuis n\'importe quel appareil. Fonctionne parfaitement sur téléphone.' : 'Your team can access everything from any device. Works seamlessly on phones and tablets.', color: 'bg-cyan-500' },
  ]

  const pricingPlans = [
    { name: lang === 'fr' ? 'Démarrage' : 'Starter', price: '49', description: l.starterDesc, features: l.pricingFeatures.starter, cta: l.pricingCtaStarter, highlighted: false },
    { name: lang === 'fr' ? 'Croissance' : 'Growth', price: '99', description: l.growthDesc, features: l.pricingFeatures.growth, cta: l.pricingCtaGrowth, highlighted: true },
    { name: lang === 'fr' ? 'Entreprise' : 'Enterprise', price: '199', description: l.enterpriseDesc, features: l.pricingFeatures.enterprise, cta: l.pricingCtaEnterprise, highlighted: false },
  ]

  const stats = [
    { value: '2 500+', label: l.statsCompanies },
    { value: '180 000+', label: l.statsJobs },
    { value: '42 M$+', label: l.statsRevenue },
    { value: '4,9 / 5', label: l.statsRating },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
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
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">{l.navFeatures}</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">{l.navPricing}</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">{l.navHowItWorks}</a>
            </div>

            <div className="flex items-center gap-3">
              {/* Language toggle */}
              <div className="hidden sm:flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <button onClick={() => setLang('en')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>EN</button>
                <button onClick={() => setLang('fr')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>FR</button>
              </div>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">{l.navSignIn}</Link>
              <Link href="/login" className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all duration-150 hover:shadow-md">
                {l.navGetStarted}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-16 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-indigo-50 opacity-60 blur-3xl" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-violet-50 opacity-50 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-50 opacity-40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 mb-8">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700">{l.badge}</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            {l.heroTitle1}{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {l.heroTitle2}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl leading-relaxed">{l.heroSub}</p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all duration-200">
              {l.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-base font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150">
              {l.ctaSecondary}
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
                    <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center"><div className="h-3 w-3 rounded-sm bg-white opacity-80" /></div>
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
                      { label: t.nav.customers, color: 'bg-blue-50 border-blue-100' },
                      { label: t.nav.jobs, color: 'bg-violet-50 border-violet-100' },
                      { label: t.invoices.totalInvoiced, color: 'bg-emerald-50 border-emerald-100' },
                      { label: t.dashboard.amountPaid, color: 'bg-amber-50 border-amber-100' },
                    ].map((kpi) => (
                      <div key={kpi.label} className={`rounded-xl border ${kpi.color} p-3`}>
                        <div className="h-2 w-12 rounded-full bg-gray-300 mb-1.5" />
                        <div className="h-4 w-16 rounded-full bg-gray-700" />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 bg-gray-50">
                      <div className="h-2.5 w-16 rounded-full bg-gray-300" />
                      <div className="ml-auto h-6 w-20 rounded-lg bg-indigo-100" />
                    </div>
                    {[1, 2, 3].map((row) => (
                      <div key={row} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                        <div className="h-7 w-7 rounded-full bg-gray-100 shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div className="h-2.5 w-24 rounded-full bg-gray-300" />
                          <div className="h-2 w-32 rounded-full bg-gray-200" />
                        </div>
                        <div className="h-5 w-16 rounded-full bg-emerald-100" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 hidden lg:block">
              <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-xl shadow-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle className="h-4 w-4 text-emerald-600" /></div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{lang === 'fr' ? 'Intervention terminée' : 'Job completed'}</p>
                    <p className="text-xs text-gray-400">{lang === 'fr' ? 'Réparation CVC · Il y a 2 min' : 'HVAC Repair · 2 min ago'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-6 bottom-12 hidden lg:block">
              <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-xl shadow-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center"><Sparkles className="h-4 w-4 text-indigo-600" /></div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{lang === 'fr' ? 'Aperçu IA' : 'AI Insight'}</p>
                    <p className="text-xs text-gray-400">{lang === 'fr' ? '3 factures dues aujourd\'hui' : '3 invoices due today'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-gray-900 sm:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">{l.featuresLabel}</p>
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">{l.featuresTitle}</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">{l.featuresSub}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">{l.howLabel}</p>
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">{l.howTitle}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: '01', title: l.step1Title, description: l.step1Desc, icon: Users },
              { step: '02', title: l.step2Title, description: l.step2Desc, icon: Briefcase },
              { step: '03', title: l.step3Title, description: l.step3Desc, icon: FileText },
            ].map((step) => (
              <div key={step.step} className="relative text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 ml-6 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-indigo-700">{step.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">{l.pricingLabel}</p>
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">{l.pricingTitle}</h2>
            <p className="mt-4 text-lg text-gray-500">{l.pricingSub}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 lg:gap-6">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={['relative rounded-2xl p-8 flex flex-col', plan.highlighted ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 ring-1 ring-indigo-500' : 'bg-white border border-gray-200 shadow-sm'].join(' ')}>
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                      <Star className="h-3 w-3" />{l.mostPopular}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <p className={`text-sm font-semibold uppercase tracking-wide mb-1 ${plan.highlighted ? 'text-indigo-200' : 'text-gray-500'}`}>{plan.name}</p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className={`text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>${plan.price}</span>
                    <span className={`mb-1 text-sm ${plan.highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>{l.pricingMonthly}</span>
                  </div>
                  <p className={`text-sm ${plan.highlighted ? 'text-indigo-100' : 'text-gray-500'}`}>{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlighted ? 'text-indigo-200' : 'text-indigo-600'}`} />
                      <span className={plan.highlighted ? 'text-indigo-50' : 'text-gray-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login" className={['inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-150', plan.highlighted ? 'bg-white text-indigo-700 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'].join(' ')}>
                  {plan.cta}<ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Shield, title: l.trust1Title, description: l.trust1Desc },
              { icon: Zap, title: l.trust2Title, description: l.trust2Desc },
              { icon: Sparkles, title: l.trust3Title, description: l.trust3Desc },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                  <item.icon className="h-6 w-6 text-indigo-600" />
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

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-16 sm:py-20 shadow-2xl shadow-indigo-100">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{l.ctaBannerTitle}</h2>
            <p className="mt-4 text-lg text-indigo-100">{l.ctaBannerSub}</p>
            <div className="mt-10">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors shadow-lg">
                {l.ctaBannerBtn}<ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 text-sm text-indigo-200">{l.ctaBannerNote}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
                <Wrench className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold text-gray-900">FieldOS</span>
            </div>
            <p className="text-sm text-gray-400">{l.footerCopyright}</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">{l.footerPrivacy}</a>
              <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">{l.footerTerms}</a>
              <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">{l.footerContact}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
