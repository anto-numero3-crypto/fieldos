'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'
import { useLanguage } from '@/lib/LanguageContext'
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import GestivioLogo from '@/components/GestivioLogo'
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
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between auth-left-panel p-12 text-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-white/[0.03]" />

        <div className="relative flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <GestivioLogo size="lg" className="[&_span]:text-white [&_img]:brightness-0 [&_img]:invert" />
          </Link>
          <div className="flex items-center gap-0.5 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-0.5">
            <button onClick={() => setLang('en')} className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white text-indigo-700 shadow-sm' : 'text-white/70 hover:text-white'}`}>EN</button>
            <button onClick={() => setLang('fr')} className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-white text-indigo-700 shadow-sm' : 'text-white/70 hover:text-white'}`}>FR</button>
          </div>
        </div>

        <div className="relative space-y-4">
          <h2 className="text-3xl font-bold tracking-tight leading-tight text-white">
            {fr ? 'Sécurité d\'abord.' : 'Security first.'}
          </h2>
          <p className="text-lg text-indigo-200 leading-relaxed max-w-md">
            {fr
              ? 'Vos données sont protégées par un chiffrement AES-256 et une infrastructure hébergée au Canada.'
              : 'Your data is protected with AES-256 encryption and infrastructure hosted in Canada.'}
          </p>
        </div>

        <div className="relative" />
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col justify-center items-center px-4 py-12 sm:px-8 lg:px-16 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-sm">
          {/* Mobile logo + lang */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <GestivioLogo />
            <div className="flex items-center gap-0.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5 shadow-sm">
              <button onClick={() => setLang('en')} className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>EN</button>
              <button onClick={() => setLang('fr')} className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>FR</button>
            </div>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {fr ? 'Courriel envoyé !' : 'Email sent!'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {fr ? 'Un lien de réinitialisation a été envoyé à' : 'A reset link was sent to'}
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-6">{email}</p>
              <p className="text-xs text-gray-400 mb-8">
                {fr
                  ? 'Le lien expirera dans 60 minutes. Vérifiez votre dossier spam.'
                  : 'The link expires in 60 minutes. Check your spam folder.'}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {fr ? 'Retour à la connexion' : 'Back to sign in'}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {fr ? 'Mot de passe oublié ?' : 'Forgot your password?'}
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {fr
                    ? 'Entrez votre courriel et nous vous enverrons un lien de réinitialisation.'
                    : "Enter your email and we'll send you a reset link."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {fr ? 'Adresse courriel' : 'Email address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder={fr ? 'vous@entreprise.com' : 'you@company.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched(true)}
                      required
                      className={`block w-full rounded-xl border ${errEmail ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white dark:bg-gray-900 pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`}
                    />
                  </div>
                  <FieldError message={errEmail} />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl p-3.5 text-sm bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || formInvalid}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.99]"
                >
                  {loading
                    ? (fr ? 'Envoi en cours…' : 'Sending…')
                    : (fr ? 'Envoyer le lien' : 'Send reset link')}
                </button>
              </form>

              <div className="mt-8">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
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
