'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/LanguageContext'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import GestivioLogo from '@/components/GestivioLogo'

interface InviteInfo {
  first_name: string
  last_name: string
  email: string
  org_name: string
}

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      // Validate token by checking accept-invite with a GET-like approach
      // We'll use a lightweight check — try to find the employee info
      const res = await fetch('/api/employees/invite-info?' + new URLSearchParams({ token }))
      if (res.ok) {
        const data = await res.json()
        setInfo(data)
      } else {
        setError(fr ? "Ce lien d'invitation est invalide ou a expiré." : 'This invite link is invalid or has expired.')
      }
      setLoading(false)
    }
    load()
  }, [token, fr])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6 || password !== confirmPassword) return
    setSubmitting(true)

    const res = await fetch('/api/employees/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    if (res.ok) {
      setSuccess(true)
      setTimeout(() => {
        router.push('/login?message=' + encodeURIComponent(fr ? 'Compte créé! Connectez-vous.' : 'Account created! Please sign in.'))
      }, 1500)
    } else {
      const data = await res.json()
      setError(data.error || (fr ? 'Une erreur est survenue' : 'An error occurred'))
      setSubmitting(false)
    }
  }

  const pwdMismatch = confirmPassword.length > 0 && password !== confirmPassword
  const pwdTooShort = password.length > 0 && password.length < 6

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <GestivioLogo size="lg" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : error && !info ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {fr ? 'Invitation invalide' : 'Invalid invitation'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
              <a
                href="/login"
                className="inline-block mt-6 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                {fr ? 'Aller à la connexion' : 'Go to login'}
              </a>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {fr ? 'Compte créé!' : 'Account created!'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {fr ? 'Redirection vers la connexion...' : 'Redirecting to login...'}
              </p>
            </div>
          ) : info ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 text-center">
                {fr ? `Rejoignez ${info.org_name} sur Gestivio` : `Join ${info.org_name} on Gestivio`}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                {info.first_name} {info.last_name} &middot; {info.email}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {fr ? 'Mot de passe' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={fr ? '6 caractères minimum' : 'At least 6 characters'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {pwdTooShort && (
                    <p className="mt-1 text-xs text-red-500">
                      {fr ? '6 caractères minimum' : 'At least 6 characters'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {fr ? 'Confirmer le mot de passe' : 'Confirm password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  {pwdMismatch && (
                    <p className="mt-1 text-xs text-red-500">
                      {fr ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match'}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || password.length < 6 || password !== confirmPassword}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {fr ? 'Créer mon compte' : 'Create my account'}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
