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

