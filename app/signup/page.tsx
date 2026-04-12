'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'
import { useLanguage } from '@/lib/LanguageContext'
import {
  Wrench, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle,
  ArrowLeft, ArrowRight, Building2, Phone, MapPin, RefreshCw,
  Check,
} from 'lucide-react'

const PROVINCES_EN = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
  'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
]
const PROVINCES_FR = [
  'Alberta', 'Colombie-Britannique', 'Manitoba', 'Nouveau-Brunswick',
  'Terre-Neuve-et-Labrador', 'Territoires du Nord-Ouest', 'Nouvelle-Écosse',
  'Nunavut', 'Ontario', 'Île-du-Prince-Édouard', 'Québec', 'Saskatchewan', 'Yukon',
]

const SOURCES_EN = [
  'Google / Search engine',
  'Social media (Facebook, Instagram…)',
  'Friend or colleague referral',
  'Industry event or trade show',
  'Online ad',
  'Other',
]
const SOURCES_FR = [
  'Google / Moteur de recherche',
  'Réseaux sociaux (Facebook, Instagram…)',
  'Référence d\'un ami ou collègue',
  'Événement ou salon professionnel',
  'Publicité en ligne',
  'Autre',
]

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score, label: 'Faible / Weak', color: 'bg-red-500' }
  if (score <= 2) return { score, label: 'Moyen / Fair', color: 'bg-amber-500' }
  if (score <= 3) return { score, label: 'Bien / Good', color: 'bg-yellow-400' }
  return { score, label: 'Fort / Strong', color: 'bg-emerald-500' }
}

type Step = 1 | 2 | 3 | 'done'

