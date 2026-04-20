import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import SoumissionsContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Soumissions et devis professionnels | Gestivio',
  description: 'Créez des devis à partir de votre catalogue, envoyez par courriel et convertissez en facture en un clic. Approbation en ligne par le client.',
  path: '/fonctionnalites/soumissions',
  keywords: ['soumission entrepreneur', 'devis en ligne', 'estimation travaux', 'approbation client', 'conversion facture'],
})

export default function SoumissionsPage() {
  return <SoumissionsContent />
}
