import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    // Core pages
    { url: SITE_URL,                                          lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/pricing`,                             lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/signup`,                              lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/about`,                               lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/contact`,                             lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/login`,                               lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/book`,                                lastModified: now, changeFrequency: 'monthly', priority: 0.6 },

    // Industry pages
    { url: `${SITE_URL}/logiciel-plombier`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/logiciel-electricien`,                lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/logiciel-cvc`,                        lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/logiciel-nettoyage`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/logiciel-paysagiste`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/logiciel-renovateur`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.9 },

    // City pages
    { url: `${SITE_URL}/montreal`,                            lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/quebec-city`,                         lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/laval`,                               lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/longueuil`,                           lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/rive-sud`,                            lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Blog articles
    { url: `${SITE_URL}/blogue/logiciel-plombier-quebec`,             lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/blogue/facturation-entrepreneur-quebec`,      lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/blogue/gestion-interventions-terrain`,        lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/blogue/portail-reservation-entreprise-service`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Comparison pages
    { url: `${SITE_URL}/vs/jobber`,                           lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/vs/progressionlive`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

    // Legal
    { url: `${SITE_URL}/privacy`,                             lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/terms`,                               lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/security`,                            lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/accessibility`,                       lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/cookies`,                             lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/changelog`,                           lastModified: now, changeFrequency: 'weekly',  priority: 0.3 },
  ]
}
