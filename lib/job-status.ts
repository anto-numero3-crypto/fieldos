export type JobStatus = 'scheduled' | 'in_progress' | 'needs_completion' | 'completed' | 'invoiced' | 'cancelled'

export const JOB_STATUS_VALUES: JobStatus[] = [
  'scheduled', 'in_progress', 'needs_completion', 'completed', 'invoiced', 'cancelled',
]

// Simplified 4-state palette. Invoiced is visually identical to completed.
// Cancelled is completed-colored but dimmed via opacity.
export const JOB_STATUS_CLS: Record<string, string> = {
  scheduled:        'bg-blue-100 text-blue-800 ring-1 ring-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-800',
  in_progress:      'bg-green-100 text-green-900 ring-1 ring-green-600 animate-pulse dark:bg-green-950/60 dark:text-green-300 dark:ring-green-700',
  needs_completion: 'bg-orange-100 text-orange-900 ring-1 ring-orange-500 animate-pulse dark:bg-orange-950/60 dark:text-orange-300 dark:ring-orange-700',
  completed:        'bg-gray-100 text-gray-700 ring-1 ring-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600',
  complete:         'bg-gray-100 text-gray-700 ring-1 ring-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600',
  invoiced:         'bg-gray-100 text-gray-700 ring-1 ring-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600',
  cancelled:        'bg-gray-100 text-gray-500 ring-1 ring-gray-300 opacity-60 dark:bg-gray-800 dark:text-gray-500 dark:ring-gray-700',
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

  // Never override human-set final statuses
  if (s === 'completed' || s === 'complete' || s === 'invoiced' || s === 'cancelled') return s
  if (!job.scheduled_date) return s

  const now = new Date()
  // en-CA → YYYY-MM-DD in the browser's local timezone
  const todayStr = now.toLocaleDateString('en-CA')
  const dateOnly = job.scheduled_date.slice(0, 10)

  // Multi-day
  if (job.is_multi_day && job.end_date) {
    const endDateOnly = job.end_date.slice(0, 10)
    if (todayStr < dateOnly) return 'scheduled'
    if (todayStr > endDateOnly) return 'needs_completion'
    return 'in_progress'
  }

  // Different calendar day from today
  if (dateOnly < todayStr) return 'needs_completion'
  if (dateOnly > todayStr) return 'scheduled'

  // Same day: compare minutes-of-day, never parse times through Date() to avoid tz bugs
  if (!job.start_time) return 'in_progress'

  const [sh, sm] = job.start_time.slice(0, 5).split(':').map((x) => parseInt(x, 10) || 0)
  const startTotal = sh * 60 + sm

  let endTotal: number
  if (job.end_time) {
    const [eh, em] = job.end_time.slice(0, 5).split(':').map((x) => parseInt(x, 10) || 0)
    endTotal = eh * 60 + em
  } else {
    endTotal = startTotal + 60
  }

  const nowTotal = now.getHours() * 60 + now.getMinutes()
  if (nowTotal < startTotal) return 'scheduled'
  if (nowTotal <= endTotal) return 'in_progress'
  return 'needs_completion'
}

export function jobStatusLabel(status: string, fr: boolean): string {
  const labels: Record<string, { fr: string; en: string }> = {
    scheduled:        { fr: 'Planifiée',     en: 'Scheduled' },
    in_progress:      { fr: 'En cours',       en: 'In progress' },
    needs_completion: { fr: 'À compléter',    en: 'Needs completion' },
    completed:        { fr: 'Complétée',      en: 'Completed' },
    complete:         { fr: 'Complétée',      en: 'Completed' },
    invoiced:         { fr: 'Complétée',      en: 'Completed' }, // visually treated as completed
    cancelled:        { fr: 'Annulée',        en: 'Cancelled' },
  }
  const l = labels[status]
  if (!l) return status
  return fr ? l.fr : l.en
}
