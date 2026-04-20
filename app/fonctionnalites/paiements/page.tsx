import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import PaiementsContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Paiements en ligne pour entrepreneurs | Gestivio',
  description: 'Encaissez le jour même par carte, Apple Pay ou Google Pay via Stripe. Reçus automatiques, rappels et suivi des paiements intégrés.',
  path: '/fonctionnalites/paiements',
  keywords: ['paiement en ligne entrepreneur', 'Stripe entrepreneur', 'encaisser carte crédit', 'paiement facture Québec'],
})

export default function PaiementsPage() {
  return <PaiementsContent />
}
