import Link from 'next/link'
import type { Metadata } from 'next'
import { Wrench, Target, Heart, Zap, Users, Globe, ArrowRight, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us — Gestivio',
  description: 'Learn about Gestivio — the team behind the smarter way to run your field service business.',
}

const values = [
  { icon: Target, title: 'Customer-first', description: 'Every feature we build starts with one question: does this make our customers more successful? We listen obsessively and ship what matters.' },
  { icon: Zap, title: 'Move fast', description: 'We believe in shipping fast, learning from real feedback, and iterating. Perfect is the enemy of shipped — we prefer useful.' },
  { icon: Heart, title: 'Built with care', description: 'Gestivio is crafted with pride in Québec, Canada. We care deeply about quality, reliability, and the trust our customers place in us.' },
  { icon: Globe, title: 'Bilingual by default', description: 'Canada deserves software that works in both official languages. Gestivio is built French-first, not French as an afterthought.' },
]

const team = [
  { name: 'Antoine Garant', role: 'Founder & CEO', initials: 'AG', color: 'bg-indigo-100 text-indigo-700' },
  { name: 'Engineering Team', role: 'Product & Engineering', initials: 'ET', color: 'bg-violet-100 text-violet-700' },
  { name: 'Design Team', role: 'UX & Design', initials: 'DT', color: 'bg-pink-100 text-pink-700' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
              <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-gray-900">Gestivio</span>
          </Link>
          <Link href="/login" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
            Get started <ArrowRight className="inline h-3.5 w-3.5 ml-1" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-indigo-50/40 to-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-4">Our Story</p>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl leading-tight">
            Built by field service operators,<br />for field service operators
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Gestivio was born out of frustration. Too many great tradespeople and service businesses were drowning in paperwork, chasing invoices, and losing track of jobs — while their enterprise software was built for someone else.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-12 sm:px-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
            <p className="text-lg text-indigo-100 leading-relaxed max-w-2xl mx-auto">
              To give every field service business — no matter how small — access to enterprise-grade tools that make them more efficient, more professional, and more profitable.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How it started</h2>
          <div className="space-y-5 text-gray-600 leading-relaxed">
            <p>
              In 2024, our founder Antoine was helping run a family HVAC business in Québec. The business was growing — but managing it was a nightmare. Invoices were hand-written, jobs were tracked in a notebook, and customer follow-ups happened only when someone remembered.
            </p>
            <p>
              The software options available were either too complex, too expensive, or simply not built for Canadian businesses. Most were in English only. All required months of onboarding.
            </p>
            <p>
              So we built Gestivio. A platform that works the way field service businesses actually operate — fast, mobile, bilingual, and powered by AI to handle the things that eat up your day.
            </p>
            <p>
              Today, Gestivio serves hundreds of businesses across Canada, helping them manage thousands of jobs, send professional invoices, and grow their revenue — all from one simple platform.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What we believe in</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 mb-4">
                  <v.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">The team</h2>
            <p className="mt-3 text-gray-500">A small, focused team based in Québec, Canada.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {team.map((member) => (
              <div key={member.name} className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${member.color}`}>
                  {member.initials}
                </div>
                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Our journey</h2>
          <div className="space-y-6">
            {[
              { year: '2024', event: 'Gestivio founded in Québec, Canada' },
              { year: '2024', event: 'First 50 customers onboarded across 3 provinces' },
              { year: '2025', event: 'AI assistant launched — first Canadian FSM with native AI' },
              { year: '2025', event: 'Full French/English bilingual support launched' },
              { year: '2025', event: '500+ businesses, $42M+ in revenue managed on platform' },
            ].map((m, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="shrink-0 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">{m.year}</span>
                <div className="flex items-center gap-2 pt-1">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <p className="text-sm text-gray-700">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to join us?</h2>
          <p className="text-gray-500 mb-8">Start your free 14-day trial. No credit card required.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white hover:bg-indigo-700 transition-colors">
              Start free trial
            </Link>
            <Link href="/contact" className="rounded-xl border border-gray-200 px-8 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. Made with ❤️ in Québec, Canada 🍁</p>
      </footer>
    </div>
  )
}
