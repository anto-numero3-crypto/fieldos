import Link from 'next/link'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import { IndustryPage } from '@/content/industries'
import MarketingShell from './MarketingShell'
import NewsletterSignup from './NewsletterSignup'

export default function IndustryPageTemplate({ page }: { page: IndustryPage }) {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">{page.hero.kicker}</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">{page.hero.headline}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mb-8">{page.hero.sub}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
              Essai gratuit 14 jours <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Parler à un conseiller
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-8 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span>🍁</span> Fait au Québec</span>
            <span className="flex items-center gap-1.5">✓ Données au Canada</span>
            <span className="flex items-center gap-1.5">✓ Support en français</span>
            <span className="flex items-center gap-1.5">✓ Aucune carte de crédit requise</span>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Les défis quotidiens des {page.industry.toLowerCase()}</h2>
        <p className="text-gray-500 mb-8 max-w-2xl">Si un ou plusieurs de ces problèmes vous parlent, Gestivio a été conçu pour vous.</p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {page.painPoints.map((p, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-5">
              <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-600 text-xs font-bold">!</span>
              <span className="text-sm text-gray-700 leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Features */}
      <section className="bg-gray-50/60 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Ce que Gestivio fait pour vous</h2>
          <p className="text-gray-500 mb-10 max-w-2xl">Des fonctionnalités précises, développées pour la réalité de votre métier.</p>
          <div className="grid gap-6 md:grid-cols-2">
            {page.features.map((f, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 mb-4">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50/60 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Questions fréquentes</h2>
          <div className="space-y-3">
            {page.faqs.map((q, i) => (
              <details key={i} className="group rounded-2xl border border-gray-100 bg-white p-5">
                <summary className="cursor-pointer font-semibold text-gray-900 flex items-start justify-between gap-3">
                  <span>{q.question}</span>
                  <span className="text-indigo-600 text-lg leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{q.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 sm:p-12 text-white text-center">
          <Sparkles className="h-8 w-8 text-indigo-200 mx-auto mb-3" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Prêt à moderniser votre entreprise de {page.industry.toLowerCase()} ?</h2>
          <p className="text-indigo-100 max-w-xl mx-auto mb-7">Essayez Gestivio gratuitement pendant 14 jours. Aucune carte de crédit. Aucun engagement.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 px-6 py-3 text-sm font-semibold hover:bg-indigo-50">
            Commencer l&apos;essai gratuit <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 pb-16">
        <NewsletterSignup />
      </section>
    </MarketingShell>
  )
}
