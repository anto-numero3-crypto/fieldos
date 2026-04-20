import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import ImportContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Import de donnees | Gestivio',
  description: 'Migrez vers Gestivio en quelques minutes. Import CSV de clients, factures et plus.',
  path: '/fonctionnalites/import',
  keywords: ['import CSV', 'migration donnees', 'import clients', 'import factures'],
})

export default function ImportPage() {
  return <ImportContent />
}
