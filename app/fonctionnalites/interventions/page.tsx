import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import InterventionsContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Gestion d\'interventions terrain | Gestivio',
  description: 'Créez, assignez et suivez vos interventions depuis votre téléphone. Calendrier, multi-assignation, statuts en temps réel et synchronisation Google Calendar.',
  path: '/fonctionnalites/interventions',
  keywords: ['gestion interventions', 'logiciel terrain', 'calendrier technicien', 'assignation jobs', 'suivi interventions Québec'],
})

export default function InterventionsPage() {
  return <InterventionsContent />
}
