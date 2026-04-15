'use client'

import Link from 'next/link'
import { Wrench } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function CookiesPage() {
  const { lang } = useLanguage()

  const cookieTypes = [
    {
      category: lang === 'fr' ? 'Témoins essentiels' : 'Essential Cookies',
      required: true,
      description: lang === 'fr'
        ? 'Ces témoins sont strictement nécessaires au fonctionnement du site. Ils ne peuvent pas être désactivés.'
        : 'These cookies are strictly necessary for the website to function. They cannot be disabled.',
      cookies: [
        {
          name: 'sb-*',
          provider: 'Supabase',
          purpose: lang === 'fr' ? 'Jeton de session d\'authentification — vous garde connecté' : 'Authentication session token — keeps you logged in',
          duration: lang === 'fr' ? 'Session / 1 an' : 'Session / 1 year',
        },
        {
          name: '__vercel_*',
          provider: 'Vercel',
          purpose: lang === 'fr' ? 'Routage d\'infrastructure et mise en cache edge' : 'Infrastructure routing and edge caching',
          duration: lang === 'fr' ? 'Session' : 'Session',
        },
      ],
    },
    {
      category: lang === 'fr' ? 'Témoins de performance' : 'Performance Cookies',
      required: false,
      description: lang === 'fr'
        ? 'Ces témoins nous aident à comprendre comment les visiteurs utilisent notre plateforme afin de l\'améliorer. Toutes les données sont anonymisées.'
        : 'These cookies help us understand how visitors use our platform so we can improve it. All data is anonymized.',
      cookies: [
        {
          name: '_ga, _gid',
          provider: 'Google Analytics',
          purpose: lang === 'fr' ? 'Analyses de pages vues et de sessions' : 'Page views and session analytics',
          duration: lang === 'fr' ? '2 ans / 1 jour' : '2 years / 1 day',
        },
      ],
    },
    {
      category: lang === 'fr' ? 'Témoins de préférence' : 'Preference Cookies',
      required: false,
      description: lang === 'fr'
        ? 'Ces témoins mémorisent vos préférences entre les sessions.'
        : 'These cookies remember your preferences across sessions.',
      cookies: [
        {
          name: 'gestivio_lang',
          provider: 'Gestivio',
          purpose: lang === 'fr' ? 'Mémorise votre préférence de langue (EN/FR)' : 'Remembers your language preference (EN/FR)',
          duration: lang === 'fr' ? '1 an' : '1 year',
        },
        {
          name: 'gestivio_theme',
          provider: 'Gestivio',
          purpose: lang === 'fr' ? 'Mémorise la préférence de mode sombre/clair' : 'Remembers dark/light mode preference',
          duration: lang === 'fr' ? '1 an' : '1 year',
        },
      ],
    },
  ]

  const headers = lang === 'fr'
    ? ['Témoin', 'Fournisseur', 'But', 'Durée']
    : ['Cookie', 'Provider', 'Purpose', 'Duration']

  return (
    <div className="min-h-screen bg-white">
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <LanguageToggle />
      </div>

      <nav className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
              <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-gray-900">Gestivio</span>
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">
          {lang === 'fr' ? 'Juridique' : 'Legal'}
        </p>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {lang === 'fr' ? 'Politique sur les témoins' : 'Cookie Policy'}
        </h1>
        <p className="text-sm text-gray-400 mb-12">
          {lang === 'fr' ? 'Dernière mise à jour : 1 avril 2026' : 'Last updated: April 1, 2026'}
        </p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? 'Que sont les témoins ?' : 'What are cookies?'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Les témoins sont de petits fichiers texte placés sur votre appareil lorsque vous visitez un site. Ils permettent au site de se souvenir d\'informations sur votre visite, comme vos préférences et votre statut de connexion, pour rendre votre prochaine visite plus facile et plus utile.'
                : 'Cookies are small text files placed on your device when you visit a website. They allow the website to remember information about your visit, such as your preferences and login status, to make your next visit easier and more useful.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? 'Comment nous utilisons les témoins' : 'How we use cookies'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Gestivio utilise des témoins pour fournir une expérience sécurisée et personnalisée. Nous utilisons le minimum de témoins nécessaires pour faire fonctionner la plateforme efficacement.'
                : 'Gestivio uses cookies to provide a secure and personalized experience. We use the minimum number of cookies necessary to operate the platform effectively.'}
            </p>
          </section>

          {cookieTypes.map((type) => (
            <section key={type.category}>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-gray-900">{type.category}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${type.required ? 'bg-gray-100 text-gray-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {type.required
                    ? (lang === 'fr' ? 'Toujours actif' : 'Always active')
                    : (lang === 'fr' ? 'Optionnel' : 'Optional')}
                </span>
              </div>
              <p className="mb-4">{type.description}</p>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {headers.map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {type.cookies.map((cookie) => (
                      <tr key={cookie.name}>
                        <td className="px-4 py-3 text-xs font-mono text-gray-900">{cookie.name}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{cookie.provider}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{cookie.purpose}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{cookie.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? 'Gérer les témoins' : 'Managing cookies'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Vous pouvez contrôler et supprimer les témoins via les paramètres de votre navigateur. Notez que la désactivation des témoins essentiels vous empêchera de vous connecter à Gestivio. Chaque navigateur a des paramètres différents — consultez la documentation d\'aide de votre navigateur pour les instructions.'
                : 'You can control and delete cookies through your browser settings. Note that disabling essential cookies will prevent you from logging in to Gestivio. Each browser has different settings — refer to your browser\'s help documentation for instructions.'}
            </p>
            <p className="mt-3">
              {lang === 'fr' ? 'La plupart des navigateurs modernes vous permettent de :' : 'Most modern browsers allow you to:'}
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              {lang === 'fr' ? (
                <>
                  <li>Voir les témoins définis et les supprimer</li>
                  <li>Bloquer les témoins tiers</li>
                  <li>Bloquer tous les témoins (cela brisera notre service)</li>
                  <li>Supprimer tous les témoins à la fermeture du navigateur</li>
                </>
              ) : (
                <>
                  <li>See what cookies are set and delete them</li>
                  <li>Block third-party cookies</li>
                  <li>Block all cookies (this will break our service)</li>
                  <li>Delete all cookies when you close your browser</li>
                </>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? 'Modifications à cette politique' : 'Changes to this policy'}
            </h2>
            <p>
              {lang === 'fr'
                ? 'Nous pouvons mettre à jour cette politique sur les témoins lorsque nous changeons les témoins que nous utilisons. Nous vous informerons des changements importants via notre plateforme ou par courriel.'
                : 'We may update this Cookie Policy when we change the cookies we use. We will notify you of material changes via our platform or by email.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {lang === 'fr' ? 'Contact' : 'Contact'}
            </h2>
            <p>
              {lang === 'fr'
                ? <>Questions sur notre utilisation des témoins ? Contactez-nous à <strong>privacy@gestivio.ca</strong>.</>
                : <>Questions about our use of cookies? Contact us at <strong>privacy@gestivio.ca</strong>.</>}
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
