import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import NotificationsContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Notifications automatiques | Gestivio',
  description: 'Vos clients toujours informes, sans effort. Rappels, confirmations et suivis envoyes automatiquement.',
  path: '/fonctionnalites/notifications',
  keywords: ['notifications automatiques', 'rappels', 'SMS', 'courriel automatique', 'communication client'],
})

export default function NotificationsPage() {
  return <NotificationsContent />
}
