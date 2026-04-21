'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { useLanguage } from '@/lib/LanguageContext'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { getEffectiveJobStatus, JOB_STATUS_CLS, jobStatusLabel } from '@/lib/job-status'
import { fmtDate } from '@/lib/format'
import {
  Loader2, Briefcase, Calendar, Activity, UserCheck,
  Save, ArrowLeft, Phone, Mail,
} from 'lucide-react'

interface Employee {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  status: string
  phone: string | null
  color: string
  hourly_rate: number | null
  created_at: string
}

interface Job {
  id: string
  title: string
  status: string
  scheduled_date: string | null
  start_time: string | null
  end_time: string | null
  is_multi_day?: boolean | null
  end_date?: string | null
  created_at: string
  customers: { name: string } | null
}

const PRESET_COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const confirm = useConfirm()

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'interventions' | 'informations'>('interventions')

  // Edit form
  const [fFirstName, setFFirstName] = useState('')
  const [fLastName, setFLastName] = useState('')
  const [fPhone, setFPhone] = useState('')
  const [fColor, setFColor] = useState('#6366f1')
  const [fHourlyRate, setFHourlyRate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [empRes, jobsRes] = await Promise.all([
        fetch(`/api/employees/${id}`),
        fetch(`/api/employees/${id}/jobs`),
      ])
      if (empRes.ok) {
        const data = await empRes.json()
        const emp = data.employee
        setEmployee(emp)
        setFFirstName(emp.first_name)
        setFLastName(emp.last_name)
        setFPhone(emp.phone || '')
        setFColor(emp.color || '#6366f1')
        setFHourlyRate(emp.hourly_rate != null ? String(emp.hourly_rate) : '')
      }
      if (jobsRes.ok) {
        const data = await jobsRes.json()
        setJobs(data.jobs || [])
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: fFirstName.trim(),
        last_name: fLastName.trim(),
        phone: fPhone.trim() || null,
        color: fColor,
        hourly_rate: fHourlyRate.trim() ? parseFloat(fHourlyRate.trim()) : null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setEmployee(data.employee)
      toast.success(fr ? 'Employé mis à jour' : 'Employee updated')
    } else {
      toast.error(fr ? 'Erreur lors de la mise à jour' : 'Update failed')
    }
    setSaving(false)
  }

  const handleDeactivate = async () => {
    if (!employee) return
    const result = await confirm({
      title: fr ? 'Désactiver cet employé ?' : 'Deactivate this employee?',
      description: fr
        ? `${employee.first_name} ${employee.last_name} ne pourra plus accéder à l'application.`
        : `${employee.first_name} ${employee.last_name} will no longer be able to access the app.`,
      confirmLabel: fr ? 'Désactiver' : 'Deactivate',
      destructive: true,
    })
    if (!result.confirmed) return

    const res = await fetch(`/api/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'inactive' }),
    })
    if (res.ok) {
      toast.success(fr ? 'Employé désactivé' : 'Employee deactivated')
      router.push('/equipe')
    }
  }

  const handleDelete = async () => {
    if (!employee) return
    if (jobs.length > 0) {
      toast.error(
        fr
          ? `Impossible de supprimer : ${jobs.length} intervention(s) assignée(s)`
          : `Cannot delete: ${jobs.length} assigned job(s)`
      )
      return
    }
    const result = await confirm({
      title: fr ? 'Supprimer cet employé ?' : 'Delete this employee?',
      description: fr
        ? 'Cette action est irréversible.'
        : 'This action cannot be undone.',
      confirmLabel: fr ? 'Supprimer' : 'Delete',
      destructive: true,
    })
    if (!result.confirmed) return

    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success(fr ? 'Employé supprimé' : 'Employee deleted')
      router.push('/equipe')
    } else {
      const err = await res.json()
      if (err.error === 'employee_has_jobs') {
        toast.error(
          fr
            ? `Impossible de supprimer : ${err.count} intervention(s) assignée(s)`
            : `Cannot delete: ${err.count} assigned job(s)`
        )
      } else {
        toast.error(fr ? (err.error || 'Impossible de supprimer l\u2019employ\u00e9') : (err.error || 'Could not delete employee'))
      }
    }
  }

  // Stats
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const jobsThisMonth = jobs.filter(j => j.scheduled_date && j.scheduled_date >= monthStart).length
  const lastActivity = jobs.length > 0
    ? jobs.reduce((latest, j) => {
        const d = j.scheduled_date || j.created_at
        return d > latest ? d : latest
      }, '')
    : null

  if (loading) {
    return (
      <AppLayout title={fr ? 'Employé' : 'Employee'}>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (!employee) {
    return (
      <AppLayout title={fr ? 'Employé' : 'Employee'}>
        <div className="text-center py-20 text-gray-500">
          {fr ? 'Employé introuvable' : 'Employee not found'}
        </div>
      </AppLayout>
    )
  }

  const statusBadge = (status: string) => {
    const cls = status === 'active'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      : status === 'invited'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    const label = status === 'active' ? (fr ? 'Actif' : 'Active') : status === 'invited' ? (fr ? 'Invité' : 'Invited') : (fr ? 'Inactif' : 'Inactive')
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
  }

  return (
    <AppLayout title={`${employee.first_name} ${employee.last_name}`}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Back link */}
        <button
          onClick={() => router.push('/equipe')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 active:scale-[0.98] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          {fr ? 'Retour à l\'équipe' : 'Back to team'}
        </button>

        {/* Header */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden mb-6">
          <div className="h-20 sm:h-24" style={{ background: `linear-gradient(135deg, ${employee.color || '#6366f1'}, ${employee.color || '#6366f1'}88)` }} />
          <div className="px-6 pb-6 -mt-8">
            <div className="flex items-end gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 ring-4 ring-white dark:ring-gray-900 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${employee.color || '#6366f1'}, ${employee.color || '#6366f1'}cc)` }}
              >
                {employee.first_name[0]}{employee.last_name[0]}
              </div>
              <div className="min-w-0 flex-1 pb-0.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {employee.first_name} {employee.last_name}
                  </h1>
                  {statusBadge(employee.status)}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                  {employee.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> {employee.email}
                    </span>
                  )}
                  {employee.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {employee.phone}
                    </span>
                  )}
                  {employee.hourly_rate != null && (
                    <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      ${employee.hourly_rate}/h
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{jobsThisMonth}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fr ? 'Ce mois' : 'This month'}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{jobs.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fr ? 'Total' : 'Total'}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
                <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {lastActivity ? fmtDate(lastActivity, lang) : '—'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{fr ? 'Dernière activité' : 'Last activity'}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-1">{statusBadge(employee.status)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{fr ? 'Statut' : 'Status'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => setTab('interventions')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                tab === 'interventions'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {fr ? 'Interventions' : 'Jobs'} ({jobs.length})
            </button>
            <button
              onClick={() => setTab('informations')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                tab === 'informations'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {fr ? 'Informations' : 'Information'}
            </button>
          </div>
        </div>

        {/* Tab content */}
        {tab === 'interventions' && (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
            {jobs.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                {fr ? 'Aucune intervention assignée' : 'No assigned jobs'}
              </div>
            ) : (
              [...jobs]
                .sort((a, b) => (b.scheduled_date || b.created_at).localeCompare(a.scheduled_date || a.created_at))
                .map((job) => {
                  const eff = getEffectiveJobStatus(job)
                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:scale-[0.99] transition-all duration-200"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {job.title || (fr ? 'Sans titre' : 'Untitled')}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {job.scheduled_date && <span>{fmtDate(job.scheduled_date, lang)}</span>}
                          {job.customers?.name && <span>· {job.customers.name}</span>}
                        </div>
                      </div>
                      <span className={`shrink-0 ml-3 px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_CLS[eff] || ''}`}>
                        {jobStatusLabel(eff, fr)}
                      </span>
                    </Link>
                  )
                })
            )}
          </div>
        )}

        {tab === 'informations' && (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
            <div className="space-y-4 max-w-md">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {fr ? 'Prénom' : 'First name'}
                  </label>
                  <input
                    type="text"
                    value={fFirstName}
                    onChange={(e) => setFFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {fr ? 'Nom' : 'Last name'}
                  </label>
                  <input
                    type="text"
                    value={fLastName}
                    onChange={(e) => setFLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fr ? 'Courriel' : 'Email'}
                </label>
                <input
                  type="email"
                  value={employee.email}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fr ? 'Téléphone' : 'Phone'}
                </label>
                <input
                  type="tel"
                  value={fPhone}
                  onChange={(e) => setFPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fr ? 'Taux horaire' : 'Hourly rate'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fHourlyRate}
                    onChange={(e) => setFHourlyRate(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fr ? 'Couleur' : 'Color'}
                </label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setFColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${fColor === c ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-800' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !fFirstName.trim() || !fLastName.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 active:scale-[0.98] transition-all duration-200 shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {fr ? 'Enregistrer' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          {employee.status !== 'inactive' && (
            <button
              onClick={handleDeactivate}
              className="px-4 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded-xl active:scale-[0.98] transition-all duration-200"
            >
              {fr ? 'Désactiver' : 'Deactivate'}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2.5 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-xl active:scale-[0.98] transition-all duration-200"
          >
            {fr ? 'Supprimer' : 'Delete'}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
