import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const TODAY = new Date().toISOString().split('T')[0]

interface Service {
  id: string
  name: string
  description: string | null
  base_price: number
  duration_minutes: number
}

interface BookingState {
  serviceId:   string | null
  serviceName: string | null
  date:        string | null
  time:        string | null
  name:        string | null
  email:       string | null
  phone:       string | null
  address:     string | null
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

function buildSystem(
  businessName: string,
  agentName: string,
  services: Service[],
  state: BookingState,
  availableSlots: string[]
): string {
  const serviceList = services.length > 0
    ? services.map(s =>
        `  • ${s.name} (${s.duration_minutes} min${s.base_price > 0 ? `, CA$${s.base_price.toFixed(2)}` : ''})${s.description ? ` — ${s.description}` : ''}`
      ).join('\n')
    : '  (Aucun service configuré — inviter le client à contacter l\'entreprise directement)'

  const stateLines = [
    `Service sélectionné : ${state.serviceName ?? 'non collecté'}`,
    `Date souhaitée : ${state.date ?? 'non collectée'}`,
    `Heure souhaitée : ${state.time ?? 'non collectée'}`,
    `Nom du client : ${state.name ?? 'non collecté'}`,
    `Email : ${state.email ?? 'non collecté'}`,
    `Téléphone : ${state.phone ?? 'non collecté'}`,
    `Adresse : ${state.address ?? 'non collectée'}`,
  ].join('\n  ')

  const slotInfo = availableSlots.length > 0
    ? `CRÉNEAUX DISPONIBLES pour ${state.date} : ${availableSlots.join(', ')}\n  ⚠️  N'offre QUE ces créneaux. Ne jamais inventer d'horaires.`
    : state.date
      ? `Aucun créneau disponible pour ${state.date}. Informe le client et suggère de choisir une autre date.`
      : `Les créneaux seront chargés une fois que le client aura choisi sa date.`

  return `Tu es ${agentName}, l'assistant de réservation IA pour ${businessName}. Tu aides les clients à réserver un rendez-vous de manière efficace et chaleureuse.

SERVICES RÉELS DISPONIBLES (n'offre QUE ceux-ci, ne jamais en inventer) :
${serviceList}

ÉTAT ACTUEL DE LA RÉSERVATION (NE PAS redemander ces informations) :
  ${stateLines}

${slotInfo}

RÈGLES ABSOLUES :
1. Ne demande JAMAIS une information déjà dans l'état ci-dessus
2. N'offre QUE les services listés ci-dessus
3. N'offre QUE les créneaux listés dans CRÉNEAUX DISPONIBLES
4. Une seule question par message
5. Sois chaleureux mais efficace — max 2-3 phrases par message
6. La date d'aujourd'hui est ${TODAY}
7. Accepte les dates en langage naturel (demain, vendredi prochain, le 15 décembre)

FLUX DE CONVERSATION :
- Si service non sélectionné → demander quel service (les boutons sont affichés — attends le clic)
- Si service OK mais date manquante → demander la date souhaitée
- Si date OK mais créneaux non encore chargés → dire "je charge les disponibilités..."
- Si créneaux chargés mais heure manquante → présenter les créneaux (les boutons sont affichés)
- Si heure OK mais nom manquant → demander le prénom et nom
- Si nom OK mais email manquant → demander l'email
- Si email OK mais téléphone manquant → demander le téléphone (optionnel)
- Si tout collecté (service + date + heure + nom + email) → afficher le résumé et demander confirmation

EXTRACTION DE DONNÉES :
Quand le client fournit une information, extrais-la et inclus-la à la fin de ton message dans ce format EXACT :
DATA:{"field":"value"}
Champs possibles : date (YYYY-MM-DD), name, email, phone, address

Quand TOUT est collecté ET que le client confirme → output :
BOOKING_READY:{"serviceId":"${'{serviceId}'}","serviceName":"${'{serviceName}'}","date":"YYYY-MM-DD","time":"HH:MM","name":"Prénom Nom","email":"email","phone":"tel ou vide","address":"adresse ou vide"}

Ne combine JAMAIS BOOKING_READY avec d'autres contenus après.`
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      reply: "Je rencontre une difficulté technique. Veuillez appeler directement l'entreprise.",
      extractedData: null,
      bookingReady: null,
    })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const {
    message,
    businessName = 'notre entreprise',
    agentName = 'Alex',
    services = [] as Service[],
    bookingState = {} as BookingState,
    availableSlots = [] as string[],
    history = [] as ConversationMessage[],
  } = await req.json()

  const state: BookingState = {
    serviceId:   bookingState.serviceId   ?? null,
    serviceName: bookingState.serviceName ?? null,
    date:        bookingState.date        ?? null,
    time:        bookingState.time        ?? null,
    name:        bookingState.name        ?? null,
    email:       bookingState.email       ?? null,
    phone:       bookingState.phone       ?? null,
    address:     bookingState.address     ?? null,
  }

  const messages = [
    ...history.map((h: ConversationMessage) => ({ role: h.role, content: h.content })),
    { role: 'user' as const, content: message },
  ]

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: buildSystem(businessName, agentName, services, state, availableSlots),
      messages,
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract BOOKING_READY
    const bookingMatch = raw.match(/BOOKING_READY:(\{[\s\S]*?\})/)
    if (bookingMatch) {
      try {
        const bookingReady = JSON.parse(bookingMatch[1])
        const reply = raw.replace(/BOOKING_READY:[\s\S]*$/, '').trim()
        return NextResponse.json({
          reply: reply || "Parfait, je confirme votre réservation maintenant…",
          extractedData: null,
          bookingReady,
        })
      } catch { /* continue */ }
    }

    // Extract DATA field updates
    const dataMatch = raw.match(/DATA:(\{[^}]+\})/)
    let extractedData: Record<string, string> | null = null
    let reply = raw

    if (dataMatch) {
      try {
        extractedData = JSON.parse(dataMatch[1])
        reply = raw.replace(/DATA:\{[^}]+\}/, '').trim()
      } catch { /* ignore */ }
    }

    return NextResponse.json({ reply, extractedData, bookingReady: null })
  } catch (err) {
    console.error('AI booking error:', err)
    return NextResponse.json({
      reply: "Je rencontre une difficulté. Veuillez réessayer dans un instant.",
      extractedData: null,
      bookingReady: null,
    })
  }
}
