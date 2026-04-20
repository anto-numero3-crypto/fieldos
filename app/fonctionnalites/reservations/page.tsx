import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import ReservationsContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Reservations en ligne | Gestivio',
  description: 'Vos clients reservent eux-memes en ligne. Lien personnalise, catalogue de services et notifications automatiques.',
  path: '/fonctionnalites/reservations',
  keywords: ['reservations en ligne', 'portail client', 'prise de rendez-vous', 'booking'],
})

export default function ReservationsPage() {
  return <ReservationsContent />
}
