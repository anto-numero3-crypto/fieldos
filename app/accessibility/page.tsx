'use client'

import Link from 'next/link'
import { CheckCircle, Clock } from 'lucide-react'
import GestivioLogo from '@/components/GestivioLogo'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function AccessibilityPage() {
  const { lang } = useLanguage()

  const conformance = lang === 'fr' ? [
    'Ratios de contraste de couleur suffisants pour tout le texte (4,5:1 minimum)',
    'Navigation au clavier prise en charge dans toute l\'application',
    'Indicateurs de focus pour les éléments interactifs',
    'Structure HTML sémantique avec hiérarchie de titres appropriée',
    'Texte alternatif pour toutes les images significatives',
    'Étiquettes de formulaire correctement associées aux champs',
    'Messages d\'erreur clairement associés aux champs du formulaire',
    'Design adaptatif fonctionnant à 200 % de zoom',
    'Aucun contenu clignotant susceptible de provoquer des crises',
    'Attribut de langue défini sur toutes les pages',
  ] : [
    'Sufficient color contrast ratios for all text (4.5:1 minimum)',
    'Keyboard navigation support throughout the application',
    'Focus indicators for interactive elements',
    'Semantic HTML structure with appropriate heading hierarchy',
    'Alt text for all meaningful images',
    'Form labels properly associated with inputs',
    'Error messages clearly associated with form fields',
    'Responsive design that works at 200% zoom',
    'No flashing content that could trigger seizures',
    'Language attribute set on all pages',
  ]

  const limitations = lang === 'fr' ? [
    'Certains composants de graphiques complexes (recharts) peuvent avoir un support limité des lecteurs d\'écran',
    'L\'interface de planification glisser-déposer peut ne pas être entièrement accessible au clavier',
    'La fonction d\'exportation PDF ne produit pas de PDF balisés',
  ] : [
    'Some complex chart components (recharts) may have limited screen reader support',
    'Drag-and-drop scheduling interface may not be fully keyboard accessible',
    'PDF export feature does not produce tagged PDFs',
  ]

  const technical = lang === 'fr' ? [
    'Construit avec Next.js et React, en suivant les meilleures pratiques HTML sémantique',
    'Les composants interactifs suivent les pratiques de création WAI-ARIA',
    'Les modales piègent le focus et le renvoient à l\'élément déclencheur à la fermeture',
    'Tous les boutons et liens ont des noms accessibles',
    'Les mises à jour de contenu dynamiques sont annoncées aux lecteurs d\'écran via les régions ARIA live',
  ] : [
    'Built with Next.js and React, following semantic HTML best practices',
    'Interactive components follow the WAI-ARIA Authoring Practices',
    'Modals trap focus and return focus to trigger element on close',
    'All buttons and links have accessible names',
    'Dynamic content updates are announced to screen readers via ARIA live regions',
  ]

  return (
    <div className="min-h-screen bg-white">
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <LanguageToggle />
      </div>

      <nav className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <GestivioLogo />
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">
          {lang === 'fr' ? 'Accessibilité' : 'Accessibility'}
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {lang === 'fr' ? 'Déclaration d\'accessibilité' : 'Accessibility Statement'}
        </h1>
        <p className="text-sm text-gray-400 mb-12">
          {lang === 'fr' ? 'Dernière révision : 1 avril 2026' : 'Last reviewed: April 1, 2026'}
        </p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? 'Notre engagement' : 'Our Commitment'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Gestivio Inc. s\'engage à rendre notre plateforme accessible à tous les utilisateurs, y compris ceux en situation de handicap. Nous travaillons à la conformité avec les Règles pour l\'accessibilité des contenus Web (WCAG) 2.1 niveau AA, ainsi qu\'avec les normes canadiennes d\'accessibilité applicables.'
                : 'Gestivio Inc. is committed to making our platform accessible to all users, including those with disabilities. We are working toward conformance with the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA, as well as compliance with applicable Canadian accessibility standards.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? 'Statut de conformité actuel' : 'Current Conformance Status'}
            </h2>
            <p className="mb-4">
              {lang === 'fr'
                ? 'Nous sommes partiellement conformes aux WCAG 2.1 AA. Les critères suivants sont actuellement remplis :'
                : 'We are partially conformant with WCAG 2.1 AA. The following criteria are currently met:'}
            </p>
            <div className="space-y-2">
              {conformance.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? 'Limites connues' : 'Known Limitations'}
            </h2>
            <p className="mb-4">
              {lang === 'fr'
                ? 'Nous travaillons activement à corriger les problèmes d\'accessibilité connus suivants :'
                : 'We are actively working to address the following known accessibility issues:'}
            </p>
            <div className="space-y-2">
              {limitations.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? 'Accessibilité bilingue' : 'Bilingual Accessibility'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Gestivio est entièrement bilingue en anglais et en français, avec tout le contenu traduit professionnellement. Les préférences de langue sont mémorisées entre les sessions. Les lecteurs d\'écran annonceront correctement la langue du document lors du changement.'
                : 'Gestivio is fully bilingual in English and French, with all content professionally translated. Language preferences are remembered across sessions. Screen readers will correctly announce the document language when switched.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? 'Approche technique' : 'Technical Approach'}
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              {technical.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? 'Commentaires et contact' : 'Feedback and Contact'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Si vous rencontrez des obstacles d\'accessibilité lors de l\'utilisation de Gestivio, ou si vous avez besoin d\'informations dans un format alternatif, veuillez nous contacter :'
                : 'If you encounter accessibility barriers while using Gestivio, or if you need information in an alternative format, please contact us:'}
            </p>
            <div className="mt-3 rounded-xl bg-gray-50 p-4">
              <p><strong>{lang === 'fr' ? 'Coordonnateur de l\'accessibilité, Gestivio Inc.' : 'Accessibility Coordinator, Gestivio Inc.'}</strong></p>
              <p>{lang === 'fr' ? 'Courriel : ' : 'Email: '}accessibility@gestivio.ca</p>
              <p className="text-xs text-gray-500 mt-1">
                {lang === 'fr' ? 'Nous visons à répondre dans les 5 jours ouvrables.' : 'We aim to respond within 5 business days.'}
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? 'Plaintes formelles' : 'Formal Complaints'}
            </h2>
            <p>
              {lang === 'fr'
                ? <>Si vous n&apos;êtes pas satisfait de notre réponse à votre préoccupation d&apos;accessibilité, vous pouvez contacter la <strong>Commission canadienne des droits de la personne</strong> à chrc-ccdp.gc.ca ou la commission provinciale des droits de la personne pertinente.</>
                : <>If you are not satisfied with our response to your accessibility concern, you may contact the <strong>Canadian Human Rights Commission</strong> at chrc-ccdp.gc.ca or relevant provincial human rights commission.</>}
            </p>
          </section>
        </div>
      </div>
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. <Link href="/" className="hover:text-gray-600">{lang === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}</Link></p>
      </footer>
    </div>
  )
}
