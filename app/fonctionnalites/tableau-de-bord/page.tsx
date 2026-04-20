import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import TableauDeBordContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Tableau de bord | Gestivio',
  description: 'Votre business en un coup d\'oeil des que vous ouvrez l\'app. KPIs, interventions du jour, equipe et plus.',
  path: '/fonctionnalites/tableau-de-bord',
  keywords: ['tableau de bord', 'dashboard', 'KPIs', 'vue d\'ensemble', 'temps reel'],
})

export default function TableauDeBordPage() {
  return <TableauDeBordContent />
}
