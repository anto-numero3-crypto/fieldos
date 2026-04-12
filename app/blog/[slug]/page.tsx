import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Wrench, ArrowLeft, Clock, Calendar, ArrowRight, Share2 } from 'lucide-react'
import { buildMetadata, SITE_URL } from '@/lib/seo'
import { getPost, POSTS } from '@/content/blog'
import JsonLd from '@/components/JsonLd'
import { articleSchema, breadcrumbSchema } from '@/lib/schema'
import MarkdownLite from '@/components/MarkdownLite'
import NewsletterSignup from '@/components/NewsletterSignup'

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return buildMetadata({ title: 'Article introuvable', description: '', path: `/blog/${slug}`, noIndex: true })
  return buildMetadata({
    title: `${post.title} | Gestivio`,
    description: post.description,
    path: `/blog/${post.slug}`,
    locale: post.locale,
    image: post.coverImage,
    keywords: post.keywords,
    type: 'article',
    publishedAt: post.publishedAt,
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const related = (post.relatedSlugs || [])
    .map((s) => getPost(s))
    .filter((p): p is NonNullable<typeof p> => !!p)

  const url = `${SITE_URL}/blog/${post.slug}`

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <JsonLd data={[
        articleSchema({
          headline: post.title,
          description: post.description,
          image: post.coverImage,
          datePublished: post.publishedAt,
          url,
        }),
        breadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: post.title, url: `/blog/${post.slug}` },
        ]),
      ]} />

      <nav className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600"><Wrench className="h-4 w-4 text-white" strokeWidth={2.5} /></div>
            <span className="text-base font-bold text-gray-900">Gestivio</span>
          </Link>
          <Link href="/signup" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Essayer gratuitement</Link>
        </div>
      </nav>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Tous les articles
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 uppercase tracking-wide">
            <span className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 font-semibold">{post.category}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.publishedAt).toLocaleDateString(post.locale === 'fr' ? 'fr-CA' : 'en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readingMinutes} min</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{post.title}</h1>
          <p className="text-lg text-gray-500 mt-3 leading-relaxed">{post.excerpt}</p>
        </header>

        <div className="aspect-[16/9] rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 mb-10 flex items-center justify-center">
          <span className="text-sm uppercase tracking-widest text-indigo-400 font-semibold">{post.category}</span>
        </div>

        <article>
          <MarkdownLite source={post.body} />
        </article>

        {/* Share */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-3">
          <Share2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Partager:</span>
          <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">Twitter</a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">LinkedIn</a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">Facebook</a>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white">
          <h3 className="text-xl font-bold mb-2">Essayez Gestivio gratuitement</h3>
          <p className="text-indigo-100 mb-5">La plateforme de gestion pour entrepreneurs québécois. Facturation, rendez-vous, clientèle. 14 jours d&apos;essai, aucune carte requise.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 px-5 py-2.5 text-sm font-semibold hover:bg-indigo-50">
            Commencer l&apos;essai gratuit <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-14">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Articles connexes</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="block rounded-xl border border-gray-100 bg-white p-4 hover:shadow-md transition-all">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-1">{r.category}</p>
                  <p className="font-semibold text-gray-900 group-hover:text-indigo-700">{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-14">
          <NewsletterSignup
            title="Plus d'articles comme celui-ci"
            description="Un courriel par semaine avec les meilleures pratiques de gestion pour entrepreneurs québécois."
          />
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400 mt-10">
        <p>© {new Date().getFullYear()} Gestivio</p>
      </footer>
    </div>
  )
}
