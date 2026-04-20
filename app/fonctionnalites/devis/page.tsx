import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import DevisContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Devis | Gestivio',
  description: 'Des devis professionnels approuves en 1 clic. Catalogue, envoi, approbation en ligne et conversion en facture.',
  path: '/fonctionnalites/devis',
  keywords: ['devis', 'soumission', 'approbation en ligne', 'conversion facture', 'catalogue'],
})

export default function DevisPage() {
  return <DevisContent />
}
