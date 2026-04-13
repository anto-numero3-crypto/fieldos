'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'
import { useLanguage } from '@/lib/LanguageContext'
import { Wrench, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { validateEmail } from '@/lib/validators'
import FieldError from '@/components/FieldError'

export default function ForgotPasswordPage() {
  const { lang, setLang } = useLanguage()
  const fr = lang === 'fr'

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)
  const errEmail = touched ? validateEmail(email) : ''
  const formInvalid = !!validateEmail(email)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (formInvalid) return
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message) }
    else { setSent(true) }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-white">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
              <Wrench className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-semibold">Gestivio</span>
          </Link>
          <div className="flex items-center gap-0.5 rounded-lg border border-white/20 bg-white/10 p-0.5">
            <button onClick={() => setLang('en')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white text-indigo-700' : 'text-white/70 hover:text-white'}`}>EN</button>
            <button onClick={() => setLang('fr')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-white text-indigo-700' : 'text-white/70 hover:text-white'}`}>FR</button>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-4">
            {fr ? 'Sécurité d\'abord.' : 'Security first.'}
          </h2>
          <p className="text-indigo-200 text-lg leading-relaxed">
            {fr
              ? 'Vos données sont protégées par un chiffrement AES-256 et une infrastructure hébergée au Canada.'
              : 'Your data is protected with AES-256 encryption and infrastructure hosted in Canada.'}
          </p>
        </div>

        <div />
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col justify-center items-center px-4 py-12 sm:px-8 lg:px-16 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo + lang */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600">
                <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-base font-semibold text-gray-900">Gestivio</span>
            </div>
            <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button onClick={() => setLang('en')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>EN</button>
              <button onClick={() => setLang('fr')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>FR</button>
            </div>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-9 w-9 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {fr ? 'Courriel envoyé !' : 'Email sent!'}
              </h1>
              <p className="text-sm text-gray-500 mb-1">
                {fr ? 'Un lien de réinitialisation a été envoyé à' : 'A reset link was sent to'}
              </p>
              <p className="text-sm font-semibold text-gray-800 mb-6">{email}</p>
              <p className="text-xs text-gray-400 mb-8">
                {fr
                  ? 'Le lien expirera dans 60 minutes. Vérifiez votre dossier spam.'
                  : 'The link expires in 60 minutes. Check your spam folder.'}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {fr ? 'Retour à la connexion' : 'Back to sign in'}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  {fr ? 'Mot de passe oublié ?' : 'Forgot your password?'}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  {fr
                    ? 'Entrez votre courriel et nous vous enverrons un lien de réinitialisation.'
                    : "Enter your email and we'll send you a reset link."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {fr ? 'Adresse courriel' : 'Email address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder={fr ? 'vous@entreprise.com' : 'you@company.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched(true)}
                      required
                      className={`block w-full rounded-xl border ${errEmail ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`}
                    />
                  </div>
                  <FieldError message={errEmail} />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl p-3 text-sm bg-red-50 text-red-700 border border-red-100">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || formInvalid}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
                >
                  {loading
                    ? (fr ? 'Envoi en cours…' : 'Sending…')
                    : (fr ? 'Envoyer le lien' : 'Send reset link')}
                </button>
              </form>

              <div className="mt-6">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {fr ? 'Retour à la connexion' : 'Back to sign in'}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
