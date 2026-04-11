import Link from 'next/link'
import type { Metadata } from 'next'
import { Wrench, CheckCircle, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Accessibility — Gestivio',
  description: 'Gestivio accessibility statement and WCAG 2.1 AA compliance commitment.',
}

export default function AccessibilityPage() {
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
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">Accessibility</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Accessibility Statement</h1>
        <p className="text-sm text-gray-400 mb-12">Last reviewed: April 11, 2025</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Our Commitment</h2>
            <p>Gestivio Inc. is committed to making our platform accessible to all users, including those with disabilities. We are working toward conformance with the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA, as well as compliance with applicable Canadian accessibility standards.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Current Conformance Status</h2>
            <p className="mb-4">We are partially conformant with WCAG 2.1 AA. The following criteria are currently met:</p>
            <div className="space-y-2">
              {[
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
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Known Limitations</h2>
            <p className="mb-4">We are actively working to address the following known accessibility issues:</p>
            <div className="space-y-2">
              {[
                'Some complex chart components (recharts) may have limited screen reader support',
                'Drag-and-drop scheduling interface may not be fully keyboard accessible',
                'PDF export feature does not produce tagged PDFs',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Bilingual Accessibility</h2>
            <p>Gestivio is fully bilingual in English and French, with all content professionally translated. Language preferences are remembered across sessions. Screen readers will correctly announce the document language when switched.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Technical Approach</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Built with Next.js and React, following semantic HTML best practices</li>
              <li>Interactive components follow the WAI-ARIA Authoring Practices</li>
              <li>Modals trap focus and return focus to trigger element on close</li>
              <li>All buttons and links have accessible names</li>
              <li>Dynamic content updates are announced to screen readers via ARIA live regions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Feedback and Contact</h2>
            <p>If you encounter accessibility barriers while using Gestivio, or if you need information in an alternative format, please contact us:</p>
            <div className="mt-3 rounded-xl bg-gray-50 p-4">
              <p><strong>Accessibility Coordinator, Gestivio Inc.</strong></p>
              <p>Email: accessibility@gestivio.ca</p>
              <p className="text-xs text-gray-500 mt-1">We aim to respond within 5 business days.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Formal Complaints</h2>
            <p>If you are not satisfied with our response to your accessibility concern, you may contact the <strong>Canadian Human Rights Commission</strong> at chrc-ccdp.gc.ca or relevant provincial human rights commission.</p>
          </section>
        </div>
      </div>
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. <Link href="/" className="hover:text-gray-600">Back to home</Link></p>
      </footer>
    </div>
  )
}
