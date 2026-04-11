import Link from 'next/link'
import type { Metadata } from 'next'
import { Wrench, Sparkles, Zap, Shield, Wrench as Fix, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Changelog — Gestivio',
  description: 'See what\'s new in Gestivio — product updates, new features, and improvements.',
}

const releases = [
  {
    version: 'v2.0.0',
    date: 'April 11, 2025',
    tag: 'Major Release',
    tagColor: 'bg-violet-100 text-violet-700',
    items: [
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
    date: 'March 28, 2025',
    tag: 'Feature Update',
    tagColor: 'bg-blue-100 text-blue-700',
    items: [
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
    date: 'March 15, 2025',
    tag: 'AI Update',
    tagColor: 'bg-violet-100 text-violet-700',
    items: [
      { type: 'new', text: 'Floating AI chat assistant available on every page' },
      { type: 'new', text: 'AI booking portal at /book — customers can schedule appointments via chat' },
      { type: 'new', text: 'Command palette (⌘K) for fast navigation' },
      { type: 'new', text: 'Real-time notifications with badge counts' },
      { type: 'improve', text: 'AI assistant now context-aware of current page' },
    ],
  },
  {
    version: 'v1.3.0',
    date: 'February 28, 2025',
    tag: 'Finance Update',
    tagColor: 'bg-emerald-100 text-emerald-700',
    items: [
      { type: 'new', text: 'Stripe subscription billing integration' },
      { type: 'new', text: 'Invoice creation with automatic numbering' },
      { type: 'new', text: 'Invoice status tracking: unpaid, paid, overdue' },
      { type: 'new', text: 'Email invoice to customers via Resend' },
      { type: 'new', text: 'Reports page with revenue trends, AR aging, and top customers' },
    ],
  },
  {
    version: 'v1.2.0',
    date: 'February 14, 2025',
    tag: 'Operations',
    tagColor: 'bg-amber-100 text-amber-700',
    items: [
      { type: 'new', text: 'Jobs management with full lifecycle tracking' },
      { type: 'new', text: 'Schedule page with calendar view' },
      { type: 'new', text: 'Team management — invite and manage technicians' },
      { type: 'new', text: 'Quotes module for pre-job estimates' },
      { type: 'new', text: 'Customer profiles with job and invoice history' },
    ],
  },
  {
    version: 'v1.0.0',
    date: 'January 15, 2025',
    tag: 'Launch',
    tagColor: 'bg-indigo-100 text-indigo-700',
    items: [
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
  new:     { icon: Sparkles, label: 'New',     color: 'text-violet-600 bg-violet-50' },
  improve: { icon: Zap,      label: 'Improve', color: 'text-blue-600 bg-blue-50' },
  fix:     { icon: Fix,      label: 'Fix',     color: 'text-emerald-600 bg-emerald-50' },
  security: { icon: Shield,  label: 'Security', color: 'text-red-600 bg-red-50' },
}

export default function ChangelogPage() {
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
          <Link href="/login" className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">Product Updates</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Changelog</h1>
        <p className="text-lg text-gray-500 mb-12">What&apos;s new in Gestivio. We ship fast and keep you updated.</p>

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
        <p>© {new Date().getFullYear()} Gestivio. Made with ❤️ in Québec, Canada 🍁</p>
      </footer>
    </div>
  )
}
