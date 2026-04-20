import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import EquipeContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Gestion d\'équipe terrain | Gestivio',
  description: 'Invitez vos techniciens par courriel, assignez les interventions et suivez les heures. Accès sécurisé, vue mobile et pointage intégrés.',
  path: '/fonctionnalites/equipe',
  keywords: ['gestion équipe terrain', 'technicien mobile', 'pointage employé', 'assignation intervention', 'feuille de temps'],
})

export default function EquipePage() {
  return <EquipeContent />
}
