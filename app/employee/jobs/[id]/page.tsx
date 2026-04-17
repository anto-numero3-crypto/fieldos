'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/app/supabase'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtDate } from '@/lib/format'
import {
  Wrench, LogOut, ArrowLeft, User, MapPin, Clock, Calendar,
  CheckCircle, FileText, StickyNote, Phone, ExternalLink,
  Loader2, Save,
} from 'lucide-react'

interface Job {
  id: string
  title: string
  description: string | null
  status: string
  scheduled_date: string | null
  start_time: string | null
  end_time: string | null
  service_address: string | null
  internal_notes: string | null
  customers: { name: string; phone: string | null; email: string | null } | null
}

const STATUS_CFG: Record<string, { label: { fr: string; en: string }; cls: string }> = {
  scheduled:        { label: { fr: 'Planifié', en: 'Scheduled' },          cls: 'bg-blue-100 text-blue-800' },
  in_progress:      { label: { fr: 'En cours', en: 'In progress' },       cls: 'bg-green-100 text-green-800' },
  needs_completion: { label: { fr: 'À compléter', en: 'Needs completion' }, cls: 'bg-orange-100 text-orange-800' },
  completed:        { label: { fr: 'Complété', en: 'Completed' },          cls: 'bg-gray-100 text-gray-600' },
  complete:         { label: { fr: 'Complété', en: 'Completed' },          cls: 'bg-gray-100 text-gray-600' },
  cancelled:        { label: { fr: 'Annulé', en: 'Cancelled' },            cls: 'bg-gray-100 text-gray-400' },
}

export default function EmployeeJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [empName, setEmpName] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { router.push('/login'); return }

      // Verify employee
      const meRes = await fetch('/api/employees/me')
      if (!meRes.ok) { router.push('/dashboard'); return }
      const meData = await meRes.json()
      setEmpName(`${meData.employee.first_name} ${meData.employee.last_name}`)

      // Load job
      const { data: jobData } = await supabase
        .from('jobs')
        .select('id, title, description, status, scheduled_date, start_time, end_time, service_address, internal_notes, customers(name, phone, email)')
        .eq('id', id)
        .eq('assigned_employee_id', meData.employee.id)
        .single()

      if (!jobData) { router.push('/employee'); return }
      setJob(jobData as unknown as Job)
      setNotes(jobData.internal_notes || '')
      setLoading(false)
    }
    init()
  }, [id, router])

  const markComplete = async () => {
    if (!job) return
    const { error } = await supabase.from('jobs').update({ status: 'completed' }).eq('id', id)
    if (!error) setJob({ ...job, status: 'completed' })
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    await supabase.from('jobs').update({ internal_notes: notes || null }).eq('id', id)
    setSavingNotes(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const gmapsUrl = job?.service_address
    ? `https://www.google.com/maps/search/${encodeURIComponent(job.service_address)}`
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (!job) return null

  const sc = STATUS_CFG[job.status] || STATUS_CFG.scheduled

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Gestivio</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">{empName}</span>
            <button onClick={logout} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <Link
          href="/employee"
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {fr ? 'Retour' : 'Back'}
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 space-y-5">
            {/* Title + status */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${sc.cls}`}>
                {sc.label[fr ? 'fr' : 'en']}
              </span>
            </div>

            {job.description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm">{job.description}</p>
            )}

            {/* Details */}
            <div className="space-y-3">
              {job.customers?.name && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{job.customers.name}</p>
                    {job.customers.phone && (
                      <a href={`tel:${job.customers.phone}`} className="text-sm text-indigo-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {job.customers.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {job.service_address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{job.service_address}</p>
                    {gmapsUrl && (
                      <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Google Maps
                      </a>
                    )}
                  </div>
                </div>
              )}

              {job.scheduled_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-900 dark:text-white">
                    {fmtDate(job.scheduled_date, lang as 'fr' | 'en')}
                  </p>
                </div>
              )}

              {(job.start_time || job.end_time) && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-900 dark:text-white">
                    {job.start_time?.slice(0, 5)}{job.end_time ? ` - ${job.end_time.slice(0, 5)}` : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <StickyNote className="w-4 h-4" />
                {fr ? 'Notes' : 'Notes'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder={fr ? 'Ajouter des notes...' : 'Add notes...'}
              />
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {fr ? 'Enregistrer' : 'Save'}
              </button>
            </div>

            {/* Complete action */}
            {job.status !== 'completed' && job.status !== 'complete' && job.status !== 'cancelled' && (
              <button
                onClick={markComplete}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all"
              >
                <CheckCircle className="w-5 h-5" />
                {fr ? 'Marquer comme complété' : 'Mark as completed'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
