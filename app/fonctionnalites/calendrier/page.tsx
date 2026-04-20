import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import CalendrierContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Calendrier | Gestivio',
  description: 'Votre agenda et vos disponibilites toujours a jour. Vue semaine, mois, glisser-deposer et synchronisation Google Calendar.',
  path: '/fonctionnalites/calendrier',
  keywords: ['calendrier', 'agenda', 'disponibilites', 'Google Calendar', 'glisser-deposer'],
})

export default function CalendrierPage() {
  return <CalendrierContent />
}
