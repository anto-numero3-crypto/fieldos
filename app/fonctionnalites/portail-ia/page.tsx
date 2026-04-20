import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import PortailIAContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Portail de réservation IA | Gestivio',
  description: 'Un assistant IA bilingue qui prend vos rendez-vous 24/7. Vos clients réservent en ligne, vous recevez les demandes dans votre tableau de bord.',
  path: '/fonctionnalites/portail-ia',
  keywords: ['réservation en ligne', 'assistant IA', 'portail client', 'booking automatique', 'chatbot entrepreneur'],
})

export default function PortailIAPage() {
  return <PortailIAContent />
}
