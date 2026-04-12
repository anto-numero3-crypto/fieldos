// Industry landing page content — each entry becomes a /[slug] route via a
// generic template. Add an entry here to launch a new industry page.

export interface IndustryPage {
  slug: string // e.g. 'logiciel-plombier' -> /logiciel-plombier
  locale: 'fr' | 'en'
  industry: string // display name
  hero: { kicker: string; headline: string; sub: string }
  painPoints: string[]
  features: Array<{ title: string; description: string }>
  testimonial: { quote: string; author: string; business: string; city: string }
  faqs: Array<{ question: string; answer: string }>
  relatedSlugs?: string[]
  meta: { title: string; description: string; keywords: string[]; targetKeyword: string }
}

export const INDUSTRIES: IndustryPage[] = [
  {
    slug: 'logiciel-plombier',
    locale: 'fr',
    industry: 'Plombiers',
    hero: {
      kicker: 'Fait pour les plombiers québécois',
      headline: 'Le logiciel de gestion pour plombiers au Québec',
      sub: 'Gérez vos appels de service, facturez avec TPS/TVQ, suivez vos techniciens — le tout en français, à partir de 29 $/mois.',
    },
    painPoints: [
      "Les appels d'urgence interrompent sans arrêt vos autres interventions",
      'Les factures papier se perdent ou tardent à être envoyées',
      "La TPS et la TVQ doivent être calculées manuellement sur chaque facture",
      "Le suivi des garanties et des réparations antérieures est un casse-tête",
      "Les clients veulent réserver en ligne mais vous n'avez pas la plateforme",
    ],
    features: [
      { title: 'Répartition rapide des appels', description: "Assignez un appel de service à un technicien en quelques secondes depuis votre téléphone. Le technicien reçoit l'info, l'adresse et l'historique client instantanément." },
      { title: 'Facturation sur place avec TPS/TVQ', description: 'Convertissez une intervention en facture avec les taxes québécoises correctement calculées. Acceptez le paiement par Stripe directement dans la camionnette.' },
      { title: 'Historique client complet', description: "Chaque appartement, chaque maison, chaque bâtiment commercial: tout l'historique des interventions, pièces remplacées et garanties en un clin d'œil." },
      { title: "Réservation en ligne 24/7", description: 'Vos clients réservent un créneau sur votre portail Gestivio. Les urgences vous appellent; les rendez-vous planifiés se réservent tout seuls.' },
      { title: "IA qui répond à votre place", description: 'Un assistant IA bilingue filtre les questions fréquentes: prix approximatif, zones desservies, disponibilités — vous ne répondez qu\'aux vrais prospects.' },
    ],
    testimonial: {
      quote: "J'ai réduit mon temps administratif de 8 heures par semaine. Mes techniciens facturent sur place, les clients paient par Stripe avant même qu'on parte. Vraiment jeu changeant.",
      author: 'Marc Tremblay',
      business: 'Plomberie Tremblay inc.',
      city: 'Laval',
    },
    faqs: [
      { question: 'Gestivio gère-t-il la TPS et la TVQ automatiquement ?', answer: 'Oui. Entrez votre numéro de TPS et de TVQ une seule fois dans les paramètres. Les taxes sont ensuite calculées et appliquées automatiquement sur chaque facture, conformément aux règles de Revenu Québec.' },
      { question: 'Combien coûte Gestivio pour une petite entreprise de plomberie ?', answer: "Le plan de base est à 29 $ CAD par mois pour un utilisateur. Chaque technicien supplémentaire est à 15 $. Pas de frais cachés, en dollars canadiens, facturable annuellement pour 2 mois gratuits." },
      { question: "Puis-je utiliser Gestivio sur mon téléphone pendant une intervention ?", answer: "Oui. La plateforme est conçue pour le mobile. Un technicien peut voir l'adresse, marquer l'intervention comme terminée, prendre des photos, et envoyer la facture au client — le tout depuis son téléphone." },
      { question: "Est-ce que mes données restent au Canada ?", answer: 'Oui. Toutes les données sont hébergées au Canada, conformément à la LPRPDE et à la Loi 25 du Québec.' },
      { question: "Dois-je signer un contrat à long terme ?", answer: "Non. Vous pouvez annuler en tout temps depuis votre compte. Aucune pénalité, aucun frais de sortie." },
    ],
    relatedSlugs: ['logiciel-hvac'],
    meta: {
      title: 'Logiciel pour plombiers au Québec | Gestivio',
      description: 'Le logiciel de gestion tout-en-un pour plombiers au Québec. Facturation TPS/TVQ, appels de service, suivi clientèle. Essai gratuit 14 jours.',
      targetKeyword: 'logiciel plombier Quebec',
      keywords: ['logiciel plombier', 'plomberie Quebec', 'gestion plombier', 'facturation plomberie', 'application plombier'],
    },
  },

  {
    slug: 'logiciel-hvac',
    locale: 'fr',
    industry: 'CVC / HVAC',
    hero: {
      kicker: 'Pour les entrepreneurs en CVC au Québec',
      headline: 'Le logiciel de gestion pour techniciens CVC et HVAC',
      sub: "Gérez l'entretien préventif, les installations et les urgences. Contrats récurrents, équipement par site, facturation automatisée.",
    },
    painPoints: [
      "Les contrats d'entretien annuels sont difficiles à planifier et à facturer",
      "Chaque bâtiment a plusieurs unités CVC avec historiques de service distincts",
      "Les rappels de remplacement de filtres sont manuels et souvent oubliés",
      "Les pièces en inventaire dans la camionnette ne sont jamais à jour",
      "Les soumissions pour installations prennent des heures à préparer",
    ],
    features: [
      { title: "Contrats d'entretien récurrents", description: 'Planifiez automatiquement les visites annuelles ou semestrielles. Gestivio crée les rendez-vous, envoie les rappels et génère les factures selon votre contrat.' },
      { title: "Équipement par site", description: 'Chaque unité CVC, chaque chaudière, chaque thermopompe est enregistrée avec son emplacement, son historique de service et sa date de garantie.' },
      { title: "Soumissions rapides", description: "Créez des soumissions détaillées avec pièces, main-d'œuvre et taxes en moins de 5 minutes. Envoyez-les par courriel; le client les signe en ligne." },
      { title: "Rappels automatiques aux clients", description: "Gestivio envoie automatiquement aux clients des rappels pour l'entretien annuel — 30 jours avant la date prévue, avec un lien de réservation direct." },
      { title: "Facturation après chaque visite", description: 'Visite d\'entretien terminée ? Une facture est créée automatiquement avec les tarifs prévus au contrat, prête à être envoyée ou payée sur place.' },
    ],
    testimonial: {
      quote: "Gérer 200 contrats d'entretien annuel sur un chiffrier Excel, c'était un cauchemar. Avec Gestivio, tout est automatisé. J'ai récupéré 15 heures par semaine et je n'oublie plus jamais une visite.",
      author: 'Sylvie Lachance',
      business: 'Climatisation Lachance',
      city: 'Québec',
    },
    faqs: [
      { question: 'Peut-on gérer plusieurs unités CVC pour un même client ?', answer: 'Oui. Chaque client peut avoir plusieurs sites, et chaque site peut avoir plusieurs équipements (chaudière, thermopompe, climatiseur, etc.) avec leur propre historique de service.' },
      { question: 'Comment fonctionnent les contrats d\'entretien récurrents ?', answer: 'Vous définissez une fois la fréquence (mensuelle, trimestrielle, semestrielle, annuelle), le tarif, et les services inclus. Gestivio génère ensuite automatiquement les rendez-vous et les factures.' },
      { question: "Est-ce adapté à une entreprise avec plusieurs techniciens ?", answer: 'Oui. Chaque technicien a son propre compte, son calendrier, et accès à son propre planning. Le répartiteur peut assigner les appels en temps réel.' },
      { question: "Puis-je importer mes contrats existants ?", answer: "Oui. Nous offrons un import CSV gratuit pour migrer vos clients, équipements et contrats depuis Excel ou un autre logiciel." },
      { question: "Gestivio s'intègre-t-il à QuickBooks ?", answer: "Oui. L'intégration QuickBooks Canada est disponible sur les plans Growth et Pro pour synchroniser automatiquement les factures et les paiements." },
    ],
    relatedSlugs: ['logiciel-plombier'],
    meta: {
      title: 'Logiciel pour techniciens CVC au Québec | Gestivio',
      description: "Gestion de contrats d'entretien, équipement par site, soumissions rapides. Le logiciel HVAC fait pour les entrepreneurs québécois. Essai gratuit 14 jours.",
      targetKeyword: 'logiciel HVAC Quebec',
      keywords: ['logiciel HVAC', 'CVC Quebec', 'entretien climatisation', 'gestion CVC', 'logiciel climatisation'],
    },
  },
]

export function getIndustry(slug: string): IndustryPage | undefined {
  return INDUSTRIES.find((i) => i.slug === slug)
}
