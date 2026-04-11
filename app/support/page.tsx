import Link from 'next/link'
import type { Metadata } from 'next'
import { Wrench, BookOpen, MessageCircle, Mail, ChevronDown, Zap, Users, FileText, CreditCard, Settings, Briefcase } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Support Center — Gestivio',
  description: 'Get help with Gestivio. Browse FAQs, documentation, and contact our support team.',
}

const faqs = [
  {
    category: 'Getting Started',
    icon: Zap,
    questions: [
      { q: 'How do I start my free trial?', a: 'Simply click "Get started" on our homepage, create your account with your email address, and you\'ll be automatically enrolled in the 14-day free trial. No credit card required.' },
      { q: 'How do I import my existing customers?', a: 'Go to Customers → click the Export CSV button to see the format, then prepare your data in that format. Currently you can add customers manually or through the AI assistant. CSV import is coming in Q3 2025.' },
      { q: 'Can I try Gestivio before signing up?', a: 'Yes! Visit /book on our website to try the AI booking portal in demo mode. For the full platform, sign up for the free 14-day trial.' },
    ],
  },
  {
    category: 'Jobs & Scheduling',
    icon: Briefcase,
    questions: [
      { q: 'How do I create a new job?', a: 'Go to Jobs and click the "New Job" button, or use the AI assistant and say "Create a job for [customer name]". Fill in the service type, date, and assign it to a team member.' },
      { q: 'Can customers book appointments themselves?', a: 'Yes! Share your booking portal link (/book?biz=YOUR_ID) with customers, or embed it on your website. The AI booking assistant handles the entire scheduling conversation.' },
      { q: 'Can I set recurring jobs?', a: 'Recurring jobs are on our roadmap for Q2 2025. Currently you can duplicate jobs from the job detail page.' },
    ],
  },
  {
    category: 'Invoices & Payments',
    icon: CreditCard,
    questions: [
      { q: 'How do I accept online payments?', a: 'Connect your Stripe account in Settings → Billing. Once connected, every invoice will have a "Pay Now" button that sends customers to a secure Stripe checkout page.' },
      { q: 'What currency does Gestivio support?', a: 'Currently Gestivio processes payments in Canadian dollars (CAD). Multi-currency support is planned for 2025.' },
      { q: 'Can I send invoice reminders automatically?', a: 'Manual invoice sending with reminder emails is available now. Automated reminder sequences are on our roadmap.' },
    ],
  },
  {
    category: 'Team Management',
    icon: Users,
    questions: [
      { q: 'How do I invite team members?', a: 'Go to Team → click "Invite member" and enter their email address. They\'ll receive an invitation to join your Gestivio account.' },
      { q: 'Can I control what team members can see?', a: 'Role-based access control is on our roadmap. Currently all team members on a paid plan can access all features.' },
    ],
  },
  {
    category: 'Billing & Account',
    icon: Settings,
    questions: [
      { q: 'How do I upgrade or downgrade my plan?', a: 'Go to Settings → Billing → click "Manage subscription". You can change plans, update payment methods, and view billing history.' },
      { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel at any time from Settings → Billing. Your account will remain active until the end of your billing period.' },
      { q: 'Do you offer discounts for annual billing?', a: 'Yes! Annual plans save you 20% compared to monthly billing. Switch in Settings → Billing.' },
    ],
  },
]

export default function SupportPage() {
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
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign in</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-indigo-50/40 to-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">How can we help?</h1>
          <p className="text-gray-500">Browse our FAQ or reach out to our support team.</p>
        </div>
      </section>

      {/* Quick links */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: BookOpen, title: 'Documentation', description: 'Step-by-step guides for every feature', href: '#faq', label: 'Browse docs' },
              { icon: MessageCircle, title: 'Live Chat', description: 'Chat with our AI assistant anytime', href: '/dashboard', label: 'Open chat' },
              { icon: Mail, title: 'Email Support', description: 'We respond within one business day', href: '/contact', label: 'Send email' },
            ].map((item) => (
              <a key={item.title} href={item.href}
                className="rounded-2xl border border-gray-100 bg-white p-6 hover:border-indigo-200 hover:shadow-sm transition-all group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 mb-4 group-hover:bg-indigo-100 transition-colors">
                  <item.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{item.description}</p>
                <span className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-800">{item.label} →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-12 pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {faqs.map((category) => (
              <div key={category.category}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50">
                    <category.icon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{category.category}</h3>
                </div>
                <div className="space-y-3">
                  {category.questions.map((faq) => (
                    <details key={faq.q} className="rounded-xl border border-gray-100 bg-white group">
                      <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-gray-900 list-none">
                        {faq.q}
                        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="px-5 pb-4">
                        <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still need help */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Still need help?</h2>
          <p className="text-gray-500 mb-6">Our support team is available Monday–Friday, 9am–5pm EST.</p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            <Mail className="h-4 w-4" /> Contact support
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. Made with ❤️ in Québec, Canada 🍁</p>
      </footer>
    </div>
  )
}
