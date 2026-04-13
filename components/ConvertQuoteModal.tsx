'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Briefcase, Loader2 } from 'lucide-react'
import { supabase } from '@/app/supabase'

interface QuoteForConversion {
  id: string
  title: string | null
  customer_id?: string | null
  notes?: string | null
}

interface TeamMember { id: string; name: string }

interface Props {
  open: boolean
  quote: QuoteForConversion | null
  onClose: () => void
  onConverted?: (jobId: string) => void
}

export default function ConvertQuoteModal({ open, quote, onClose, onConverted }: Props) {
  const router = useRouter()
  const [date, setDate]      = useState('')
  const [time, setTime]      = useState('')
  const [techId, setTechId]  = useState('')
  const [team, setTeam]      = useState<TeamMember[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    const today = new Date()
    setDate(today.toISOString().slice(0, 10))
    setTime('09:00')
    setTechId('')

    // Pre-fill team list (only if any exist).
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      const { data } = await supabase
        .from('team_members')
        .select('id, name')
        .eq('user_id', auth.user.id)
        .eq('is_active', true)
        .order('name')
      setTeam((data || []) as TeamMember[])
    })()
  }, [open])

  // Lock body scroll
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  if (!open || !quote) return null

  const submit = async () => {
    if (!date) { toast.error('Date requise'); return }
    setSubmitting(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { toast.error('Session expirée'); return }

      const { data: job, error: jobErr } = await supabase.from('jobs').insert({
        user_id: auth.user.id,
        customer_id: quote.customer_id || null,
        title: quote.title || 'Emploi (depuis devis)',
        description: quote.notes || null,
        scheduled_date: date,
        start_time: time || null,
        status: 'scheduled',
        source: 'quote',
        quote_id: quote.id,
        assigned_to: techId || null,
      }).select('id').single()

      if (jobErr || !job) {
        toast.error(jobErr?.message || 'Échec de la création de l\'emploi')
        return
      }

      const { error: qErr } = await supabase
        .from('quotes')
        .update({ status: 'converted', converted_to_job_id: job.id })
        .eq('id', quote.id)
      if (qErr) {
        // Job is already created — surface but don't block.
        console.error('[convert] quote status update failed:', qErr)
      }

      toast.success('Emploi créé avec succès')
      onConverted?.(job.id)
      onClose()
      router.push(`/jobs/${job.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Briefcase className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Convertir en emploi</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Devis : <span className="font-medium text-gray-900">{quote.title || quote.id.slice(0, 8)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date de l&apos;emploi *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Heure de début</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {team.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Technicien (optionnel)</label>
              <select
                value={techId}
                onChange={(e) => setTechId(e.target.value)}
                className="block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Non assigné</option>
                {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !date}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Création…' : 'Créer l\'emploi'}
          </button>
        </div>
      </div>
    </div>
  )
}
