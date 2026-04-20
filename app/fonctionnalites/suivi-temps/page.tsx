import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import SuiviTempsContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Suivi du temps et feuilles de temps | Gestivio',
  description: 'Pointage mobile, feuilles de temps automatiques et export CSV. Vos employés pointent, vous approuvez, la paie est prête.',
  path: '/fonctionnalites/suivi-temps',
  keywords: ['suivi temps employé', 'feuille de temps automatique', 'pointage mobile', 'heures travaillées', 'timesheet entrepreneur'],
})

export default function SuiviTempsPage() {
  return <SuiviTempsContent />
}
