'use client'

import Link from 'next/link'
import { Wrench, Sparkles, Zap, Shield, Wrench as Fix, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function ChangelogPage() {
  const { lang } = useLanguage()

  const releases = [
    {
      version: 'v2.0.0',
      date: lang === 'fr' ? '11 avril 2025' : 'April 11, 2025',
      tag: lang === 'fr' ? 'Version majeure' : 'Major Release',
      tagColor: 'bg-violet-100 text-violet-700',
      items: lang === 'fr' ? [
        { type: 'new', text: 'Tableau de bord d\'intelligence d\'affaires IA avec sommaires hebdomadaires, recommandations de revenus et prédictions d\'attrition' },
        { type: 'new', text: 'Campagnes de réengagement client — créez, personnalisez et envoyez des courriels à des segments de clients ciblés' },
        { type: 'new', text: 'Générateur de messages de campagne alimenté par l\'IA — décrivez ce que vous voulez et l\'IA rédige le courriel parfait' },
        { type: 'new', text: 'Pied de page complet avec pages : À propos, Contact, Confidentialité, Conditions, Sécurité, Accessibilité, Témoins, Support, Journal' },
        { type: 'new', text: 'Support de domaine personnalisé — gestivio.ca est en ligne' },
        { type: 'improve', text: 'Tableau de bord analytique mis à niveau avec graphiques d\'entonnoir, tendances d\'acquisition et analyse de vieillissement des factures' },
        { type: 'improve', text: 'Barre latérale mise à jour avec page Insights et lien Campagnes' },
        { type: 'fix', text: 'Correction du lien du portail de réservation sur la page d\'accueil' },
        { type: 'fix', text: 'Toutes les pages juridiques maintenant accessibles depuis le pied de page' },
      ] : [
        { type: 'new', text: 'AI Business Intelligence dashboard with weekly summaries, revenue recommendations, and churn predictions' },
        { type: 'new', text: 'Customer Re-engagement Campaigns — build, personalize, and send email campaigns to targeted customer segments' },
        { type: 'new', text: 'AI-powered campaign message generator — describe what you want and AI writes the perfect email' },
        { type: 'new', text: 'Complete footer with company pages: About, Contact, Privacy, Terms, Security, Accessibility, Cookies, Support, Changelog' },
        { type: 'new', text: 'Custom domain support — gestivio.ca is live' },
        { type: 'improve', text: 'Analytics dashboard upgraded with funnel charts, customer acquisition trends, and invoice aging analysis' },
        { type: 'improve', text: 'Sidebar updated with Insights page and Campaigns link' },
        { type: 'fix', text: 'Fixed booking portal link on landing page' },
        { type: 'fix', text: 'All legal pages now accessible from footer' },
      ],
    },
    {
      version: 'v1.5.0',
      date: lang === 'fr' ? '28 mars 2025' : 'March 28, 2025',
      tag: lang === 'fr' ? 'Mise à jour de fonctionnalités' : 'Feature Update',
      tagColor: 'bg-blue-100 text-blue-700',
      items: lang === 'fr' ? [
        { type: 'new', text: 'Support bilingue complet EN/FR — chaque page, chaque bouton, chaque message' },
        { type: 'new', text: 'Sélecteur de langue dans la barre latérale et le menu mobile' },
        { type: 'new', text: 'Paiement de factures Stripe — les clients peuvent payer les factures en ligne avec un bouton Payer maintenant' },
        { type: 'new', text: 'Exportation CSV de la liste des clients' },
        { type: 'improve', text: 'Refonte professionnelle de l\'interface avec Tailwind CSS — système de design indigo partout' },
        { type: 'improve', text: 'Support du mode sombre sur toutes les pages' },
        { type: 'fix', text: 'Correction de la compatibilité de version de l\'API Stripe' },
      ] : [
        { type: 'new', text: 'Full EN/FR bilingual support — every page, every button, every message' },
        { type: 'new', text: 'Language switcher in sidebar and mobile menu' },
        { type: 'new', text: 'Stripe invoice payment — customers can pay invoices online with a Pay Now button' },
        { type: 'new', text: 'CSV export for customers list' },
        { type: 'improve', text: 'Professional UI overhaul with Tailwind CSS — indigo design system throughout' },
        { type: 'improve', text: 'Dark mode support on all pages' },
        { type: 'fix', text: 'Fixed Stripe API version compatibility' },
      ],
    },
    {
      version: 'v1.4.0',
      date: lang === 'fr' ? '15 mars 2025' : 'March 15, 2025',
      tag: lang === 'fr' ? 'Mise à jour IA' : 'AI Update',
      tagColor: 'bg-violet-100 text-violet-700',
      items: lang === 'fr' ? [
        { type: 'new', text: 'Assistant IA flottant disponible sur chaque page' },
        { type: 'new', text: 'Portail de réservation IA à /book — les clients peuvent prendre rendez-vous via clavardage' },
        { type: 'new', text: 'Palette de commandes (⌘K) pour une navigation rapide' },
        { type: 'new', text: 'Notifications en temps réel avec compteurs de badge' },
        { type: 'improve', text: 'L\'assistant IA est maintenant conscient du contexte de la page actuelle' },
      ] : [
        { type: 'new', text: 'Floating AI chat assistant available on every page' },
        { type: 'new', text: 'AI booking portal at /book — customers can schedule appointments via chat' },
        { type: 'new', text: 'Command palette (⌘K) for fast navigation' },
        { type: 'new', text: 'Real-time notifications with badge counts' },
        { type: 'improve', text: 'AI assistant now context-aware of current page' },
      ],
    },
    {
      version: 'v1.3.0',
      date: lang === 'fr' ? '28 février 2025' : 'February 28, 2025',
      tag: lang === 'fr' ? 'Mise à jour finances' : 'Finance Update',
      tagColor: 'bg-emerald-100 text-emerald-700',
      items: lang === 'fr' ? [
        { type: 'new', text: 'Intégration de facturation d\'abonnement Stripe' },
        { type: 'new', text: 'Création de factures avec numérotation automatique' },
        { type: 'new', text: 'Suivi du statut des factures : impayée, payée, en retard' },
        { type: 'new', text: 'Envoi de factures par courriel aux clients via Resend' },
        { type: 'new', text: 'Page Rapports avec tendances de revenus, vieillissement des créances et meilleurs clients' },
      ] : [
        { type: 'new', text: 'Stripe subscription billing integration' },
        { type: 'new', text: 'Invoice creation with automatic numbering' },
        { type: 'new', text: 'Invoice status tracking: unpaid, paid, overdue' },
        { type: 'new', text: 'Email invoice to customers via Resend' },
        { type: 'new', text: 'Reports page with revenue trends, AR aging, and top customers' },
      ],
    },
    {
      version: 'v1.2.0',
      date: lang === 'fr' ? '14 février 2025' : 'February 14, 2025',
      tag: lang === 'fr' ? 'Opérations' : 'Operations',
      tagColor: 'bg-amber-100 text-amber-700',
      items: lang === 'fr' ? [
        { type: 'new', text: 'Gestion des contrats avec suivi complet du cycle de vie' },
        { type: 'new', text: 'Page Horaire avec vue calendrier' },
        { type: 'new', text: 'Gestion d\'équipe — invitez et gérez les techniciens' },
        { type: 'new', text: 'Module de soumissions pour estimations préalables aux contrats' },
        { type: 'new', text: 'Profils clients avec historique des contrats et des factures' },
      ] : [
        { type: 'new', text: 'Jobs management with full lifecycle tracking' },
        { type: 'new', text: 'Schedule page with calendar view' },
        { type: 'new', text: 'Team management — invite and manage technicians' },
        { type: 'new', text: 'Quotes module for pre-job estimates' },
        { type: 'new', text: 'Customer profiles with job and invoice history' },
      ],
    },
    {
      version: 'v1.0.0',
      date: lang === 'fr' ? '15 janvier 2025' : 'January 15, 2025',
      tag: lang === 'fr' ? 'Lancement' : 'Launch',
      tagColor: 'bg-indigo-100 text-indigo-700',
      items: lang === 'fr' ? [
        { type: 'new', text: 'Gestivio est lancé publiquement 🎉' },
        { type: 'new', text: 'Gestion des clients — ajouter, modifier, rechercher, filtrer' },
        { type: 'new', text: 'Tableau de bord avec cartes KPI et graphiques de revenus' },
        { type: 'new', text: 'Authentification Supabase avec courriel/mot de passe' },
        { type: 'new', text: 'Design adaptatif mobile' },
        { type: 'new', text: 'Hébergement des données au Canada' },
      ] : [
        { type: 'new', text: 'Gestivio launches publicly 🎉' },
        { type: 'new', text: 'Customer management — add, edit, search, filter' },
        { type: 'new', text: 'Dashboard with KPI cards and revenue charts' },
        { type: 'new', text: 'Supabase authentication with email/password' },
        { type: 'new', text: 'Mobile-responsive design' },
        { type: 'new', text: 'Canadian data residency' },
      ],
    },
  ]

  const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
    new:      { icon: Sparkles, label: lang === 'fr' ? 'Nouveau' : 'New',        color: 'text-violet-600 bg-violet-50' },
    improve:  { icon: Zap,      label: lang === 'fr' ? 'Amélioré' : 'Improve',   color: 'text-blue-600 bg-blue-50' },
    fix:      { icon: Fix,      label: lang === 'fr' ? 'Correction' : 'Fix',     color: 'text-emerald-600 bg-emerald-50' },
    security: { icon: Shield,   label: lang === 'fr' ? 'Sécurité' : 'Security',  color: 'text-red-600 bg-red-50' },
  }

  return (
    <div className="min-h-screen bg-white">
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <LanguageToggle />
      </div>

      <nav className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
              <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-gray-900">Gestivio</span>
          </Link>
          <Link href="/login" className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            {lang === 'fr' ? 'Commencer' : 'Get started'} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">
          {lang === 'fr' ? 'Mises à jour produit' : 'Product Updates'}
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          {lang === 'fr' ? 'Journal des modifications' : 'Changelog'}
        </h1>
        <p className="text-lg text-gray-500 mb-12">
          {lang === 'fr'
            ? 'Quoi de neuf dans Gestivio. Nous livrons vite et vous tenons informés.'
            : 'What\'s new in Gestivio. We ship fast and keep you updated.'}
        </p>

        <div className="space-y-12">
          {releases.map((release) => (
            <div key={release.version} className="relative pl-8 border-l-2 border-gray-100">
              <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-indigo-500" />
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900">{release.version}</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${release.tagColor}`}>{release.tag}</span>
                <span className="text-sm text-gray-400 ml-auto">{release.date}</span>
              </div>
              <ul className="space-y-2.5">
                {release.items.map((item, i) => {
                  const config = typeConfig[item.type] || typeConfig.new
                  return (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${config.color}`}>
                        <config.icon className="h-2.5 w-2.5" />
                        {config.label}
                      </span>
                      <span className="text-sm text-gray-700 leading-relaxed">{item.text}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. {lang === 'fr' ? 'Fait avec ❤️ au Québec, Canada 🍁' : 'Made with ❤️ in Québec, Canada 🍁'}</p>
      </footer>
    </div>
  )
}
