import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import ContratsContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Gestion de contrats saisonniers | Gestivio',
  description: 'Créez des contrats récurrents avec signature électronique, facturation automatique et génération d\'interventions. Idéal pour l\'entretien saisonnier.',
  path: '/fonctionnalites/contrats',
  keywords: ['contrat saisonnier', 'signature électronique', 'facturation récurrente', 'contrat entretien', 'gestion contrats Québec'],
})

export default function ContratsPage() {
  return <ContratsContent />
}
