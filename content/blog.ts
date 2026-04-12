// Blog content store — add articles here. Each post renders at /blog/[slug].
// Keep articles ~800-1200 words, H2/H3 structure, include target keyword
// 3-5 times naturally, end with a CTA to /signup.

export type Locale = 'fr' | 'en'

export interface BlogPost {
  slug: string
  locale: Locale
  title: string
  description: string // 150-160 chars for meta
  category: string
  excerpt: string // ~200 chars for card/index
  coverImage: string
  publishedAt: string // ISO date
  readingMinutes: number
  keywords: string[]
  targetKeyword: string
  // Markdown-style content. H2 = ##, H3 = ###, bold = **, lists = -
  body: string
  relatedSlugs?: string[]
}

export const POSTS: BlogPost[] = [
  {
    slug: 'facturer-plus-rapidement-entrepreneur-quebec',
    locale: 'fr',
    title: 'Comment facturer plus rapidement en tant qu\'entrepreneur au Québec',
    description: 'Réduisez votre temps de facturation. Guide pratique pour entrepreneurs québécois: automatisation, TPS/TVQ, modèles et outils.',
    category: 'Facturation',
    excerpt: 'Facturer rapidement, c\'est être payé rapidement. Voici comment les entrepreneurs québécois peuvent réduire leur temps de facturation de plusieurs heures par semaine.',
    coverImage: '/blog/facturation-rapide.png',
    publishedAt: '2026-03-15',
    readingMinutes: 6,
    targetKeyword: 'facturation entrepreneur Quebec',
    keywords: ['facturation', 'entrepreneur Québec', 'TPS TVQ', 'logiciel facturation', 'Gestivio'],
    body: `
## Le problème: la facturation gruge votre temps

La plupart des entrepreneurs québécois passent **4 à 6 heures par semaine** à préparer, envoyer et relancer des factures. C'est presque une journée complète perdue — du temps qui devrait servir à vendre, exécuter des contrats ou simplement profiter de votre fin de semaine.

Pire encore: plus vous tardez à envoyer une facture, plus vous tardez à être payé. Une facture envoyée le jour même du service est généralement payée beaucoup plus rapidement qu'une facture envoyée plusieurs jours plus tard.

Si vous faites de la **facturation entrepreneur Quebec**, voici comment reprendre votre temps.

## 1. Facturez sur place, pas le soir à la maison

Le moment le plus efficace pour facturer un client, c'est quand vous êtes encore sur place, après l'intervention. Le service est frais dans sa mémoire, il a son chéquier ou son téléphone à portée, et il n'a aucune raison de contester.

Avec un logiciel de **facturation entrepreneur Quebec** comme Gestivio, vous pouvez:
- Convertir une intervention terminée en facture en 3 tapes
- Envoyer la facture par courriel directement du téléphone
- Accepter le paiement par Stripe sur place (carte ou Apple Pay)

## 2. Automatisez le calcul de la TPS et de la TVQ

La TPS (5%) et la TVQ (9,975%) sont obligatoires pour la plupart des entrepreneurs au Québec. Les calculer à la main sur chaque facture, c'est:
- Une source constante d'erreurs
- Une perte de temps systématique
- Un risque fiscal en cas de vérification de Revenu Québec

Un bon logiciel applique automatiquement les bonnes taxes en fonction de votre statut et de la province du client. Votre numéro de TPS et TVQ apparaissent automatiquement sur chaque facture — conformité garantie.

## 3. Utilisez des modèles de factures

Vous facturez souvent les mêmes services? Créez des modèles. Pour chaque service — réparation de plomberie, entretien annuel de CVC, nettoyage résidentiel — stockez le nom, la description, le prix et la durée. Une fois sur place, il suffit de sélectionner le modèle.

Gain de temps typique: **2 à 3 minutes par facture**. Sur 20 factures par semaine, c'est une heure récupérée.

## 4. Rappels automatiques pour les factures en retard

Les factures impayées sont la première cause de problèmes de trésorerie chez les petits entrepreneurs. La solution n'est pas de courir après les clients manuellement — c'est d'automatiser les rappels.

Configurez des rappels automatiques:
- 3 jours avant l'échéance: courriel de courtoisie
- Le jour de l'échéance: rappel poli
- 7 jours après: rappel ferme avec lien de paiement
- 30 jours après: intervention humaine requise

Résultat: vos clients paient plus vite sans que vous leviez le petit doigt.

## 5. Offrez le paiement en ligne

Un client qui doit prendre son chéquier, trouver un timbre et aller à la poste va remettre à plus tard. Un client qui peut cliquer un bouton et payer avec Apple Pay en 30 secondes paie tout de suite.

Stripe, intégré à Gestivio, permet:
- Paiement par carte de crédit ou débit
- Apple Pay et Google Pay
- Virements Interac
- Dépôts automatiques à votre compte bancaire

Les frais sont de **2,9% + 0,30 $** par transaction — largement compensés par la vitesse de paiement.

## 6. Intégrez la facturation à votre comptabilité

Ré-entrer chaque facture dans QuickBooks le soir, c'est du double travail. Branchez votre logiciel de facturation à votre comptabilité (QuickBooks, Sage, etc.) pour synchroniser automatiquement:
- Les factures émises
- Les paiements reçus
- Les taxes collectées
- Les clients

## Ce que vous pouvez attendre

En appliquant les pratiques ci-dessus, la plupart des entrepreneurs constatent:
- Beaucoup moins de temps passé à préparer et envoyer des factures
- Des paiements reçus plus rapidement
- Zéro erreur de TPS/TVQ grâce au calcul automatique
- Moins de factures en retard grâce aux rappels automatisés

## Commencez dès aujourd'hui

La **facturation entrepreneur Quebec** n'a pas besoin d'être un fardeau. Avec les bons outils et processus, c'est 15 minutes par semaine au lieu de 5 heures.

Essayez [Gestivio gratuitement pendant 14 jours](/signup) — aucune carte de crédit requise. Importez votre liste de clients, créez vos modèles, et envoyez votre première facture aujourd'hui.
`,
    relatedSlugs: ['tps-tvq-entrepreneur-guide-complet', 'erreurs-facturation-entrepreneur-quebec'],
  },

  {
    slug: 'tps-tvq-entrepreneur-guide-complet',
    locale: 'fr',
    title: 'TPS et TVQ pour les entrepreneurs: guide complet 2026',
    description: 'Tout ce que les entrepreneurs québécois doivent savoir sur la TPS et la TVQ: quand s\'inscrire, comment facturer, les remises, les pénalités.',
    category: 'Fiscalité',
    excerpt: 'TPS à 5%, TVQ à 9,975%, obligations d\'inscription, remises trimestrielles… Le guide pratique pour ne plus jamais être perdu.',
    coverImage: '/blog/tps-tvq-guide.png',
    publishedAt: '2026-02-20',
    readingMinutes: 9,
    targetKeyword: 'TPS TVQ entrepreneur Quebec',
    keywords: ['TPS', 'TVQ', 'entrepreneur Québec', 'Revenu Québec', 'ARC', 'facturation'],
    body: `
## Introduction

Si vous êtes **entrepreneur au Québec**, la **TPS** (Taxe sur les produits et services, 5%) et la **TVQ** (Taxe de vente du Québec, 9,975%) font partie de votre quotidien — que vous le vouliez ou non. Ce guide couvre l'essentiel: quand s'inscrire, comment facturer, comment remettre, et surtout comment éviter les erreurs coûteuses.

## Quand devez-vous vous inscrire à la TPS et à la TVQ?

Vous êtes **obligé** de vous inscrire dès que vos revenus imposables dépassent **30 000 $ sur 12 mois consécutifs**. Ce seuil s'applique séparément à la TPS (Agence du revenu du Canada) et à la TVQ (Revenu Québec), mais en pratique la plupart des entrepreneurs s'inscrivent aux deux simultanément.

**Petit entrepreneur** (sous 30 000 $ par année): vous n'avez pas à facturer la TPS/TVQ, mais vous ne pouvez pas non plus récupérer les taxes payées sur vos achats (CTI/RTI).

## Inscription volontaire: est-ce une bonne idée?

Oui, dans la plupart des cas. Même sous 30 000 $, s'inscrire volontairement vous permet de:
- Récupérer la TPS et la TVQ sur vos achats (outils, véhicule, matériel)
- Projeter une image plus professionnelle auprès des clients commerciaux
- Simplifier la transition lorsque vous dépasserez le seuil

## Comment facturer correctement la TPS et la TVQ

Une facture conforme doit inclure:
- Votre **numéro de TPS** (format 123456789RT0001)
- Votre **numéro de TVQ** (format 1234567890TQ0001)
- Le montant avant taxes
- La TPS calculée séparément (5%)
- La TVQ calculée séparément (9,975% — appliquée sur le montant avant taxes, pas sur la TPS)
- Le total final

**Erreur courante**: appliquer la TVQ sur la TPS. Ce n'est plus le cas depuis 2013. Les deux taxes sont calculées séparément sur le sous-total avant taxes.

## Exemple concret

- Service: 1 000 $
- TPS (5%): 50 $
- TVQ (9,975%): 99,75 $
- **Total: 1 149,75 $**

## Remises: quand et comment?

La fréquence des remises dépend de vos revenus annuels:
- Moins de 1,5 M$: remise **trimestrielle** (par défaut) ou annuelle (sur demande)
- 1,5 M$ à 6 M$: remise **trimestrielle**
- Plus de 6 M$: remise **mensuelle**

Vous devez faire deux déclarations séparées:
1. **TPS** à l'Agence du revenu du Canada (ARC), via Mon dossier d'entreprise
2. **TVQ** à Revenu Québec, via Mon dossier pour les entreprises

Le calcul simple: **TPS/TVQ collectée – TPS/TVQ payée sur les achats = montant à remettre** (ou crédit).

## Crédits de taxes sur les intrants (CTI/RTI)

C'est ici que ça devient intéressant. Vous pouvez récupérer la TPS (CTI) et la TVQ (RTI) que vous avez payées sur:
- Matériel et fournitures
- Carburant et entretien du véhicule (proportion d'usage commercial)
- Logiciels et abonnements (comme Gestivio)
- Outils
- Téléphone cellulaire (partie commerciale)
- Loyer du bureau ou atelier

Gardez **toutes vos factures d'achat** — physiques ou numériques. Sans preuve, pas de CTI/RTI.

## Les erreurs qui coûtent cher

1. **Ne pas séparer les taxes** sur la facture client → refus du CTI/RTI par l'ARC/Revenu Québec
2. **Oublier de remettre à temps** → pénalités de 1% du montant dû + 25% de l'intérêt
3. **Mélanger fonds personnels et taxes collectées** → risque de les dépenser et de manquer à l'échéance
4. **Ne pas tenir de registre distinct des achats taxables** → perte de milliers de dollars en CTI/RTI non réclamés

## Comment Gestivio simplifie tout ça

Un logiciel de facturation conçu pour le Québec applique automatiquement les bonnes taxes, stocke votre numéro de TPS/TVQ sur chaque facture, et vous génère les rapports dont vous avez besoin pour vos remises trimestrielles.

Chez Gestivio, la **TPS TVQ entrepreneur Quebec** est calculée automatiquement, les rapports de remise sont générés en un clic, et tout est exportable vers votre comptabilité.

## Ressources officielles

- [Revenu Québec — TVQ](https://www.revenuquebec.ca/fr/entreprises/)
- [ARC — TPS/TVH](https://www.canada.ca/fr/agence-revenu.html)
- [Inscription à la TPS/TVQ](https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/inscription/)

## Conclusion

La TPS et la TVQ ne sont pas compliquées une fois qu'on a les bons outils et les bons processus. Utilisez un logiciel qui comprend la réalité québécoise, gardez vos factures d'achat, et remettez à temps.

[Essayez Gestivio gratuitement](/signup) et arrêtez de vous soucier des taxes — laissez le logiciel s'en occuper.
`,
    relatedSlugs: ['facturer-plus-rapidement-entrepreneur-quebec'],
  },

  {
    slug: 'field-service-software-quebec-2026',
    locale: 'en',
    title: 'Choosing Field Service Management Software in Quebec: 2026 Guide',
    description: 'What to look for when picking field service management software as a Quebec contractor: French support, CAD pricing, QST/GST handling, AI, data residency.',
    category: 'Software',
    excerpt: 'A practical guide to evaluating field service management software as a Quebec contractor — French support, local compliance, pricing, and the features that actually matter.',
    coverImage: '/blog/fsm-software-quebec.png',
    publishedAt: '2026-03-01',
    readingMinutes: 7,
    targetKeyword: 'field service software Quebec',
    keywords: ['field service management', 'FSM', 'Quebec contractor', 'Canadian software', 'HVAC software'],
    body: `
## Why Quebec contractors need a different kind of software

Most **field service software** on the market is built for US-based companies. They charge in USD, store your data outside Canada, don't speak a word of French, and have no idea what QST is.

If you run a plumbing, HVAC, cleaning, or electrical business in Quebec, you need **field service software Quebec** actually designed for your reality: GST/QST handling, French-language support, CAD pricing, and Canadian data residency under PIPEDA.

Here's a practical checklist for evaluating any field service platform as a Quebec contractor.

## Features that actually matter in Quebec

When evaluating **field service software Quebec**, prioritize the following — and don't compromise on any of them if you want the software to actually fit your daily reality.

### French language — native, not translated
Your technicians, customers, and automated emails should all feel native French. A half-translated interface with English error messages breaks down as soon as something goes wrong. Look for a product built bilingual from day one, not a US tool with a French veneer.

### GST + QST handled correctly on one invoice
Quebec's 9.975% QST applies to the subtotal, not on top of the 5% GST (since 2013). A lot of software built outside Canada gets this wrong. Before signing up, create a test invoice and verify both taxes are computed and stored separately.

### CAD pricing, no hidden foreign exchange markup
Avoid the USD → CAD markup on monthly subscriptions and the volatility of the exchange rate. Pay in dollars you earn.

### Canadian data residency
Under PIPEDA and Quebec's Law 25, storing personal customer data in Canada meaningfully simplifies your compliance posture. Ask the vendor where the data physically sits; "North America" is not the same as "Canada".

### AI that works in French
The next generation of field service tools uses AI to handle customer inquiries, suggest booking slots, draft follow-up emails, and flag dormant customers. That AI needs to actually work in French — not generic machine translation that produces stilted or wrong answers to your clients.

### Online booking that customers will actually use
A simple public URL (like gestivio.ca/book/votre-entreprise) that captures inquiries 24/7 is worth more than any number of integrations. Check how many clicks it takes for a customer to book a slot.

### Support in your language
When something breaks, you want to talk to a human in French who understands the Quebec context — not a chat bot and not a support queue in a different time zone.

## A quick decision framework

**1–5 person shop, Quebec-based, lots of French-speaking customers** — prioritize native bilingual interface, native QST handling, and CAD pricing. Cheaper is usually better at this stage; features you won't use are just noise.

**6–20 person operation across multiple cities** — start caring about team management, technician assignment, and real-time calendar sync. The AI-assistant features start paying for themselves by saving hours per week.

**Enterprise (50+ technicians, multiple branches)** — integrations, advanced reporting, and dedicated account management become the deciding factors. At this scale, switching costs are real, so do a paid pilot before committing.

## The Gestivio angle

Gestivio was built specifically for the gaps above: bilingual FR/EN by default, automatic GST + QST on every invoice, pricing in CAD, data hosted in Canada, AI booking portal included. If you want to see how it fits your workflow, the [14-day free trial](/signup) requires no credit card.

Whatever you pick — just don't settle for software that makes you translate your own error messages.

[Try Gestivio free for 14 days](/signup) and see the difference local software makes.
`,
    relatedSlugs: ['invoice-clients-contractor-canada'],
  },
]

export function getPostsByLocale(locale: Locale): BlogPost[] {
  return POSTS.filter((p) => p.locale === locale).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
}

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug)
}
