import Link from 'next/link'
import type { Metadata } from 'next'
import { Wrench } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy — Gestivio',
  description: 'How Gestivio collects, uses, and protects your personal information in compliance with PIPEDA.',
}

export default function PrivacyPage() {
  const lastUpdated = 'April 11, 2025'
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
              <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-gray-900">Gestivio</span>
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">Legal</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-12">Last updated: {lastUpdated}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Introduction</h2>
            <p>Gestivio Inc. (&quot;Gestivio&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our platform at gestivio.ca and related services.</p>
            <p className="mt-3">We comply with the <strong>Personal Information Protection and Electronic Documents Act (PIPEDA)</strong>, Canada&apos;s federal private sector privacy law, as well as applicable provincial privacy laws including Québec&apos;s <strong>Law 25 (Act Respecting the Protection of Personal Information in the Private Sector)</strong>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="font-semibold text-gray-800 mb-2">2.1 Information you provide directly:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account registration information: name, email address, password</li>
              <li>Business information: company name, address, phone number, service types</li>
              <li>Customer data you enter: names, emails, addresses, service history</li>
              <li>Financial information: invoice amounts, payment records (we do not store credit card numbers — payments are processed by Stripe)</li>
              <li>Communications you send through our platform</li>
            </ul>
            <p className="font-semibold text-gray-800 mb-2 mt-4">2.2 Information collected automatically:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Log data: IP addresses, browser type, pages visited, timestamps</li>
              <li>Device information: device type, operating system</li>
              <li>Usage data: features used, clicks, session duration</li>
              <li>Cookies and similar tracking technologies (see our Cookie Policy)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide, operate, and improve our services</li>
              <li>Process transactions and send billing communications</li>
              <li>Provide customer support</li>
              <li>Send service updates, security alerts, and administrative messages</li>
              <li>Send marketing communications (only with your explicit consent)</li>
              <li>Comply with legal obligations</li>
              <li>Analyze usage patterns to improve our platform</li>
              <li>Power AI features including our business intelligence and booking assistant</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. AI and Data Processing</h2>
            <p>Gestivio uses artificial intelligence features powered by Anthropic&apos;s Claude API. When you use AI features, your business data (job descriptions, customer names, invoice summaries) may be processed by these AI systems to generate responses. We do not use your data to train AI models. AI processing is subject to Anthropic&apos;s privacy policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Sharing Your Information</h2>
            <p>We do not sell your personal information. We share information only with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Service providers:</strong> Supabase (database hosting), Stripe (payments), Resend (email delivery), Anthropic (AI), Vercel (hosting)</li>
              <li><strong>Legal requirements:</strong> When required by law, court order, or governmental authority</li>
              <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets, with notice to you</li>
            </ul>
            <p className="mt-3">All third-party service providers are contractually required to maintain appropriate data protection standards.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Data Storage and Security</h2>
            <p>Your data is stored on Supabase infrastructure, hosted on AWS in Canada or the United States. We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>TLS/SSL encryption for all data in transit</li>
              <li>AES-256 encryption for data at rest</li>
              <li>Row-level security ensuring users can only access their own data</li>
              <li>Regular automated backups</li>
              <li>Access controls and authentication requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Data Retention</h2>
            <p>We retain your personal information for as long as your account is active or as needed to provide services. Upon account deletion, we delete your data within 30 days, except where retention is required by law (e.g., tax records may be retained for 7 years as required by the Canada Revenue Agency).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Your Rights Under PIPEDA</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Withdrawal of consent:</strong> Withdraw consent for optional processing at any time</li>
              <li><strong>Complaint:</strong> Lodge a complaint with the Office of the Privacy Commissioner of Canada</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at <strong>privacy@gestivio.ca</strong>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Cookies</h2>
            <p>We use essential cookies for authentication and session management, and optional analytics cookies to improve our service. See our <Link href="/cookies" className="text-indigo-600 hover:underline">Cookie Policy</Link> for details.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Children&apos;s Privacy</h2>
            <p>Gestivio is not directed at individuals under 18 years of age. We do not knowingly collect personal information from children.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. Material changes will be communicated via email or prominent notice on our platform at least 30 days before taking effect.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">12. Contact Us</h2>
            <p>For privacy-related questions or to exercise your rights:</p>
            <div className="mt-3 rounded-xl bg-gray-50 p-4 space-y-1">
              <p><strong>Privacy Officer, Gestivio Inc.</strong></p>
              <p>Email: privacy@gestivio.ca</p>
              <p>Address: Québec, Canada</p>
            </div>
            <p className="mt-3">If you are not satisfied with our response, you may contact the <strong>Office of the Privacy Commissioner of Canada</strong> at priv.gc.ca.</p>
          </section>
        </div>
      </div>
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. <Link href="/" className="hover:text-gray-600">Back to home</Link></p>
      </footer>
    </div>
  )
}
