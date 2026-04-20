import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import RapportsContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Rapports | Gestivio',
  description: 'Comprenez votre business en un coup d\'oeil. Revenus, taux de completion, meilleurs clients et plus.',
  path: '/fonctionnalites/rapports',
  keywords: ['rapports', 'revenus', 'statistiques', 'export CSV', 'tendances'],
})

export default function RapportsPage() {
  return <RapportsContent />
}
