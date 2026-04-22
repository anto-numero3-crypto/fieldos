'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, MapPin, Phone, Send, CheckCircle, Loader2 } from 'lucide-react'
import GestivioLogo from '@/components/GestivioLogo'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function ContactPage() {
  const { lang } = useLanguage()
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
      setError(lang === 'fr'
        ? 'Échec de l\'envoi du message. Veuillez nous écrire directement à hello@gestivio.ca'
        : 'Failed to send message. Please email us directly at hello@gestivio.ca')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <LanguageToggle />
      </div>

      <nav className="border-b border-gray-100 dark:border-gray-800 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <GestivioLogo />
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">
            {lang === 'fr' ? 'Entrer en contact' : 'Get in touch'}
          </p>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {lang === 'fr' ? 'Nous contacter' : 'Contact Us'}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            {lang === 'fr'
              ? 'Nous serions ravis de vous entendre. Notre équipe répond généralement en un jour ouvrable.'
              : 'We\'d love to hear from you. Our team typically responds within one business day.'}
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {sent ? (
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-10 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {lang === 'fr' ? 'Message envoyé !' : 'Message sent!'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {lang === 'fr'
                    ? 'Merci de nous avoir contactés. Nous reviendrons vers vous en un jour ouvrable.'
                    : 'Thanks for reaching out. We\'ll get back to you within one business day.'}
                </p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', company: '', subject: '', message: '' }) }}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                  {lang === 'fr' ? 'Envoyer un autre message' : 'Send another message'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      {lang === 'fr' ? 'Nom complet *' : 'Full name *'}
                    </label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={lang === 'fr' ? 'Votre nom' : 'Your name'}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      {lang === 'fr' ? 'Adresse courriel *' : 'Email address *'}
                    </label>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    {lang === 'fr' ? 'Nom de l\'entreprise' : 'Company name'}
                  </label>
                  <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder={lang === 'fr' ? 'Nom de votre entreprise (optionnel)' : 'Your business name (optional)'}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    {lang === 'fr' ? 'Sujet *' : 'Subject *'}
                  </label>
                  <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none bg-white dark:bg-gray-900">
                    <option value="">{lang === 'fr' ? 'Choisir un sujet' : 'Select a topic'}</option>
                    <option>{lang === 'fr' ? 'Demande générale' : 'General inquiry'}</option>
                    <option>{lang === 'fr' ? 'Ventes / Tarifs' : 'Sales / Pricing'}</option>
                    <option>{lang === 'fr' ? 'Support technique' : 'Technical support'}</option>
                    <option>{lang === 'fr' ? 'Question de facturation' : 'Billing question'}</option>
                    <option>{lang === 'fr' ? 'Suggestion de fonctionnalité' : 'Feature request'}</option>
                    <option>{lang === 'fr' ? 'Partenariat' : 'Partnership'}</option>
                    <option>{lang === 'fr' ? 'Presse / Médias' : 'Press / Media'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    {lang === 'fr' ? 'Message *' : 'Message *'}
                  </label>
                  <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={lang === 'fr' ? 'Dites-nous comment nous pouvons vous aider...' : 'Tell us how we can help...'}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none resize-none" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={sending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending
                    ? (lang === 'fr' ? 'Envoi…' : 'Sending…')
                    : (lang === 'fr' ? 'Envoyer le message' : 'Send message')}
                </button>
              </form>
            )}
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {lang === 'fr' ? 'Coordonnées' : 'Contact information'}
              </h3>
              {[
                { icon: Mail, label: lang === 'fr' ? 'Courriel' : 'Email', value: 'hello@gestivio.ca', href: 'mailto:hello@gestivio.ca' },
                { icon: Phone, label: lang === 'fr' ? 'Téléphone' : 'Phone', value: lang === 'fr' ? 'Bientôt disponible' : 'Coming soon', href: null },
                { icon: MapPin, label: lang === 'fr' ? 'Emplacement' : 'Location', value: lang === 'fr' ? 'Québec, Canada' : 'Québec, Canada', href: null },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 shrink-0">
                    <item.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{item.label}</p>
                    {item.href
                      ? <a href={item.href} className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600">{item.value}</a>
                      : <p className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {lang === 'fr' ? 'Délais de réponse' : 'Response times'}
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>{lang === 'fr' ? 'Demandes générales' : 'General inquiries'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{lang === 'fr' ? '1 jour ouvrable' : '1 business day'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'fr' ? 'Support technique' : 'Technical support'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{lang === 'fr' ? '4 heures' : '4 hours'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'fr' ? 'Problèmes de facturation' : 'Billing issues'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{lang === 'fr' ? '1 jour ouvrable' : '1 business day'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'fr' ? 'Rapports de sécurité' : 'Security reports'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{lang === 'fr' ? '48 heures' : '48 hours'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {lang === 'fr' ? 'Besoin d\'aide immédiate ?' : 'Need immediate help?'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {lang === 'fr'
                  ? 'Consultez notre centre de support pour des réponses instantanées aux questions courantes.'
                  : 'Check our support center for instant answers to common questions.'}
              </p>
              <Link href="/support" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                {lang === 'fr' ? 'Visiter le centre de support →' : 'Visit Support Center →'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
        <p>© {new Date().getFullYear()} Gestivio. {lang === 'fr' ? 'Fait avec ❤️ au Québec, Canada 🍁' : 'Made with ❤️ in Québec, Canada 🍁'}</p>
      </footer>
    </div>
  )
}
