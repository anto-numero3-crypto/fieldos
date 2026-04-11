import Link from 'next/link'
import type { Metadata } from 'next'
import { Wrench } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service — Gestivio',
  description: 'Terms of Service governing your use of Gestivio field service management platform.',
}

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-12">Last updated: {lastUpdated}</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Gestivio (&quot;the Service&quot;) operated by Gestivio Inc. (&quot;Company&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. These terms constitute a legally binding agreement between you and Gestivio Inc., governed by the laws of the Province of Québec and the laws of Canada applicable therein.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Description of Service</h2>
            <p>Gestivio is a cloud-based field service management platform that provides tools for managing customers, jobs, invoices, scheduling, team management, and business analytics. The Service is intended for use by field service businesses and their employees.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Account Registration</h2>
            <p>You must register for an account to use the Service. You agree to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your password and account credentials</li>
              <li>Notify us immediately of any unauthorized account access</li>
              <li>Be responsible for all activity that occurs under your account</li>
              <li>Not share your account credentials with others</li>
            </ul>
            <p className="mt-3">Accounts are for individuals and businesses, not for resale. You must be at least 18 years of age to create an account.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Subscription and Payments</h2>
            <p>Gestivio offers paid subscription plans. By selecting a paid plan, you agree to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Pay all fees associated with your selected plan</li>
              <li>Provide valid payment information via our payment processor (Stripe)</li>
              <li>Automatic renewal of your subscription at the end of each billing period unless cancelled</li>
            </ul>
            <p className="mt-3">All fees are in Canadian dollars (CAD) and exclude applicable taxes (GST/QST). You are responsible for all applicable taxes.</p>
            <p className="mt-3"><strong>Refunds:</strong> We offer a 14-day free trial. After the trial, subscription payments are non-refundable except as required by applicable law. If you believe a charge was made in error, contact billing@gestivio.ca within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe any intellectual property rights</li>
              <li>Transmit spam, unsolicited communications, or malware</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Impersonate any person or entity</li>
              <li>Collect or harvest data about other users</li>
              <li>Use the Service for any purpose other than managing your legitimate field service business</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Data Ownership</h2>
            <p>You retain ownership of all data you input into the Service (&quot;Customer Data&quot;). You grant Gestivio a limited license to use, store, and process Customer Data solely to provide the Service. We will not use your Customer Data for any other purpose without your consent.</p>
            <p className="mt-3">Upon account termination, you may export your data. We will retain backups for 30 days after account closure, then delete your data.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Intellectual Property</h2>
            <p>Gestivio and its licensors own all right, title, and interest in the Service, including all software, designs, content, and trademarks. These Terms do not grant you any rights to our intellectual property except as expressly stated.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Service Availability</h2>
            <p>We strive for high availability but cannot guarantee uninterrupted service. We may suspend or terminate the Service for maintenance, security, or other business reasons. We are not liable for any losses arising from service interruptions.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, GESTIVIO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.</p>
            <p className="mt-3">OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Indemnification</h2>
            <p>You agree to indemnify and hold Gestivio harmless from any claims, damages, or expenses arising from your use of the Service, your violation of these Terms, or your violation of any third-party rights.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">11. Termination</h2>
            <p>Either party may terminate this agreement at any time. You may cancel your subscription from within the platform. We may terminate your access for violation of these Terms, with notice where reasonably practicable.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">12. Governing Law and Disputes</h2>
            <p>These Terms are governed by the laws of Québec and Canada. Any disputes shall be resolved in the courts of Québec, Canada. You waive any objection to the exclusive jurisdiction of these courts.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">13. Changes to Terms</h2>
            <p>We may update these Terms periodically. Material changes will be communicated via email at least 30 days before taking effect. Continued use after the effective date constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">14. Contact</h2>
            <div className="rounded-xl bg-gray-50 p-4 space-y-1">
              <p><strong>Gestivio Inc.</strong></p>
              <p>Email: legal@gestivio.ca</p>
              <p>Address: Québec, Canada</p>
            </div>
          </section>
        </div>
      </div>
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. <Link href="/" className="hover:text-gray-600">Back to home</Link></p>
      </footer>
    </div>
  )
}
