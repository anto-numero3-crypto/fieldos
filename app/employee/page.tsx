'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../supabase'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtDate } from '@/lib/format'
import {
  Wrench, LogOut, Briefcase, MapPin, Clock, CheckCircle, ChevronRight,
  Calendar, Loader2, User,
} from 'lucide-react'

interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  color: string
  organizations: { id: string; name: string; plan: string } | null
}

interface Job {
  id: string
  title: string
  description: string | null
  status: string
  scheduled_date: string | null
  start_time: string | null
  end_time: string | null
  service_address: string | null
  customers: { name: string; phone: string | null } | null
}

const STATUS_BADGE: Record<string, string> = {
  scheduled:        'bg-blue-100 text-blue-800',
  in_progress:      'bg-green-100 text-green-800',
  needs_completion: 'bg-orange-100 text-orange-800',
  completed:        'bg-gray-100 text-gray-600',
  complete:         'bg-gray-100 text-gray-600',
  cancelled:        'bg-gray-100 text-gray-400',
}

export default function EmployeeDashboard() {
  const router = useRouter()
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [todayJobs, setTodayJobs] = useState<Job[]>([])
  const [upcomingJobs, setUpcomingJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { router.push('/login'); return }

      // Check if user is an employee
      const meRes = await fetch('/api/employees/me')
      if (!meRes.ok) {
        // Not an employee — redirect to owner dashboard
        router.push('/dashboard')
        return
      }

      const meData = await meRes.json()
      const emp = meData.employee as Employee
      setEmployee(emp)

      // Fetch jobs — jobs are assigned via team_members.id in assigned_to.
      // Find the team_member that matches this employee's email to get their jobs.
      const { data: tmMatch } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', emp.email)
        .maybeSingle()
      const assignedToId = tmMatch?.id || emp.id

      const today = new Date().toISOString().slice(0, 10)
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

      const jobSelect = 'id, title, description, status, scheduled_date, start_time, end_time, service_address, customers(name, phone)'

      // Query both assigned_to (team_members) and assigned_employee_id (employees)
      const [{ data: todayByTm }, { data: todayByEmp }] = await Promise.all([
        supabase.from('jobs').select(jobSelect).eq('assigned_to', assignedToId).eq('scheduled_date', today).order('start_time', { ascending: true }),
        supabase.from('jobs').select(jobSelect).eq('assigned_employee_id', emp.id).eq('scheduled_date', today).order('start_time', { ascending: true }),
      ])
      const todayIds = new Set<string>()
      const todayAll: Job[] = []
      for (const j of [...(todayByTm || []), ...(todayByEmp || [])] as unknown as Job[]) {
        if (!todayIds.has(j.id)) { todayIds.add(j.id); todayAll.push(j) }
      }
      setTodayJobs(todayAll)

      const [{ data: upByTm }, { data: upByEmp }] = await Promise.all([
        supabase.from('jobs').select(jobSelect).eq('assigned_to', assignedToId).gt('scheduled_date', today).lte('scheduled_date', nextWeek).order('scheduled_date', { ascending: true }),
        supabase.from('jobs').select(jobSelect).eq('assigned_employee_id', emp.id).gt('scheduled_date', today).lte('scheduled_date', nextWeek).order('scheduled_date', { ascending: true }),
      ])
      const upIds = new Set<string>()
      const upAll: Job[] = []
      for (const j of [...(upByTm || []), ...(upByEmp || [])] as unknown as Job[]) {
        if (!upIds.has(j.id)) { upIds.add(j.id); upAll.push(j) }
      }
      setUpcomingJobs(upAll)
      setLoading(false)
    }
    init()
  }, [router])

  const markComplete = async (jobId: string) => {
    const { error } = await supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId)
    if (!error) {
      setTodayJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'completed' } : j))
      setUpcomingJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'completed' } : j))
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const statusLabel = (s: string) => {
    const map: Record<string, { fr: string; en: string }> = {
      scheduled: { fr: 'Planifié', en: 'Scheduled' },
      in_progress: { fr: 'En cours', en: 'In progress' },
      needs_completion: { fr: 'À compléter', en: 'Needs completion' },
      completed: { fr: 'Complété', en: 'Completed' },
      complete: { fr: 'Complété', en: 'Completed' },
      cancelled: { fr: 'Annulé', en: 'Cancelled' },
    }
    return map[s]?.[fr ? 'fr' : 'en'] || s
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  const JobCard = ({ job }: { job: Job }) => (
    <Link
      href={`/employee/jobs/${job.id}`}
      className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md active:scale-[0.99] transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{job.title}</h3>
          {job.customers?.name && (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
              <User className="w-3.5 h-3.5" /> {job.customers.name}
            </p>
          )}
          {job.service_address && (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" /> {job.service_address}
            </p>
          )}
          {(job.start_time || job.end_time) && (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              {job.start_time?.slice(0, 5)}{job.end_time ? ` - ${job.end_time.slice(0, 5)}` : ''}
            </p>
          )}
          {job.scheduled_date && (
            <p className="text-xs text-gray-400 mt-1">
              {fmtDate(job.scheduled_date, lang as 'fr' | 'en', 'short')}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[job.status] || 'bg-gray-100 text-gray-600'}`}>
            {statusLabel(job.status)}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      {job.status !== 'completed' && job.status !== 'complete' && job.status !== 'cancelled' && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); markComplete(job.id) }}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          {fr ? 'Marquer comme complété' : 'Mark as completed'}
        </button>
      )}
    </Link>
  )

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
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
              {employee?.first_name} {employee?.last_name}
            </span>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              title={fr ? 'Déconnexion' : 'Log out'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {fr ? 'Bonjour' : 'Hello'} {employee?.first_name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {employee?.organizations?.name || ''}
          </p>
        </div>

        {/* Today's jobs */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {fr ? "Aujourd'hui" : 'Today'}
            </h2>
            <span className="text-sm text-gray-400">({todayJobs.length})</span>
          </div>

          {todayJobs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {fr ? "Aucune intervention assignée aujourd'hui" : 'No jobs assigned today'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </section>

        {/* Upcoming */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {fr ? '7 prochains jours' : 'Next 7 days'}
            </h2>
            <span className="text-sm text-gray-400">({upcomingJobs.length})</span>
          </div>

          {upcomingJobs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {fr ? 'Aucune intervention à venir' : 'No upcoming jobs'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
