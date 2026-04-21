'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '../supabase'
import { useLanguage } from '@/lib/LanguageContext'
import { Mail, Lock, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff, Shield, MapPin, Globe, Receipt } from 'lucide-react'
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
      setMessage(lang === 'fr' ? 'Echec de la confirmation. Veuillez reessayer.' : 'Confirmation failed. Please try again.')
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

  const trustBadges = [
    { icon: MapPin, label: lang === 'fr' ? 'Fait au Quebec' : 'Made in Quebec' },
    { icon: Shield, label: lang === 'fr' ? 'Donnees au Canada' : 'Data in Canada' },
    { icon: Globe, label: lang === 'fr' ? 'Support en francais' : 'French support' },
    { icon: Receipt, label: lang === 'fr' ? 'TPS + TVQ inclus' : 'GST + QST built in' },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left panel - gradient brand area */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between auth-left-panel p-12 text-white relative overflow-hidden">
        {/* Subtle decorative circles */}
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
            {lang === 'fr' ? "Gerez votre entreprise\nde services terrain." : 'Manage your field\nservice business.'}
          </h2>
          <p className="text-lg text-indigo-200 leading-relaxed max-w-md">
            {lang === 'fr'
              ? 'Facturation, rendez-vous, gestion clientele. Bilingue FR/EN. Donnees au Canada. Essai gratuit de 14 jours.'
              : 'Invoicing, scheduling, customer management. Fully bilingual. Data in Canada. 14-day free trial.'}
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-3">
          {trustBadges.map((b) => (
            <div key={b.label} className="flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 px-3.5 py-2.5 transition-colors hover:bg-white/15">
              <b.icon className="h-4 w-4 text-indigo-200 shrink-0" />
              <span className="text-sm font-medium">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 flex-col justify-center items-center px-4 py-12 sm:px-8 lg:px-16 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-sm">
          {/* Mobile logo + lang */}
          <div className="flex items-center justify-between mb-10 lg:hidden">
            <GestivioLogo />
            <div className="flex items-center gap-0.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5 shadow-sm">
              <button onClick={() => setLang('en')} className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>EN</button>
              <button onClick={() => setLang('fr')} className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>FR</button>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{l.welcomeBack}</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{l.welcomeBackSub}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{l.emailLabel}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input id="email" type="email" placeholder={l.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} required className={`block w-full rounded-xl border ${errEmail ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white dark:bg-gray-900 pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`} />
              </div>
              <FieldError message={errEmail} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{l.passwordLabel}</label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                  {lang === 'fr' ? 'Mot de passe oublie ?' : 'Forgot password?'}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input id="password" type={showPassword ? 'text' : 'password'} placeholder={l.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, password: true }))} required className={`block w-full rounded-xl border ${errPwd ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white dark:bg-gray-900 pl-10 pr-10 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError message={errPwd} />
            </div>

            {message && (
              <div className={['flex items-start gap-2.5 rounded-xl p-3.5 text-sm', isError ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50'].join(' ')}>
                {isError ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                {message}
              </div>
            )}

            <button type="submit" disabled={loading || formInvalid} className="w-full rounded-xl bg-indigo-600 px-4 py-3 min-h-11 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 dark:focus:ring-offset-gray-950 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.99]">
              {loading ? t.common.pleaseWait : l.signInBtn}
            </button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {l.noAccount}{' '}
              <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                {l.signUpFree} &rarr;
              </Link>
            </span>
          </div>

          <div className="mt-10">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
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
