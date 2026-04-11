'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Wrench, Mail, MapPin, Phone, Send, CheckCircle, Loader2 } from 'lucide-react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'hello@gestivio.ca',
          subject: `Contact form: ${form.subject}`,
          body: `Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company}\n\nMessage:\n${form.message}`,
        }),
      })
      setSent(true)
    } catch {
      setError('Failed to send message. Please email us directly at hello@gestivio.ca')
    } finally {
      setSending(false)
    }
  }

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

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">Get in touch</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Contact Us</h1>
          <p className="text-lg text-gray-500">We&apos;d love to hear from you. Our team typically responds within one business day.</p>
        </div>

        <div className="grid gap-10 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-10 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Message sent!</h2>
                <p className="text-gray-500 mb-4">Thanks for reaching out. We&apos;ll get back to you within one business day.</p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', company: '', subject: '', message: '' }) }}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email address *</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company name</label>
                  <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Your business name (optional)"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject *</label>
                  <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white">
                    <option value="">Select a topic</option>
                    <option>General inquiry</option>
                    <option>Sales / Pricing</option>
                    <option>Technical support</option>
                    <option>Billing question</option>
                    <option>Feature request</option>
                    <option>Partnership</option>
                    <option>Press / Media</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message *</label>
                  <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us how we can help..."
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={sending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Contact information</h3>
              {[
                { icon: Mail, label: 'Email', value: 'hello@gestivio.ca', href: 'mailto:hello@gestivio.ca' },
                { icon: Phone, label: 'Phone', value: 'Coming soon', href: null },
                { icon: MapPin, label: 'Location', value: 'Québec, Canada', href: null },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 shrink-0">
                    <item.icon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    {item.href
                      ? <a href={item.href} className="text-sm font-medium text-gray-900 hover:text-indigo-600">{item.value}</a>
                      : <p className="text-sm font-medium text-gray-900">{item.value}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Response times</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><span>General inquiries</span><span className="font-medium text-gray-900">1 business day</span></div>
                <div className="flex justify-between"><span>Technical support</span><span className="font-medium text-gray-900">4 hours</span></div>
                <div className="flex justify-between"><span>Billing issues</span><span className="font-medium text-gray-900">1 business day</span></div>
                <div className="flex justify-between"><span>Security reports</span><span className="font-medium text-gray-900">48 hours</span></div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-indigo-50 p-6">
              <h3 className="font-semibold text-gray-900 mb-1">Need immediate help?</h3>
              <p className="text-sm text-gray-600 mb-3">Check our support center for instant answers to common questions.</p>
              <Link href="/support" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                Visit Support Center →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio. Made with ❤️ in Québec, Canada 🍁</p>
      </footer>
    </div>
  )
}
