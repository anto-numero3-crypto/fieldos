'use client'

import Link from 'next/link'
import { Shield, Lock, Database, Eye, RefreshCw, CheckCircle, Clock } from 'lucide-react'
import GestivioLogo from '@/components/GestivioLogo'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function SecurityPage() {
  const { lang } = useLanguage()

  const practices = [
    {
      icon: Lock,
      title: lang === 'fr' ? 'Chiffrement en transit' : 'Encryption in transit',
      description: lang === 'fr'
        ? 'Toutes les données transmises entre votre appareil et nos serveurs sont chiffrées avec TLS 1.3. Nous imposons HTTPS sur tous les points de terminaison.'
        : 'All data transmitted between your device and our servers is encrypted with TLS 1.3. We enforce HTTPS across all endpoints.',
    },
    {
      icon: Database,
      title: lang === 'fr' ? 'Chiffrement au repos' : 'Encryption at rest',
      description: lang === 'fr'
        ? 'Toutes les données stockées sur nos serveurs sont chiffrées avec AES-256. Les identifiants de base de données, clés API et secrets ne sont jamais stockés en clair.'
        : 'All data stored on our servers is encrypted with AES-256. Database credentials, API keys, and secrets are never stored in plaintext.',
    },
    {
      icon: Shield,
      title: lang === 'fr' ? 'Sécurité au niveau des rangées' : 'Row-level security',
      description: lang === 'fr'
        ? 'Notre base de données impose la sécurité au niveau des rangées (RLS), s\'assurant que chaque utilisateur ne peut accéder qu\'à ses propres données — même en cas de bogue applicatif.'
        : 'Our database enforces row-level security (RLS) ensuring each user can only access their own data — even in the event of an application bug.',
    },
    {
      icon: Eye,
      title: lang === 'fr' ? 'Contrôles d\'accès' : 'Access controls',
      description: lang === 'fr'
        ? 'Nous suivons le principe du moindre privilège. Seuls les ingénieurs ayant un besoin démontré peuvent accéder aux systèmes de production, et tous les accès sont journalisés.'
        : 'We follow the principle of least privilege. Only engineers with a demonstrated need can access production systems, and all access is logged.',
    },
    {
      icon: RefreshCw,
      title: lang === 'fr' ? 'Sauvegardes automatisées' : 'Automated backups',
      description: lang === 'fr'
        ? 'Vos données sont automatiquement sauvegardées chaque heure. Nous conservons les sauvegardes quotidiennes pendant 30 jours et mensuelles pendant 1 an.'
        : 'Your data is automatically backed up every hour. We retain daily backups for 30 days and monthly backups for 1 year.',
    },
    {
      icon: CheckCircle,
      title: lang === 'fr' ? 'Analyse des dépendances' : 'Dependency scanning',
      description: lang === 'fr'
        ? 'Nous utilisons des outils automatisés pour analyser notre base de code à la recherche de vulnérabilités dans les dépendances et les mettons à jour régulièrement.'
        : 'We use automated tools to scan our codebase for vulnerabilities in dependencies and update them on a regular cadence.',
    },
  ]

  const authPoints = lang === 'fr' ? [
    'Les mots de passe sont hachés avec bcrypt (minimum 10 rondes)',
    'Les jetons de session sont cryptographiquement aléatoires et expirent automatiquement',
    'Vérification par courriel requise pour les nouveaux comptes',
    'Authentification à deux facteurs (2FA) disponible via TOTP et SMS',
    'Connexion sociale via OAuth 2.0 (Google) disponible',
    'Limitation de débit sur tous les points d\'authentification pour prévenir les attaques par force brute',
  ] : [
    'Passwords are hashed using bcrypt with a minimum 10 rounds',
    'Session tokens are cryptographically random and expire automatically',
    'Email verification required for new accounts',
    'Two-factor authentication (2FA) available via TOTP and SMS',
    'Social login via OAuth 2.0 (Google) available',
    'Rate limiting on all authentication endpoints to prevent brute-force attacks',
  ]

  const compliance = [
    { status: 'done', item: lang === 'fr' ? 'Conformité LPRPDE (loi canadienne sur la vie privée)' : 'PIPEDA compliance (Canadian privacy law)' },
    { status: 'done', item: lang === 'fr' ? 'Conformité Loi 25 du Québec' : 'Québec Law 25 compliance' },
    { status: 'done', item: lang === 'fr' ? 'TLS/HTTPS partout' : 'TLS/HTTPS everywhere' },
    { status: 'done', item: lang === 'fr' ? 'Ententes de traitement avec tous les sous-traitants' : 'Data processing agreements with all sub-processors' },
    { status: 'done', item: lang === 'fr' ? 'Audit SOC 2 Type I complété (janvier 2026)' : 'SOC 2 Type I audit completed (January 2026)' },
    { status: 'planned', item: lang === 'fr' ? 'Certification SOC 2 Type II (prévue T4 2026)' : 'SOC 2 Type II certification (planned Q4 2026)' },
    { status: 'planned', item: lang === 'fr' ? 'Certification ISO 27001 (prévue 2027)' : 'ISO 27001 certification (planned 2027)' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <LanguageToggle />
      </div>

      <nav className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <GestivioLogo />
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">
          {lang === 'fr' ? 'Confiance et sécurité' : 'Trust & Safety'}
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {lang === 'fr' ? 'Sécurité chez Gestivio' : 'Security at Gestivio'}
        </h1>
        <p className="text-lg text-gray-500 mb-12">
          {lang === 'fr'
            ? 'Nous prenons la sécurité au sérieux. Vos données d\'entreprise sont protégées par plusieurs couches de contrôles de sécurité, et nous investissons continuellement pour les garder en sécurité.'
            : 'We take security seriously. Your business data is protected by multiple layers of security controls, and we continuously invest in keeping it safe.'}
        </p>

        <div className="grid gap-5 sm:grid-cols-2 mb-16">
          {practices.map((p) => (
            <div key={p.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 mb-4">
                <p.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {lang === 'fr' ? 'Infrastructure' : 'Infrastructure'}
          </h2>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 space-y-4 text-sm text-gray-700">
            <p>
              <strong>{lang === 'fr' ? 'Hébergement : ' : 'Hosting: '}</strong>
              {lang === 'fr'
                ? 'Gestivio fonctionne sur le réseau edge mondial de Vercel avec des serveurs en Amérique du Nord et dans le monde. Le code applicatif est déployé sur une infrastructure sans serveur avec mise à l\'échelle automatique.'
                : 'Gestivio runs on Vercel\'s global edge network with servers in North America and around the world. Application code is deployed on serverless infrastructure with automatic scaling.'}
            </p>
            <p>
              <strong>{lang === 'fr' ? 'Base de données : ' : 'Database: '}</strong>
              {lang === 'fr'
                ? 'Vos données sont stockées sur Supabase, une plateforme de base de données PostgreSQL construite sur AWS. Supabase offre basculement automatique, récupération à un instant précis et redondance géographique.'
                : 'Your data is stored on Supabase, a PostgreSQL-based database platform built on AWS. Supabase provides automatic failover, point-in-time recovery, and geographic redundancy.'}
            </p>
            <p>
              <strong>{lang === 'fr' ? 'Paiements : ' : 'Payments: '}</strong>
              {lang === 'fr'
                ? 'Tout le traitement des paiements est géré par Stripe, un processeur certifié PCI-DSS niveau 1. Nous ne stockons jamais les numéros de carte de crédit ni les identifiants de paiement sur nos serveurs.'
                : 'All payment processing is handled by Stripe, a PCI-DSS Level 1 certified payment processor. We never store credit card numbers or payment credentials on our servers.'}
            </p>
            <p>
              <strong>{lang === 'fr' ? 'Livraison de courriels : ' : 'Email delivery: '}</strong>
              {lang === 'fr'
                ? 'Les courriels transactionnels sont envoyés via Resend, qui exploite son infrastructure sur AWS avec une haute délivrabilité et l\'authentification SPF/DKIM.'
                : 'Transactional emails are sent via Resend, which operates its infrastructure on AWS with high deliverability and SPF/DKIM authentication.'}
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {lang === 'fr' ? 'Authentification' : 'Authentication'}
          </h2>
          <ul className="space-y-3 text-sm text-gray-700">
            {authPoints.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {lang === 'fr' ? 'Feuille de route de conformité' : 'Compliance Roadmap'}
          </h2>
          <div className="space-y-3">
            {compliance.map((item) => (
              <div key={item.item} className="flex items-center gap-3">
                {item.status === 'done'
                  ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  : <Clock className="h-4 w-4 text-amber-500 shrink-0" />}
                <span className="text-sm text-gray-700">{item.item}</span>
                {item.status === 'planned' && (
                  <span className="ml-auto text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                    {lang === 'fr' ? 'Prévu' : 'Planned'}
                  </span>
                )}
                {item.status === 'done' && (
                  <span className="ml-auto text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                    {lang === 'fr' ? 'Terminé' : 'Complete'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-indigo-50 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {lang === 'fr' ? 'Divulgation responsable' : 'Responsible Disclosure'}
          </h2>
          <p className="text-sm text-gray-700 mb-3">
            {lang === 'fr'
              ? 'Si vous découvrez une vulnérabilité de sécurité dans Gestivio, veuillez la signaler de manière responsable. Nous enquêterons rapidement sur tous les rapports et reconnaîtrons publiquement les découvertes valides.'
              : 'If you discover a security vulnerability in Gestivio, please report it responsibly. We will investigate all reports promptly and publicly acknowledge valid discoveries.'}
          </p>
          <p className="text-sm text-gray-700">
            {lang === 'fr' ? 'Contact : ' : 'Contact: '}<strong>security@gestivio.ca</strong>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {lang === 'fr'
              ? 'Veuillez ne pas divulguer publiquement les vulnérabilités avant que nous ayons eu la chance d\'y remédier. Nous visons à répondre à tous les rapports de sécurité dans les 48 heures.'
              : 'Please do not publicly disclose vulnerabilities before we have had a chance to address them. We aim to respond to all security reports within 48 hours.'}
          </p>
        </div>
      </div>
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. <Link href="/" className="hover:text-gray-600">{lang === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}</Link></p>
      </footer>
    </div>
  )
}
