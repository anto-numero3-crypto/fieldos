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

    // Feature detail pages
    { url: `${SITE_URL}/fonctionnalites/interventions`,          lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/facturation`,            lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/paiements`,              lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/portail-ia`,             lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/equipe`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/contrats`,               lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/suivi-temps`,            lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/soumissions`,            lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/assistant-ia`,           lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/clients`,                lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/calendrier`,             lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/rapports`,               lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/reservations`,           lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/notifications`,          lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/import`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/tableau-de-bord`,        lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/fonctionnalites/devis`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

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
