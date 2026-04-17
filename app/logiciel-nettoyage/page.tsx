import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { getIndustry } from '@/content/industries'
import IndustryPageTemplate from '@/components/IndustryPageTemplate'
import JsonLd from '@/components/JsonLd'
import { softwareApplicationSchema, breadcrumbSchema, faqSchema } from '@/lib/schema'
import { notFound } from 'next/navigation'

const SLUG = 'logiciel-nettoyage'

export const metadata: Metadata = (() => {
  const page = getIndustry(SLUG)
  if (!page) return { title: 'Introuvable' }
  return buildMetadata({
    title: page.meta.title,
    description: page.meta.description,
    path: `/${SLUG}`,
    locale: 'fr',
    keywords: page.meta.keywords,
  })
})()

export default function Page() {
  const page = getIndustry(SLUG)
  if (!page) notFound()
  return (
    <>
      <JsonLd data={[
        softwareApplicationSchema({ description: page.meta.description }),
        breadcrumbSchema([{ name: 'Accueil', url: '/' }, { name: page.industry, url: `/${SLUG}` }]),
        faqSchema(page.faqs),
      ]} />
      <IndustryPageTemplate page={page} />
    </>
  )
}
