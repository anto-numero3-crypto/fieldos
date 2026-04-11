import Link from 'next/link'
import type { Metadata } from 'next'
import { Wrench, Shield, Lock, Database, Eye, RefreshCw, CheckCircle, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Security — Gestivio',
  description: 'How Gestivio protects your business data with enterprise-grade security practices.',
}

const practices = [
  { icon: Lock, title: 'Encryption in transit', description: 'All data transmitted between your device and our servers is encrypted with TLS 1.3. We enforce HTTPS across all endpoints.' },
  { icon: Database, title: 'Encryption at rest', description: 'All data stored on our servers is encrypted with AES-256. Database credentials, API keys, and secrets are never stored in plaintext.' },
  { icon: Shield, title: 'Row-level security', description: 'Our database enforces row-level security (RLS) ensuring each user can only access their own data — even in the event of an application bug.' },
  { icon: Eye, title: 'Access controls', description: 'We follow the principle of least privilege. Only engineers with a demonstrated need can access production systems, and all access is logged.' },
  { icon: RefreshCw, title: 'Automated backups', description: 'Your data is automatically backed up every hour. We retain daily backups for 30 days and monthly backups for 1 year.' },
  { icon: CheckCircle, title: 'Dependency scanning', description: 'We use automated tools to scan our codebase for vulnerabilities in dependencies and update them on a regular cadence.' },
]

export default function SecurityPage() {
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
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">Trust & Safety</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Security at Gestivio</h1>
        <p className="text-lg text-gray-500 mb-12">We take security seriously. Your business data is protected by multiple layers of security controls, and we continuously invest in keeping it safe.</p>

        {/* Security practices */}
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

        {/* Infrastructure */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Infrastructure</h2>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 space-y-4 text-sm text-gray-700">
            <p><strong>Hosting:</strong> Gestivio runs on Vercel&apos;s global edge network with servers in North America and around the world. Application code is deployed on serverless infrastructure with automatic scaling.</p>
            <p><strong>Database:</strong> Your data is stored on Supabase, a PostgreSQL-based database platform built on AWS. Supabase provides automatic failover, point-in-time recovery, and geographic redundancy.</p>
            <p><strong>Payments:</strong> All payment processing is handled by Stripe, a PCI-DSS Level 1 certified payment processor. We never store credit card numbers or payment credentials on our servers.</p>
            <p><strong>Email delivery:</strong> Transactional emails are sent via Resend, which operates its infrastructure on AWS with high deliverability and SPF/DKIM authentication.</p>
          </div>
        </div>

        {/* Authentication */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h2>
          <ul className="space-y-3 text-sm text-gray-700">
            {[
              'Passwords are hashed using bcrypt with a minimum 10 rounds',
              'Session tokens are cryptographically random and expire automatically',
              'Email verification required for new accounts',
              'Two-factor authentication (2FA) coming in Q3 2025',
              'Social login via OAuth 2.0 (Google) available',
              'Rate limiting on all authentication endpoints to prevent brute-force attacks',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Compliance roadmap */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Compliance Roadmap</h2>
          <div className="space-y-3">
            {[
              { status: 'done', item: 'PIPEDA compliance (Canadian privacy law)' },
              { status: 'done', item: 'Québec Law 25 compliance' },
              { status: 'done', item: 'TLS/HTTPS everywhere' },
              { status: 'done', item: 'Data processing agreements with all sub-processors' },
              { status: 'planned', item: 'SOC 2 Type I audit (planned Q4 2025)' },
              { status: 'planned', item: 'SOC 2 Type II certification (planned 2026)' },
              { status: 'planned', item: 'ISO 27001 certification (planned 2026)' },
            ].map((item) => (
              <div key={item.item} className="flex items-center gap-3">
                {item.status === 'done'
                  ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  : <Clock className="h-4 w-4 text-amber-500 shrink-0" />}
                <span className="text-sm text-gray-700">{item.item}</span>
                {item.status === 'planned' && <span className="ml-auto text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">Planned</span>}
                {item.status === 'done' && <span className="ml-auto text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">Complete</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Vulnerability disclosure */}
        <div className="rounded-2xl border border-gray-100 bg-indigo-50 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Responsible Disclosure</h2>
          <p className="text-sm text-gray-700 mb-3">If you discover a security vulnerability in Gestivio, please report it responsibly. We will investigate all reports promptly and publicly acknowledge valid discoveries.</p>
          <p className="text-sm text-gray-700">Contact: <strong>security@gestivio.ca</strong></p>
          <p className="text-xs text-gray-500 mt-2">Please do not publicly disclose vulnerabilities before we have had a chance to address them. We aim to respond to all security reports within 48 hours.</p>
        </div>
      </div>
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. <Link href="/" className="hover:text-gray-600">Back to home</Link></p>
      </footer>
    </div>
  )
}
