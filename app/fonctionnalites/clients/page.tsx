import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import ClientsContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Gestion des clients | Gestivio',
  description: 'Centralisez toutes les informations de vos clients en un seul endroit. Historique, contacts, notes et plus.',
  path: '/fonctionnalites/clients',
  keywords: ['gestion clients', 'CRM', 'historique client', 'import CSV', 'profil client'],
})

export default function ClientsPage() {
  return <ClientsContent />
}
