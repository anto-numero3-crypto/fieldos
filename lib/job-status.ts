export type JobStatus = 'scheduled' | 'in_progress' | 'needs_completion' | 'completed' | 'invoiced' | 'cancelled'

export const JOB_STATUS_VALUES: JobStatus[] = [
  'scheduled', 'in_progress', 'needs_completion', 'completed', 'invoiced', 'cancelled',
]

export const JOB_STATUS_CLS: Record<string, string> = {
  scheduled:        'bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900',
  in_progress:      'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-900 animate-pulse',
  needs_completion: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:ring-orange-900 animate-pulse',
  completed:        'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900',
  complete:         'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900',
  invoiced:         'bg-teal-50 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-950/50 dark:text-teal-300 dark:ring-teal-900',
  cancelled:        'bg-gray-100 text-gray-500 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700',
}

export function getEffectiveJobStatus(job: {
  status: string | null | undefined
  scheduled_date: string | null
  start_time: string | null
  end_time: string | null
  is_multi_day?: boolean | null
  end_date?: string | null
}): string {
  const s = job.status || 'scheduled'
  // Rule 1: final statuses are never overridden
  if (s === 'completed' || s === 'complete' || s === 'invoiced' || s === 'cancelled') return s
  // Rule 2: no date → as-is
  if (!job.scheduled_date) return s

  const now = new Date()
  const dateOnly = job.scheduled_date.slice(0, 10)

  // Rule 3: multi-day job
  if (job.is_multi_day && job.end_date) {
    const startDate = new Date(`${dateOnly}T00:00:00`)
    const endDate = new Date(`${job.end_date.slice(0, 10)}T23:59:59`)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return s
    if (now < startDate) return 'scheduled'
    if (now <= endDate) return 'in_progress'
    return 'needs_completion'
  }

  // Rule 4: single-day with no start_time (all-day job)
  if (!job.start_time) {
    const dayStart = new Date(`${dateOnly}T00:00:00`)
    const dayEnd = new Date(`${dateOnly}T23:59:59`)
    if (isNaN(dayStart.getTime())) return s
    if (now < dayStart) return 'scheduled'
    if (now <= dayEnd) return 'in_progress'
    return 'needs_completion'
  }

  // Rule 5: single-day with start_time
  const startHHMM = job.start_time.slice(0, 5)
  const jobStart = new Date(`${dateOnly}T${startHHMM}:00`)
  const jobEnd = job.end_time
    ? new Date(`${dateOnly}T${job.end_time.slice(0, 5)}:00`)
    : new Date(jobStart.getTime() + 60 * 60 * 1000)

  if (isNaN(jobStart.getTime()) || isNaN(jobEnd.getTime())) return s
  if (now < jobStart) return 'scheduled'
  if (now <= jobEnd) return 'in_progress'
  return 'needs_completion'
}

export function jobStatusLabel(status: string, fr: boolean): string {
  const labels: Record<string, { fr: string; en: string }> = {
    scheduled:        { fr: 'Planifiée',     en: 'Scheduled' },
    in_progress:      { fr: 'En cours',       en: 'In progress' },
    needs_completion: { fr: 'À compléter',    en: 'Needs completion' },
    completed:        { fr: 'Complétée',      en: 'Completed' },
    complete:         { fr: 'Complétée',      en: 'Completed' },
    invoiced:         { fr: 'Facturée',       en: 'Invoiced' },
    cancelled:        { fr: 'Annulée',        en: 'Cancelled' },
  }
  const l = labels[status]
  if (!l) return status
  return fr ? l.fr : l.en
}