export default function SignupPage() {
  const { lang, setLang } = useLanguage()
  const fr = lang === 'fr'

  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)

  // Step 2
  const [business, setBusiness] = useState('')
  const [phone, setPhone] = useState('')
  const [province, setProvince] = useState('')

  // Step 3
  const [source, setSource] = useState('')

  // Shared
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Resend cooldown
  const [cooldown, setCooldown] = useState(0)
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const strength = getStrength(password)
  const provinces = fr ? PROVINCES_FR : PROVINCES_EN
  const sources = fr ? SOURCES_FR : SOURCES_EN

  function validateStep1() {
    if (!email) return fr ? 'Courriel requis.' : 'Email is required.'
    if (password.length < 8) return fr ? 'Mot de passe trop court (min. 8 caractères).' : 'Password too short (min. 8 characters).'
    if (password !== confirm) return fr ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.'
    if (!agreed) return fr ? 'Vous devez accepter les conditions.' : 'You must accept the terms.'
    return ''
  }

  function validateStep2() {
    if (!business.trim()) return fr ? 'Nom d\'entreprise requis.' : 'Business name is required.'
    return ''
  }

  function nextStep() {
    setError('')
    if (step === 1) {
      const e = validateStep1()
      if (e) { setError(e); return }
      setStep(2)
    } else if (step === 2) {
      const e = validateStep2()
      if (e) { setError(e); return }
      setStep(3)
    }
  }

  async function submit() {
    setError('')
    setLoading(true)
    const metadata = { business_name: business, phone, province, source }
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata, emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (signUpError) {
      setError(signUpError.message)
    } else {
      setCooldown(60)
      setStep('done')
    }
  }

  async function resend() {
    if (cooldown > 0) return
    setLoading(true)
    await supabase.auth.resend({ type: 'signup', email })
    setLoading(false)
    setCooldown(60)
  }

  const stepTitles = fr
    ? ['Vos identifiants', 'Votre entreprise', 'Dernière étape']
    : ['Your credentials', 'Your business', 'Last step']

  const leftStats = [
    { value: '2 500+', label: fr ? 'Entreprises utilisatrices' : 'Companies using Gestivio' },
    { value: '180 000+', label: fr ? 'Interventions complétées' : 'Jobs completed' },
    { value: '42 M$+', label: fr ? 'Revenus traités' : 'Revenue processed' },
  ]

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

        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 mt-0.5">
              <Check className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold">{fr ? 'Essai gratuit de 14 jours' : '14-day free trial'}</p>
              <p className="text-sm text-indigo-200">{fr ? 'Aucune carte de crédit requise' : 'No credit card required'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 mt-0.5">
              <Check className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold">{fr ? 'Données hébergées au Canada' : 'Data hosted in Canada'}</p>
              <p className="text-sm text-indigo-200">{fr ? 'Conformité LPRPDE garantie' : 'PIPEDA compliant'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 mt-0.5">
              <Check className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold">{fr ? 'Annulable en tout temps' : 'Cancel anytime'}</p>
              <p className="text-sm text-indigo-200">{fr ? 'Aucun engagement, aucuns frais cachés' : 'No contracts, no hidden fees'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {leftStats.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-indigo-200">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col justify-center items-center px-4 py-12 sm:px-8 lg:px-16 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile header */}
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

          {step === 'done' ? (
            /* ── Confirmation screen ── */
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <Mail className="h-9 w-9 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {fr ? 'Vérifiez votre courriel' : 'Check your email'}
              </h1>
              <p className="text-sm text-gray-500 mb-1">
                {fr ? 'Nous avons envoyé un lien de confirmation à' : 'We sent a confirmation link to'}
              </p>
              <p className="text-sm font-semibold text-gray-800 mb-6">{email}</p>
              <p className="text-xs text-gray-400 mb-8">
                {fr
                  ? 'Vérifiez votre dossier spam si vous ne le voyez pas dans les prochaines minutes.'
                  : "Check your spam folder if you don't see it within a few minutes."}
              </p>
              <button
                onClick={resend}
                disabled={cooldown > 0 || loading}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {cooldown > 0
                  ? (fr ? `Renvoyer dans ${cooldown}s` : `Resend in ${cooldown}s`)
                  : (fr ? 'Renvoyer le courriel' : 'Resend email')}
              </button>
              <div className="mt-6">
                <button
                  onClick={() => { setStep(1); setEmail(''); setPassword(''); setConfirm(''); setAgreed(false) }}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {fr ? '← Mauvais courriel ? Recommencer' : '← Wrong email? Start over'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Progress indicator */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  {([1, 2, 3] as const).map((s) => (
                    <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                      <div className={[
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all',
                        step === s ? 'bg-indigo-600 text-white' : (step as number) > s ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500',
                      ].join(' ')}>
                        {(step as number) > s ? <Check className="h-3.5 w-3.5" /> : s}
                      </div>
                      {s < 3 && (
                        <div className={['h-0.5 flex-1 rounded transition-all', (step as number) > s ? 'bg-emerald-400' : 'bg-gray-200'].join(' ')} />
                      )}
                    </div>
                  ))}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {step === 1
                    ? (fr ? 'Créer votre compte' : 'Create your account')
                    : step === 2
                    ? (fr ? 'Votre entreprise' : 'Your business')
                    : (fr ? 'Une dernière chose' : 'One last thing')}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {fr ? `Étape ${step} sur 3 — ${stepTitles[(step as number) - 1]}` : `Step ${step} of 3 — ${stepTitles[(step as number) - 1]}`}
                </p>
              </div>

              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {fr ? 'Adresse courriel' : 'Email address'}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder={fr ? 'vous@entreprise.com' : 'you@company.com'}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {fr ? 'Mot de passe' : 'Password'}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder={fr ? 'Min. 8 caractères' : 'Min. 8 characters'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={['h-1 flex-1 rounded-full transition-all', strength.score >= i ? strength.color : 'bg-gray-200'].join(' ')} />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">{strength.label}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {fr ? 'Confirmer le mot de passe' : 'Confirm password'}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder={fr ? 'Répétez votre mot de passe' : 'Repeat your password'}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className={['block w-full rounded-xl border bg-white pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all', confirm && confirm !== password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'].join(' ')}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirm && password !== confirm && (
                      <p className="mt-1 text-xs text-red-600">{fr ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.'}</p>
                    )}
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">
                      {fr ? (
                        <>J'accepte les <Link href="/terms" className="text-indigo-600 hover:underline">conditions d'utilisation</Link> et la <Link href="/privacy" className="text-indigo-600 hover:underline">politique de confidentialité</Link>.</>
                      ) : (
                        <>I agree to the <Link href="/terms" className="text-indigo-600 hover:underline">terms of service</Link> and <Link href="/privacy" className="text-indigo-600 hover:underline">privacy policy</Link>.</>
                      )}
                    </span>
                  </label>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {fr ? "Nom de l'entreprise" : 'Business name'} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={fr ? 'Ex : Plomberie Tremblay inc.' : 'e.g. Rivera HVAC Services'}
                        value={business}
                        onChange={(e) => setBusiness(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {fr ? 'Téléphone' : 'Phone'} <span className="text-gray-400 text-xs font-normal">({fr ? 'facultatif' : 'optional'})</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="(514) 555-0123"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {fr ? 'Province' : 'Province'} <span className="text-gray-400 text-xs font-normal">({fr ? 'facultatif' : 'optional'})</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
                      >
                        <option value="">{fr ? '— Sélectionner —' : '— Select —'}</option>
                        {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 -mt-2 mb-4">
                    {fr ? 'Cette information est facultative et nous aide à améliorer Gestivio.' : 'This is optional and helps us improve Gestivio.'}
                  </p>
                  {sources.map((s) => (
                    <label key={s} className={['flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all', source === s ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20' : 'border-gray-200 bg-white hover:border-gray-300'].join(' ')}>
                      <input
                        type="radio"
                        name="source"
                        value={s}
                        checked={source === s}
                        onChange={() => setSource(s)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{s}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl p-3 text-sm bg-red-50 text-red-700 border border-red-100">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 space-y-3">
                {step < 3 ? (
                  <button
                    onClick={nextStep}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-150"
                  >
                    {fr ? 'Continuer' : 'Continue'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    {loading
                      ? (fr ? 'Création du compte…' : 'Creating account…')
                      : (fr ? 'Créer mon compte' : 'Create my account')}
                    {!loading && <CheckCircle className="h-4 w-4" />}
                  </button>
                )}

                {step > 1 && (
                  <button
                    onClick={() => { setStep((step as number - 1) as Step); setError('') }}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {fr ? 'Retour' : 'Back'}
                  </button>
                )}
              </div>

              <div className="mt-6 text-center">
                <span className="text-sm text-gray-500">
                  {fr ? 'Déjà un compte ? ' : 'Already have an account? '}
                  <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                    {fr ? 'Se connecter' : 'Sign in'}
                  </Link>
                </span>
              </div>

              <div className="mt-6">
                <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {fr ? "Retour à l'accueil" : 'Back to home'}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
