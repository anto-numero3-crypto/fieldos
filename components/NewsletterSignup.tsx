'use client'

import { useState } from 'react'
import { Mail, Check, Loader2 } from 'lucide-react'

interface Props {
  title?: string
  description?: string
  source?: string
  locale?: 'fr' | 'en'
  compact?: boolean
}

export default function NewsletterSignup({
  title = 'Recevez nos conseils chaque semaine',
  description = 'Un courriel par semaine. Pas de spam. Désabonnement en un clic.',
  source = 'website',
  locale = 'fr',
  compact = false,
}: Props) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setState('loading')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source, locale }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setState('success')
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur')
    }
  }

  if (compact) {
    return (
      <form onSubmit={submit} className="flex gap-2 max-w-md">
        <input
          type="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@courriel.com"
          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          disabled={state === 'loading' || state === 'success'}
        />
        <button
          type="submit"
          disabled={state === 'loading' || state === 'success'}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {state === 'success' ? <><Check className="h-4 w-4" /> Inscrit</> :
           state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : "S'abonner"}
        </button>
      </form>
    )
  }

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-6 sm:p-8">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      {state === 'success' ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 text-emerald-700 px-4 py-3 text-sm font-medium">
          <Check className="h-4 w-4" /> Merci ! Vérifiez votre boîte courriel pour confirmer votre inscription.
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@courriel.com"
            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            disabled={state === 'loading'}
          />
          <button
            type="submit"
            disabled={state === 'loading'}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : "S'abonner"}
          </button>
        </form>
      )}
      {state === 'error' && <p className="text-xs text-red-600 mt-2">{errorMsg || 'Une erreur est survenue.'}</p>}
      <p className="text-[11px] text-gray-400 mt-3">En vous abonnant, vous acceptez de recevoir nos courriels. Conforme à la LCAP canadienne.</p>
    </div>
  )
}
