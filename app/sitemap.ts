import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'
import { POSTS } from '@/content/blog'
import { INDUSTRIES } from '@/content/industries'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                          lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/about`,               lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/contact`,             lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/blog`,                lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/changelog`,           lastModified: now, changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${SITE_URL}/press`,               lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/privacy`,             lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/terms`,               lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/security`,            lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/accessibility`,       lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/cookies`,             lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/book`,                lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/login`,               lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/signup`,              lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/montreal`,            lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/vs/jobber`,           lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]

  for (const ind of INDUSTRIES) {
    pages.push({ url: `${SITE_URL}/${ind.slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 })
  }

  for (const post of POSTS) {
    pages.push({ url: `${SITE_URL}/blog/${post.slug}`, lastModified: new Date(post.publishedAt), changeFrequency: 'monthly', priority: 0.7 })
  }

  return pages
}
