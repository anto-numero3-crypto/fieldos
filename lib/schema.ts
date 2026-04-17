// JSON-LD schema builders for SEO-rich markup.
// Drop the returned object inside a <script type="application/ld+json"> tag.

import { SITE_URL } from './seo'

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Gestivio',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      'https://www.linkedin.com/company/gestivio',
      'https://twitter.com/gestivio',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@gestivio.ca',
      availableLanguage: ['French', 'English'],
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Montréal',
      addressRegion: 'QC',
      addressCountry: 'CA',
    },
  }
}

export function globalSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Gestivio',
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    description: "Logiciel de gestion d'interventions pour entrepreneurs en services au Québec. Facturation TPS/TVQ, planification, portail client IA.",
    inLanguage: ['fr-CA', 'en-CA'],
    offers: [
      { '@type': 'Offer', name: 'Démarrage', price: '39', priceCurrency: 'CAD', url: `${SITE_URL}/pricing` },
      { '@type': 'Offer', name: 'Pro', price: '79', priceCurrency: 'CAD', url: `${SITE_URL}/pricing` },
      { '@type': 'Offer', name: 'Croissance', price: '149', priceCurrency: 'CAD', url: `${SITE_URL}/pricing` },
    ],
    featureList: [
      'Facturation TPS/TVQ automatique',
      'Planification et calendrier',
      'Portail de réservation IA',
      'Gestion clientèle',
      'Rapports et analytiques',
      'Paiements en ligne Stripe',
      'Interface bilingue FR/EN',
      'Application mobile responsive',
    ],
  }
}

export function globalFaqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Gestivio est-il conçu pour les entrepreneurs du Québec ?',
        acceptedAnswer: { '@type': 'Answer', text: "Oui. Gestivio est développé au Québec et gère automatiquement la TPS/TVQ, l'interface bilingue FR/EN, et l'hébergement des données au Canada conformément à la Loi 25." },
      },
      {
        '@type': 'Question',
        name: 'Quels types d\'entrepreneurs peuvent utiliser Gestivio ?',
        acceptedAnswer: { '@type': 'Answer', text: 'Gestivio est conçu pour les plombiers, électriciens, techniciens CVC/HVAC, entreprises de nettoyage, paysagistes, rénovateurs et tout entrepreneur qui se déplace chez ses clients.' },
      },
      {
        '@type': 'Question',
        name: 'Y a-t-il un essai gratuit ?',
        acceptedAnswer: { '@type': 'Answer', text: 'Oui, Gestivio offre un essai gratuit de 14 jours sans carte de crédit requise. Vous avez accès à toutes les fonctionnalités pendant la période d\'essai.' },
      },
      {
        '@type': 'Question',
        name: 'Gestivio est-il une alternative à Jobber au Québec ?',
        acceptedAnswer: { '@type': 'Answer', text: "Oui. Contrairement à Jobber, Gestivio est bilingue, gère nativement la TPS/TVQ du Québec, héberge les données au Canada, et offre un portail de réservation propulsé par l'IA — le tout à un prix compétitif en dollars canadiens." },
      },
      {
        '@type': 'Question',
        name: 'Comment Gestivio gère-t-il la TPS et la TVQ ?',
        acceptedAnswer: { '@type': 'Answer', text: "Vous entrez vos numéros de TPS et de TVQ une seule fois dans les paramètres. Gestivio applique ensuite automatiquement les taxes québécoises sur chaque facture et soumission, conformément aux règles de Revenu Québec." },
      },
    ],
  }
}

export function softwareApplicationSchema(opts: {
  name?: string
  description: string
  applicationCategory?: string
  price?: string
} = { description: '' }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: opts.name || 'Gestivio',
    operatingSystem: 'Web',
    applicationCategory: opts.applicationCategory || 'BusinessApplication',
    description: opts.description,
    offers: {
      '@type': 'Offer',
      price: opts.price || '0',
      priceCurrency: 'CAD',
    },
  }
}

export function articleSchema(opts: {
  headline: string
  description: string
  image: string
  datePublished: string
  dateModified?: string
  author?: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    image: opts.image.startsWith('http') ? opts.image : `${SITE_URL}${opts.image}`,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    author: { '@type': 'Organization', name: opts.author || 'Gestivio' },
    publisher: {
      '@type': 'Organization',
      name: 'Gestivio',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
  }
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  }
}

export function faqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

export function localBusinessSchema(opts: {
  name?: string
  city: string
  region?: string
  country?: string
  description: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: opts.name || `Gestivio ${opts.city}`,
    description: opts.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: opts.city,
      addressRegion: opts.region || 'QC',
      addressCountry: opts.country || 'CA',
    },
    url: SITE_URL,
  }
}

export function productSchema(opts: {
  name: string
  description: string
  brand?: string
  price?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: opts.name,
    description: opts.description,
    brand: { '@type': 'Brand', name: opts.brand || 'Gestivio' },
    offers: {
      '@type': 'Offer',
      price: opts.price || '0',
      priceCurrency: 'CAD',
      availability: 'https://schema.org/InStock',
    },
  }
}

