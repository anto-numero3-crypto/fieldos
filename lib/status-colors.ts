export interface StatusColorSet {
  hex: string
  bg: string
  text: string
  border: string
  darkBg: string
  darkText: string
  label: { fr: string; en: string }
}

export const JOB_COLORS: Record<string, StatusColorSet> = {
  scheduled: {
    hex: '#2563eb',
    bg: 'bg-blue-100',
    text: 'text-blue-900',
    border: 'border-blue-600',
    darkBg: 'dark:bg-blue-950',
    darkText: 'dark:text-blue-200',
    label: { fr: 'Planifiée', en: 'Scheduled' },
  },
  in_progress: {
    hex: '#16a34a',
    bg: 'bg-green-100',
    text: 'text-green-900',
    border: 'border-green-600',
    darkBg: 'dark:bg-green-950',
    darkText: 'dark:text-green-200',
    label: { fr: 'En cours', en: 'In progress' },
  },
  needs_completion: {
    hex: '#ea580c',
    bg: 'bg-orange-100',
    text: 'text-orange-900',
    border: 'border-orange-600',
    darkBg: 'dark:bg-orange-950',
    darkText: 'dark:text-orange-200',
    label: { fr: 'À compléter', en: 'Needs completion' },
  },
  completed: {
    hex: '#9ca3af',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-400',
    darkBg: 'dark:bg-gray-800',
    darkText: 'dark:text-gray-300',
    label: { fr: 'Complétée', en: 'Completed' },
  },
  complete: {
    hex: '#9ca3af',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-400',
    darkBg: 'dark:bg-gray-800',
    darkText: 'dark:text-gray-300',
    label: { fr: 'Complétée', en: 'Completed' },
  },
  invoiced: {
    hex: '#9ca3af',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-400',
    darkBg: 'dark:bg-gray-800',
    darkText: 'dark:text-gray-300',
    label: { fr: 'Complétée', en: 'Completed' },
  },
  cancelled: {
    hex: '#d1d5db',
    bg: 'bg-gray-50',
    text: 'text-gray-400',
    border: 'border-gray-300',
    darkBg: 'dark:bg-gray-900',
    darkText: 'dark:text-gray-500',
    label: { fr: 'Annulée', en: 'Cancelled' },
  },
}

export const INVOICE_COLORS: Record<string, Omit<StatusColorSet, 'border' | 'darkBg' | 'darkText'> & Partial<Pick<StatusColorSet, 'border' | 'darkBg' | 'darkText'>>> = {
  draft: {
    hex: '#9ca3af',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    label: { fr: 'Brouillon', en: 'Draft' },
  },
  sent: {
    hex: '#2563eb',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: { fr: 'Envoyée', en: 'Sent' },
  },
  unpaid: {
    hex: '#f59e0b',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    label: { fr: 'En attente', en: 'Pending' },
  },
  overdue: {
    hex: '#dc2626',
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: { fr: 'En retard', en: 'Overdue' },
  },
  paid: {
    hex: '#16a34a',
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: { fr: 'Payée', en: 'Paid' },
  },
  cancelled: {
    hex: '#9ca3af',
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    label: { fr: 'Annulée', en: 'Cancelled' },
  },
}

// Common accent colors used across the platform (KPIs, charts, trends)
export const ACCENT = {
  indigo: '#4f46e5',
  emerald: '#10b981',
  blue: '#2563eb',
  violet: '#7c3aed',
  amber: '#f59e0b',
  red: '#dc2626',
  green: '#16a34a',
  gray: '#6b7280',
}
