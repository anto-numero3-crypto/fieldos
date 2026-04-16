export type InvoiceDisplayStatus = 'paid' | 'draft' | 'cancelled' | 'overdue' | 'unpaid' | 'sent'

export function getInvoiceDisplayStatus(invoice: {
  status: string | null | undefined
  due_date?: string | null
  paid_at?: string | null
}): InvoiceDisplayStatus {
  const s = invoice.status || 'unpaid'
  if (s === 'paid') return 'paid'
  if (s === 'draft') return 'draft'
  if (s === 'cancelled') return 'cancelled'

  if (invoice.due_date && !invoice.paid_at) {
    const due = new Date(invoice.due_date)
    if (due.getTime() < Date.now()) return 'overdue'
  }

  if (s === 'overdue') return 'overdue'
  if (s === 'sent') return 'sent'
  return 'unpaid'
}

export const INVOICE_STATUS_CLS: Record<InvoiceDisplayStatus, string> = {
  paid:      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900',
  unpaid:    'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900',
  sent:      'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900',
  overdue:   'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900 animate-pulse',
  draft:     'bg-gray-100 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700',
  cancelled: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200 line-through dark:bg-gray-800 dark:text-gray-500 dark:ring-gray-700',
}

export function invoiceStatusLabel(status: InvoiceDisplayStatus, fr: boolean): string {
  const labels: Record<InvoiceDisplayStatus, { fr: string; en: string }> = {
    paid:      { fr: 'Payée',     en: 'Paid' },
    unpaid:    { fr: 'En attente', en: 'Pending' },
    sent:      { fr: 'Envoyée',   en: 'Sent' },
    overdue:   { fr: 'En retard', en: 'Overdue' },
    draft:     { fr: 'Brouillon', en: 'Draft' },
    cancelled: { fr: 'Annulée',   en: 'Cancelled' },
  }
  return fr ? labels[status].fr : labels[status].en
}
