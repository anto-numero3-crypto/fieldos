import Link from 'next/link'
import type { Metadata } from 'next'
import { Wrench } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cookie Policy — Gestivio',
  description: 'How Gestivio uses cookies and similar tracking technologies.',
}

const cookieTypes = [
  {
    category: 'Essential Cookies',
    required: true,
    description: 'These cookies are strictly necessary for the website to function. They cannot be disabled.',
    cookies: [
      { name: 'sb-*', provider: 'Supabase', purpose: 'Authentication session token — keeps you logged in', duration: 'Session / 1 year' },
      { name: '__vercel_*', provider: 'Vercel', purpose: 'Infrastructure routing and edge caching', duration: 'Session' },
    ],
  },
  {
    category: 'Performance Cookies',
    required: false,
    description: 'These cookies help us understand how visitors use our platform so we can improve it. All data is anonymized.',
    cookies: [
      { name: '_ga, _gid', provider: 'Google Analytics (planned)', purpose: 'Page views and session analytics', duration: '2 years / 1 day' },
    ],
  },
  {
    category: 'Preference Cookies',
    required: false,
    description: 'These cookies remember your preferences across sessions.',
    cookies: [
      { name: 'gestivio_lang', provider: 'Gestivio', purpose: 'Remembers your language preference (EN/FR)', duration: '1 year' },
      { name: 'gestivio_theme', provider: 'Gestivio', purpose: 'Remembers dark/light mode preference', duration: '1 year' },
    ],
  },
]

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
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
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">Legal</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
        <p className="text-sm text-gray-400 mb-12">Last updated: April 11, 2025</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">What are cookies?</h2>
            <p>Cookies are small text files placed on your device when you visit a website. They allow the website to remember information about your visit, such as your preferences and login status, to make your next visit easier and more useful.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">How we use cookies</h2>
            <p>Gestivio uses cookies to provide a secure and personalized experience. We use the minimum number of cookies necessary to operate the platform effectively.</p>
          </section>

          {cookieTypes.map((type) => (
            <section key={type.category}>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-gray-900">{type.category}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${type.required ? 'bg-gray-100 text-gray-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {type.required ? 'Always active' : 'Optional'}
                </span>
              </div>
              <p className="mb-4">{type.description}</p>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Cookie', 'Provider', 'Purpose', 'Duration'].map((h) => (
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
            <h2 className="text-lg font-bold text-gray-900 mb-3">Managing cookies</h2>
            <p>You can control and delete cookies through your browser settings. Note that disabling essential cookies will prevent you from logging in to Gestivio. Each browser has different settings — refer to your browser&apos;s help documentation for instructions.</p>
            <p className="mt-3">Most modern browsers allow you to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>See what cookies are set and delete them</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies (this will break our service)</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Changes to this policy</h2>
            <p>We may update this Cookie Policy when we change the cookies we use. We will notify you of material changes via our platform or by email.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Contact</h2>
            <p>Questions about our use of cookies? Contact us at <strong>privacy@gestivio.ca</strong>.</p>
          </section>
        </div>
      </div>
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. <Link href="/" className="hover:text-gray-600">Back to home</Link></p>
      </footer>
    </div>
  )
}
