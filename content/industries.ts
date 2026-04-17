// Industry landing page content — each entry becomes a /[slug] route via a
// generic template. Add an entry here to launch a new industry page.

export interface IndustryPage {
  slug: string // e.g. 'logiciel-plombier' -> /logiciel-plombier
  locale: 'fr' | 'en'
  industry: string // display name
  hero: { kicker: string; headline: string; sub: string }
  painPoints: string[]
  features: Array<{ title: string; description: string }>
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
      sub: 'Gérez vos appels de service, facturez avec TPS/TVQ, suivez vos techniciens — le tout en français, à partir de 39 $/mois.',
    },
    painPoints: [
      "Les appels d'urgence interrompent sans arrêt vos autres interventions et la coordination devient un casse-tête",
      'Les factures papier se perdent, tardent à être envoyées, et les clients oublient de payer',
      "La TPS et la TVQ doivent être calculées manuellement sur chaque facture — une erreur peut coûter cher avec Revenu Québec",
      "Le suivi des garanties, des pièces remplacées et des réparations antérieures est un cauchemar sans système centralisé",
      "Les clients veulent réserver en ligne mais vous n'avez pas de plateforme adaptée — vous perdez des contrats au profit de la concurrence",
      "Votre licence RBQ exige une documentation rigoureuse, mais tout est encore dans des classeurs ou des feuilles Excel",
    ],
    features: [
      { title: 'Répartition rapide des appels', description: "Assignez un appel de service à un technicien en quelques secondes depuis votre téléphone. Le technicien reçoit l'adresse, le type de problème et l'historique client instantanément — fini les appels de confirmation." },
      { title: 'Facturation sur place avec TPS/TVQ', description: 'Convertissez une intervention en facture avec les taxes québécoises correctement calculées. Acceptez le paiement par carte via Stripe directement dans la camionnette. Le client reçoit son reçu par courriel.' },
      { title: 'Historique client complet', description: "Chaque appartement, chaque maison, chaque bâtiment commercial: tout l'historique des interventions, pièces remplacées et garanties en un clin d'oeil. Vos techniciens arrivent préparés." },
      { title: "Réservation en ligne 24/7", description: 'Vos clients réservent un créneau sur votre portail Gestivio. Les urgences vous appellent; les rendez-vous planifiés se réservent tout seuls, même à 22h le samedi soir.' },
      { title: "IA qui répond à votre place", description: "Un assistant IA bilingue filtre les questions fréquentes: prix approximatif, zones desservies, disponibilités. Vous ne répondez qu'aux vrais prospects, et le reste se traite automatiquement." },
      { title: "Documentation conforme à la RBQ", description: "Conservez un registre numérique de chaque intervention, pièce et garantie. Quand vient le temps d'un audit ou d'une réclamation, tout est là, organisé et accessible." },
    ],
    faqs: [
      { question: 'Gestivio gère-t-il la TPS et la TVQ automatiquement ?', answer: 'Oui. Entrez votre numéro de TPS et de TVQ une seule fois dans les paramètres. Les taxes sont ensuite calculées et appliquées automatiquement sur chaque facture, conformément aux règles de Revenu Québec.' },
      { question: 'Combien coûte Gestivio pour une petite entreprise de plomberie ?', answer: "Le plan Démarrage est à 39 $ CAD par mois pour un utilisateur. Le plan Pro à 79 $ inclut jusqu'à 5 utilisateurs. Pas de frais cachés, en dollars canadiens, facturable annuellement pour économiser." },
      { question: "Puis-je utiliser Gestivio sur mon téléphone pendant une intervention ?", answer: "Oui. La plateforme est entièrement responsive. Un technicien peut voir l'adresse, marquer l'intervention comme terminée, prendre des photos, et envoyer la facture au client — le tout depuis son téléphone." },
    ],
    relatedSlugs: ['logiciel-cvc', 'logiciel-renovateur'],
    meta: {
      title: 'Logiciel pour plombiers au Québec | Gestivio',
      description: 'Le logiciel de gestion tout-en-un pour plombiers au Québec. Facturation TPS/TVQ, appels de service, suivi clientèle, conformité RBQ. Essai gratuit 14 jours.',
      targetKeyword: 'logiciel plombier Quebec',
      keywords: ['logiciel plombier', 'plomberie Quebec', 'gestion plombier', 'facturation plomberie', 'application plombier', 'RBQ plombier'],
    },
  },

  {
    slug: 'logiciel-electricien',
    locale: 'fr',
    industry: 'Électriciens',
    hero: {
      kicker: 'Pour les maîtres électriciens du Québec',
      headline: 'Le logiciel de gestion pour électriciens au Québec',
      sub: "Soumissions, interventions, facturation TPS/TVQ et conformité CMEQ — un seul outil bilingue conçu pour les électriciens québécois.",
    },
    painPoints: [
      "Les soumissions pour des projets résidentiels et commerciaux prennent des heures à préparer dans Excel",
      "La CMEQ et le Code de construction exigent une traçabilité rigoureuse que vos carnets ne fournissent pas",
      "Coordonner les interventions entre plusieurs chantiers et électriciens compagnons est un défi quotidien",
      "Les clients appellent pour des urgences (pannes, courts-circuits) et vous perdez le fil des interventions planifiées",
      "Facturer correctement avec TPS/TVQ et garder un suivi des paiements par chantier est un travail à temps plein",
      "Vous devez parfois sous-traiter à d'autres maîtres électriciens et la coordination devient chaotique",
    ],
    features: [
      { title: 'Soumissions professionnelles rapides', description: "Créez des soumissions détaillées avec main-d'oeuvre, matériaux et taxes en quelques minutes. Envoyez par courriel; le client signe électroniquement. Convertissez en facture d'un clic." },
      { title: 'Suivi par chantier et par client', description: "Chaque intervention est rattachée au bon chantier et au bon client. Vous voyez l'historique complet — panneaux installés, filages remplacés, inspections passées — en un coup d'oeil." },
      { title: 'Planification multi-équipe', description: "Assignez les interventions à vos compagnons et apprentis. Chacun voit son calendrier, ses adresses et les détails du travail à effectuer directement sur son téléphone." },
      { title: 'Facturation TPS/TVQ automatique', description: "Les taxes québécoises sont calculées automatiquement. Envoyez la facture par courriel avec un bouton de paiement en ligne. Le client paie par carte, vous recevez l'argent en 2 jours." },
      { title: 'Portail de réservation pour vos clients', description: "Vos clients résidentiels réservent en ligne 24h/24. L'assistant IA collecte les détails du problème électrique et crée automatiquement l'intervention dans votre calendrier." },
      { title: 'Rapports et conformité', description: "Générez des rapports par période, par type d'intervention ou par client. Gardez un registre numérique complet pour répondre aux exigences de la CMEQ et faciliter vos déclarations." },
    ],
    faqs: [
      { question: 'Gestivio est-il adapté aux maîtres électriciens du Québec ?', answer: "Oui. Gestivio gère la TPS/TVQ automatiquement, est entièrement bilingue FR/EN, et vous permet de conserver un registre numérique de toutes vos interventions — utile pour la conformité CMEQ et les inspections." },
      { question: 'Puis-je gérer plusieurs compagnons et apprentis ?', answer: "Oui. Le plan Pro (79 $/mois) inclut jusqu'à 5 utilisateurs. Chaque électricien a son propre compte avec son calendrier et ses interventions assignées. Le plan Croissance supporte les équipes illimitées." },
      { question: 'Mes clients peuvent-ils réserver une intervention en ligne ?', answer: "Oui. Vous activez le portail de réservation IA, partagez le lien sur votre site web ou vos cartes d'affaires, et vos clients réservent directement. L'intervention apparaît dans votre calendrier." },
    ],
    relatedSlugs: ['logiciel-plombier', 'logiciel-renovateur'],
    meta: {
      title: 'Logiciel pour électriciens au Québec | Gestivio',
      description: "Logiciel de gestion pour maîtres électriciens au Québec. Soumissions, interventions, facturation TPS/TVQ et conformité CMEQ. Essai gratuit 14 jours.",
      targetKeyword: 'logiciel electricien Quebec',
      keywords: ['logiciel électricien', 'électricien Québec', 'gestion électricien', 'CMEQ', 'maître électricien logiciel'],
    },
  },

  {
    slug: 'logiciel-cvc',
    locale: 'fr',
    industry: 'CVC / HVAC',
    hero: {
      kicker: 'Pour les entrepreneurs en CVC au Québec',
      headline: 'Le logiciel de gestion pour techniciens CVC et HVAC',
      sub: "Gérez l'entretien préventif, les installations et les urgences. Contrats récurrents, équipement par site, facturation automatisée.",
    },
    painPoints: [
      "Les contrats d'entretien annuels sont difficiles à planifier et à facturer sans système automatisé",
      "Chaque bâtiment a plusieurs unités CVC avec des historiques de service distincts à suivre",
      "Les rappels de remplacement de filtres sont manuels et souvent oubliés, ce qui frustre vos clients",
      "Les pièces en inventaire dans la camionnette ne sont jamais à jour et vous arrivez sans le bon matériel",
      "Les soumissions pour des installations résidentielles et commerciales prennent des heures à préparer",
      "Les normes québécoises en efficacité énergétique ajoutent une couche de documentation supplémentaire",
    ],
    features: [
      { title: "Contrats d'entretien récurrents", description: 'Planifiez automatiquement les visites annuelles ou semestrielles. Gestivio crée les rendez-vous, envoie les rappels aux clients et génère les factures selon les termes de votre contrat.' },
      { title: "Équipement par site", description: "Chaque unité CVC, chaque chaudière, chaque thermopompe est enregistrée avec son emplacement, son historique de service et sa date de garantie. Vos techniciens arrivent informés." },
      { title: "Soumissions rapides", description: "Créez des soumissions détaillées avec pièces, main-d'oeuvre et taxes en moins de 5 minutes. Envoyez-les par courriel; le client les signe en ligne." },
      { title: "Rappels automatiques aux clients", description: "Gestivio envoie automatiquement aux clients des rappels pour l'entretien annuel — 30 jours avant la date prévue, avec un lien de réservation direct." },
      { title: "Facturation après chaque visite", description: "Visite d'entretien terminée ? Une facture est créée automatiquement avec les tarifs prévus au contrat, TPS/TVQ incluses, prête à être envoyée ou payée sur place." },
      { title: "Portail de réservation IA", description: "Vos clients réservent en ligne pour les urgences et les entretiens planifiés. L'assistant IA collecte les détails (type de système, symptômes) avant même l'arrivée du technicien." },
    ],
    faqs: [
      { question: 'Peut-on gérer plusieurs unités CVC pour un même client ?', answer: "Oui. Chaque client peut avoir plusieurs sites, et chaque site peut avoir plusieurs équipements (chaudière, thermopompe, climatiseur, etc.) avec leur propre historique de service." },
      { question: "Comment fonctionnent les contrats d'entretien récurrents ?", answer: "Vous définissez une fois la fréquence (mensuelle, trimestrielle, semestrielle, annuelle), le tarif, et les services inclus. Gestivio génère ensuite automatiquement les rendez-vous et les factures." },
      { question: "Est-ce adapté à une entreprise avec plusieurs techniciens ?", answer: "Oui. Chaque technicien a son propre compte, son calendrier, et accès à son propre planning. Le répartiteur peut assigner les appels en temps réel." },
    ],
    relatedSlugs: ['logiciel-plombier', 'logiciel-electricien'],
    meta: {
      title: 'Logiciel pour techniciens CVC au Québec | Gestivio',
      description: "Gestion de contrats d'entretien, équipement par site, soumissions rapides. Le logiciel HVAC fait pour les entrepreneurs québécois. Essai gratuit 14 jours.",
      targetKeyword: 'logiciel HVAC Quebec',
      keywords: ['logiciel HVAC', 'CVC Quebec', 'entretien climatisation', 'gestion CVC', 'logiciel climatisation', 'thermopompe'],
    },
  },

  {
    slug: 'logiciel-nettoyage',
    locale: 'fr',
    industry: 'Entreprises de nettoyage',
    hero: {
      kicker: 'Pour les entreprises de nettoyage au Québec',
      headline: 'Le logiciel de gestion pour entreprises de nettoyage au Québec',
      sub: "Planifiez vos équipes, gérez les contrats récurrents de ménage commercial et résidentiel, facturez avec TPS/TVQ — le tout en français.",
    },
    painPoints: [
      "Coordonner les horaires de plusieurs équipes de nettoyage sur différents sites est un casse-tête quotidien",
      "Les contrats de ménage récurrents (hebdomadaires, bimensuels) sont difficiles à suivre manuellement",
      "Les clients commerciaux exigent des rapports de service et des preuves de passage que vous ne pouvez pas fournir",
      "Le roulement d'employés est élevé et la formation des nouveaux est constamment à refaire",
      "Facturer les bons montants avec TPS/TVQ pour des dizaines de contrats différents prend un temps fou",
      "Les clients résidentiels veulent réserver en ligne mais vous gérez encore tout par téléphone et texto",
    ],
    features: [
      { title: 'Planification récurrente automatique', description: "Configurez les visites récurrentes une seule fois. Gestivio génère automatiquement les rendez-vous chaque semaine ou chaque mois, assigne l'équipe disponible, et envoie les confirmations." },
      { title: 'Suivi par site et check-list', description: "Chaque site a ses propres instructions de nettoyage. Vos employés voient la check-list sur leur téléphone, cochent chaque tâche et prennent des photos comme preuve de passage." },
      { title: 'Facturation automatique des contrats', description: "Les contrats récurrents sont facturés automatiquement selon la fréquence choisie. TPS/TVQ calculées, facture envoyée par courriel, paiement en ligne disponible." },
      { title: 'Portail client professionnel', description: "Vos clients commerciaux et résidentiels réservent en ligne, consultent l'historique de leurs passages et paient leurs factures — sans vous appeler." },
      { title: "Gestion d'équipe simplifiée", description: "Invitez vos employés, assignez-les à des sites, suivez les heures travaillées. Quand un employé quitte, réassignez ses contrats en quelques clics." },
      { title: 'Rapports pour clients commerciaux', description: "Générez des rapports de service professionnels pour vos clients d'immeuble, de bureau ou de copropriété. Preuves de passage, photos et fréquences." },
    ],
    faqs: [
      { question: 'Gestivio convient-il pour le nettoyage commercial et résidentiel ?', answer: "Oui. Gestivio gère les deux types de contrats. Les contrats commerciaux récurrents sont automatisés, et les clients résidentiels peuvent réserver en ligne via le portail IA." },
      { question: 'Puis-je créer des check-lists personnalisées par site ?', answer: "Oui. Chaque site peut avoir ses propres instructions et sa check-list. Vos employés les voient sur leur téléphone et cochent chaque tâche complétée, avec possibilité d'ajouter des photos." },
      { question: 'Comment gérer le roulement de personnel ?', answer: "Quand un employé quitte, vous désactivez son compte et réassignez ses contrats à un autre membre de l'équipe en quelques clics. L'historique de service reste intact." },
    ],
    relatedSlugs: ['logiciel-paysagiste', 'logiciel-renovateur'],
    meta: {
      title: 'Logiciel pour entreprises de nettoyage au Québec | Gestivio',
      description: "Logiciel de gestion pour entreprises de nettoyage au Québec. Contrats récurrents, planification d'équipe, facturation TPS/TVQ. Essai gratuit 14 jours.",
      targetKeyword: 'logiciel nettoyage Quebec',
      keywords: ['logiciel nettoyage', 'entreprise ménage Québec', 'gestion nettoyage commercial', 'logiciel ménage', 'nettoyage commercial logiciel'],
    },
  },

  {
    slug: 'logiciel-paysagiste',
    locale: 'fr',
    industry: 'Paysagistes',
    hero: {
      kicker: 'Pour les paysagistes et entrepreneurs en entretien paysager',
      headline: 'Le logiciel de gestion pour paysagistes au Québec',
      sub: "Gérez vos contrats saisonniers, vos équipes terrain et votre facturation. Du déneigement hivernal à l'aménagement estival, tout est centralisé.",
    },
    painPoints: [
      "La saisonnalité du métier rend la planification complexe — du déneigement en hiver à la tonte en été, les contrats changent constamment",
      "Coordonner plusieurs équipes sur différents territoires avec des routes optimales est un défi quotidien",
      "Les soumissions pour des projets d'aménagement paysager nécessitent beaucoup de détails et de temps",
      "Facturer des dizaines de contrats de tonte résidentielle chaque mois avec TPS/TVQ est fastidieux",
      "Les clients veulent des photos avant/après de leur terrain et vous n'avez pas de système pour les archiver",
      "Le suivi des heures travaillées par employé et par contrat est approximatif sans outil dédié",
    ],
    features: [
      { title: 'Contrats saisonniers automatisés', description: "Configurez des contrats qui changent selon la saison. Tonte de mai à octobre, déneigement de novembre à avril. Gestivio ajuste les rendez-vous et la facturation automatiquement." },
      { title: 'Routes et planification par secteur', description: "Regroupez vos clients par quartier ou municipalité. Optimisez les déplacements de vos équipes et réduisez le temps perdu sur la route entre les chantiers." },
      { title: 'Soumissions avec photos', description: "Prenez des photos du terrain, ajoutez les détails du projet et envoyez une soumission professionnelle par courriel. Le client la signe en ligne et vous commencez les travaux." },
      { title: 'Facturation récurrente TPS/TVQ', description: "Les contrats de tonte, d'entretien et de déneigement sont facturés automatiquement chaque mois. Taxes québécoises incluses, paiement en ligne disponible." },
      { title: "Photos avant/après", description: "Vos employés prennent des photos du terrain avant et après chaque visite. Archivées dans le dossier client, elles servent de preuve de service et de suivi qualité." },
      { title: "Suivi des heures et de la rentabilité", description: "Suivez les heures travaillées par employé et par contrat. Identifiez les contrats les plus rentables et ajustez vos prix pour la saison suivante." },
    ],
    faqs: [
      { question: 'Gestivio gère-t-il les contrats de déneigement ?', answer: "Oui. Vous pouvez créer des contrats saisonniers qui incluent le déneigement hivernal. La facturation s'ajuste automatiquement selon la saison et la fréquence des visites." },
      { question: 'Puis-je gérer plusieurs équipes de terrain ?', answer: "Oui. Chaque équipe a son propre calendrier et ses propres routes. Le répartiteur assigne les contrats et suit l'avancement en temps réel depuis le tableau de bord." },
      { question: 'Mes clients peuvent-ils demander une soumission en ligne ?', answer: "Oui. Via le portail de réservation IA, vos clients décrivent leur besoin (aménagement, tonte, déneigement) et l'assistant crée automatiquement une demande de soumission dans votre système." },
    ],
    relatedSlugs: ['logiciel-nettoyage', 'logiciel-renovateur'],
    meta: {
      title: 'Logiciel pour paysagistes au Québec | Gestivio',
      description: "Logiciel de gestion pour paysagistes au Québec. Contrats saisonniers, planification d'équipe, facturation TPS/TVQ, photos terrain. Essai gratuit 14 jours.",
      targetKeyword: 'logiciel paysagiste Quebec',
      keywords: ['logiciel paysagiste', 'paysagiste Québec', 'gestion paysagement', 'logiciel déneigement', 'logiciel tonte', 'entretien paysager logiciel'],
    },
  },

  {
    slug: 'logiciel-renovateur',
    locale: 'fr',
    industry: 'Rénovateurs',
    hero: {
      kicker: 'Pour les entrepreneurs en rénovation au Québec',
      headline: 'Le logiciel de gestion pour entrepreneurs en rénovation au Québec',
      sub: "Soumissions détaillées, suivi de chantier, facturation progressive avec TPS/TVQ et conformité RBQ. Tout ce dont un rénovateur québécois a besoin.",
    },
    painPoints: [
      "Les projets de rénovation impliquent de multiples étapes, sous-traitants et matériaux — le suivi sans logiciel est chaotique",
      "Préparer des soumissions détaillées pour des projets de cuisine, salle de bain ou sous-sol prend des heures",
      "La facturation progressive (par étape) avec TPS/TVQ est complexe à gérer manuellement",
      "Les exigences de la RBQ en matière de contrats et de garanties nécessitent une documentation rigoureuse",
      "Les clients veulent des mises à jour régulières sur l'avancement de leur projet, mais vous n'avez pas le temps de les appeler",
      "Gérer les changements de commande (extras) en cours de projet et ajuster la facturation est un casse-tête",
    ],
    features: [
      { title: 'Soumissions détaillées par étape', description: "Créez des soumissions avec des sections pour chaque phase du projet: démolition, structure, électricité, plomberie, finition. Chaque section a ses coûts de main-d'oeuvre et matériaux." },
      { title: 'Facturation progressive', description: "Facturez votre client à chaque étape du projet: 30 % au démarrage, 30 % à la mi-projet, 40 % à la fin. TPS/TVQ calculées automatiquement sur chaque facture partielle." },
      { title: 'Suivi de chantier avec photos', description: "Documentez l'avancement de chaque chantier avec des photos horodatées. Le client peut consulter les mises à jour en ligne, ce qui réduit les appels et les malentendus." },
      { title: 'Gestion des extras', description: "Le client demande un changement en cours de projet ? Créez un ordre de modification avec le nouveau prix, faites-le approuver en ligne, et la facturation s'ajuste automatiquement." },
      { title: 'Conformité RBQ et Garantie GCR', description: "Conservez un registre numérique de chaque contrat, chaque paiement et chaque garantie. Quand la RBQ ou la GCR vous demande des documents, tout est accessible en quelques clics." },
      { title: 'Portail client pour les mises à jour', description: "Vos clients suivent l'avancement de leur rénovation en ligne. Photos, étapes complétées, prochaines étapes — tout est visible sans que vous ayez à envoyer des courriels." },
    ],
    faqs: [
      { question: 'Gestivio est-il adapté aux entrepreneurs généraux en rénovation ?', answer: "Oui. Gestivio gère les projets multi-étapes, la facturation progressive, les ordres de modification et la documentation RBQ. Que vous fassiez des cuisines, des salles de bain ou des sous-sols, l'outil s'adapte." },
      { question: 'Comment fonctionne la facturation progressive ?', answer: "Vous définissez les étapes de paiement dans votre soumission (ex: 30-30-40). À chaque étape complétée, Gestivio génère la facture partielle avec TPS/TVQ et l'envoie au client avec un lien de paiement." },
      { question: 'Puis-je utiliser Gestivio pour la documentation RBQ ?', answer: "Oui. Tous les contrats, factures, photos de chantier et communications sont archivés numériquement. Vous pouvez exporter les documents nécessaires pour répondre aux exigences de la RBQ et de la Garantie GCR." },
    ],
    relatedSlugs: ['logiciel-plombier', 'logiciel-electricien'],
    meta: {
      title: 'Logiciel pour entrepreneurs en rénovation au Québec | Gestivio',
      description: "Logiciel de gestion pour rénovateurs au Québec. Soumissions, facturation progressive TPS/TVQ, suivi de chantier, conformité RBQ. Essai gratuit 14 jours.",
      targetKeyword: 'logiciel renovation Quebec',
      keywords: ['logiciel rénovation', 'rénovateur Québec', 'entrepreneur rénovation', 'logiciel RBQ', 'gestion chantier rénovation', 'facturation progressive'],
    },
  },
]

export function getIndustry(slug: string): IndustryPage | undefined {
  return INDUSTRIES.find((i) => i.slug === slug)
}
