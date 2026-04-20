import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import FacturationContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Facturation pour entrepreneurs | Gestivio',
  description: 'Créez des factures professionnelles en moins de 30 secondes grâce à l\'IA. TPS/TVQ automatique, numérotation séquentielle, paiement en ligne Stripe.',
  path: '/fonctionnalites/facturation',
  keywords: ['facturation entrepreneur', 'facture IA', 'TPS TVQ automatique', 'paiement en ligne', 'facturation Québec'],
})

export default function FacturationPage() {
  return <FacturationContent />
}
