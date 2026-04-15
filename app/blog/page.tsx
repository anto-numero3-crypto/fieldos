'use client'

import Link from 'next/link'
import { Wrench, Clock, ArrowRight, Calendar } from 'lucide-react'
import { getPostsByLocale } from '@/content/blog'
import JsonLd from '@/components/JsonLd'
import { breadcrumbSchema } from '@/lib/schema'
import NewsletterSignup from '@/components/NewsletterSignup'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function BlogIndexPage() {
  const { lang } = useLanguage()
  const posts = lang === 'fr'
    ? [...getPostsByLocale('fr'), ...getPostsByLocale('en')]
    : [...getPostsByLocale('en'), ...getPostsByLocale('fr')]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <LanguageToggle />
      </div>

      <JsonLd data={breadcrumbSchema([
        { name: lang === 'fr' ? 'Accueil' : 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
      ])} />

      <nav className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600"><Wrench className="h-4 w-4 text-white" strokeWidth={2.5} /></div>
            <span className="text-base font-bold text-gray-900">Gestivio</span>
          </Link>
          <Link href="/signup" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            {lang === 'fr' ? 'Essayer gratuitement' : 'Try for free'}
          </Link>
        </div>
      </nav>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">Blog</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            {lang === 'fr' ? 'Conseils pour entrepreneurs' : 'Tips for entrepreneurs'}
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl">
            {lang === 'fr'
              ? 'Guides pratiques pour faire croître votre entreprise de services : facturation, fiscalité québécoise, gestion d\'équipe, outils numériques.'
              : 'Practical guides to grow your service business: invoicing, Canadian tax, team management, and digital tools.'}
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="h-8 w-8 text-indigo-300 mb-3" />
            <p className="text-gray-500">
              {lang === 'fr' ? 'Les premiers articles arrivent bientôt.' : 'The first articles are coming soon.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={`${post.locale}-${post.slug}`}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <div className="aspect-[16/9] bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                  <span className="text-xs uppercase tracking-widest text-indigo-400 font-semibold">{post.category}</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 uppercase tracking-wide">{post.locale === 'fr' ? 'FR' : 'EN'}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.publishedAt).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readingMinutes} min</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{post.title}</h2>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-3">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 mt-3">
                    {lang === 'fr' ? 'Lire l\'article' : 'Read article'} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-16">
          <NewsletterSignup
            title={lang === 'fr' ? 'Recevez nos conseils chaque semaine' : 'Get our weekly tips'}
            description={lang === 'fr'
              ? 'Un courriel par semaine avec les meilleures pratiques de gestion pour entrepreneurs québécois. Pas de spam. Désabonnement en un clic.'
              : 'One email per week with the best management practices for Canadian entrepreneurs. No spam. Unsubscribe in one click.'}
          />
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio</p>
      </footer>
    </div>
  )
}
