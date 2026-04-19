'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '../supabase'
import { useLanguage } from '@/lib/LanguageContext'
import { Mail, Lock, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import GestivioLogo from '@/components/GestivioLogo'
import { validateEmail, validatePassword } from '@/lib/validators'
import FieldError from '@/components/FieldError'

function LoginForm() {
  const { lang, setLang, t } = useLanguage()
  const l = t.login
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})

  const errEmail = touched.email ? validateEmail(email) : ''
  const errPwd   = touched.password ? validatePassword(password) : ''
  const formInvalid = !!validateEmail(email) || !!validatePassword(password)

  useEffect(() => {
    const err = searchParams.get('error')
    if (err === 'confirmation_failed') {
      setMessage(lang === 'fr' ? 'Échec de la confirmation. Veuillez réessayer.' : 'Confirmation failed. Please try again.')
      setIsError(true)
    } else if (err) {
      setMessage(decodeURIComponent(err))
      setIsError(true)
    }
  }, [searchParams, lang])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setTouched({ email: true, password: true })
    if (formInvalid) return
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setMessage(error.message); setIsError(true) }
    else { window.location.href = '/dashboard' }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-white">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <GestivioLogo size="lg" className="[&_span]:text-white [&_img]:brightness-0 [&_img]:invert" />
          </Link>
          {/* Language toggle on login page */}
          <div className="flex items-center gap-0.5 rounded-lg border border-white/20 bg-white/10 p-0.5">
            <button onClick={() => setLang('en')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white text-indigo-700' : 'text-white/70 hover:text-white'}`}>EN</button>
            <button onClick={() => setLang('fr')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-white text-indigo-700' : 'text-white/70 hover:text-white'}`}>FR</button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold leading-relaxed text-white/95 mb-3">
            {lang === 'fr' ? "La plateforme pour les entrepreneurs en services." : 'The platform for service professionals.'}
          </h2>
          <p className="text-white/80 leading-relaxed">
            {lang === 'fr'
              ? 'Facturation, rendez-vous, gestion clientèle. Bilingue FR/EN. Données au Canada. Essai gratuit de 14 jours.'
              : 'Invoicing, scheduling, customer management. Fully bilingual. Data in Canada. 14-day free trial.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: lang === 'fr' ? 'Fait au Québec 🍁' : 'Made in Quebec 🍁' },
            { label: lang === 'fr' ? 'Données au Canada' : 'Data in Canada' },
            { label: lang === 'fr' ? 'Support en français' : 'French support' },
            { label: lang === 'fr' ? 'TPS + TVQ inclus' : 'GST + QST built in' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm">
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col justify-center items-center px-4 py-12 sm:px-8 lg:px-16 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo + lang */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <GestivioLogo />
            <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button onClick={() => setLang('en')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>EN</button>
              <button onClick={() => setLang('fr')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>FR</button>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{l.welcomeBack}</h1>
            <p className="mt-2 text-sm text-gray-500">{l.welcomeBackSub}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">{l.emailLabel}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input id="email" type="email" placeholder={l.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} required className={`block w-full rounded-xl border ${errEmail ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`} />
              </div>
              <FieldError message={errEmail} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">{l.passwordLabel}</label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                  {lang === 'fr' ? 'Mot de passe oublié ?' : 'Forgot password?'}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input id="password" type={showPassword ? 'text' : 'password'} placeholder={l.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, password: true }))} required className={`block w-full rounded-xl border ${errPwd ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError message={errPwd} />
            </div>

            {message && (
              <div className={['flex items-start gap-2.5 rounded-xl p-3 text-sm', isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'].join(' ')}>
                {isError ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                {message}
              </div>
            )}

            <button type="submit" disabled={loading || formInvalid} className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150">
              {loading ? t.common.pleaseWait : l.signInBtn}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-500">
              {l.noAccount}{' '}
              <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                {l.signUpFree}
              </Link>
            </span>
          </div>

          <div className="mt-8">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t.common.backToHome}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
