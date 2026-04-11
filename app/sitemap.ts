import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://gestivio.ca'
  const now = new Date()

  return [
    { url: base,               lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/about`,    lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/contact`,  lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/changelog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/support`,  lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/privacy`,  lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/terms`,    lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/security`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/accessibility`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/cookies`,  lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/book`,     lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/login`,    lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]
}
