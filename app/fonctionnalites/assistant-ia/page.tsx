import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import AssistantIAContent from './_content'

export const metadata: Metadata = buildMetadata({
  title: 'Assistant IA pour votre entreprise | Gestivio',
  description: 'Posez n\'importe quelle question sur votre entreprise et obtenez une réponse instantanée. Revenus, clients, historique — tout est accessible en langage naturel.',
  path: '/fonctionnalites/assistant-ia',
  keywords: ['assistant IA entreprise', 'intelligence artificielle entrepreneur', 'analyse données entreprise', 'chatbot business'],
})

export default function AssistantIAPage() {
  return <AssistantIAContent />
}
