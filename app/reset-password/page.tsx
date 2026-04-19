'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../supabase'
import { useLanguage } from '@/lib/LanguageContext'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import GestivioLogo from '@/components/GestivioLogo'
import { validatePassword, validatePasswordMatch } from '@/lib/validators'
import FieldError from '@/components/FieldError'

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

export default function ResetPasswordPage() {
  const { lang, setLang } = useLanguage()
  const fr = lang === 'fr'
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<{ password?: boolean; confirm?: boolean }>({})

  const strength = getStrength(password)
  const errPwd     = touched.password ? validatePassword(password) : ''
  const errConfirm = touched.confirm  ? validatePasswordMatch(password, confirm) : ''
  const formInvalid = !!validatePassword(password) || !!validatePasswordMatch(password, confirm)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ password: true, confirm: true })
    setError('')
    if (formInvalid) return
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message) }
    else {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-white">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <GestivioLogo size="lg" className="[&_span]:text-white [&_img]:brightness-0 [&_img]:invert" />
          </Link>
          <div className="flex items-center gap-0.5 rounded-lg border border-white/20 bg-white/10 p-0.5">
            <button onClick={() => setLang('en')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white text-indigo-700' : 'text-white/70 hover:text-white'}`}>EN</button>
            <button onClick={() => setLang('fr')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-white text-indigo-700' : 'text-white/70 hover:text-white'}`}>FR</button>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-4">
            {fr ? 'Choisissez un mot de passe fort.' : 'Choose a strong password.'}
          </h2>
          <p className="text-indigo-200 text-lg">
            {fr
              ? 'Combinez lettres majuscules, chiffres et symboles pour une sécurité maximale.'
              : 'Mix uppercase letters, numbers, and symbols for maximum security.'}
          </p>
        </div>
        <div />
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col justify-center items-center px-4 py-12 sm:px-8 lg:px-16 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile header */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <GestivioLogo />
            <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button onClick={() => setLang('en')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>EN</button>
              <button onClick={() => setLang('fr')} className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${lang === 'fr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>FR</button>
            </div>
          </div>

          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-9 w-9 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {fr ? 'Mot de passe mis à jour !' : 'Password updated!'}
              </h1>
              <p className="text-sm text-gray-500">
                {fr ? 'Redirection vers votre tableau de bord…' : 'Redirecting to your dashboard…'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  {fr ? 'Nouveau mot de passe' : 'New password'}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  {fr ? 'Choisissez un nouveau mot de passe sécurisé.' : 'Choose a new secure password.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {fr ? 'Nouveau mot de passe' : 'New password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder={fr ? 'Min. 8 caractères' : 'Min. 8 characters'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      required
                      className={`block w-full rounded-xl border ${errPwd ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`}
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
                  <FieldError message={errPwd} />
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
                      onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                      required
                      className={['block w-full rounded-xl border bg-white pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all', errConfirm ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'].join(' ')}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FieldError message={errConfirm} />
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
                    ? (fr ? 'Mise à jour…' : 'Updating…')
                    : (fr ? 'Mettre à jour le mot de passe' : 'Update password')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
