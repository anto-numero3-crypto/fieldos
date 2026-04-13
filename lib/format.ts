// Locale-aware formatters. Use everywhere we render dates / money / numbers.
//
//   import { fmtDate, fmtMoney, fmtNumber } from '@/lib/format'
//   fmtDate('2026-04-13', 'fr')        → '13 avril 2026'
//   fmtDate('2026-04-13', 'fr', 'short') → '13 avr. 2026'
//   fmtMoney(1234.56, 'fr')             → '1 234,56 $'
//   fmtMoney(1234.56, 'en')             → '$1,234.56'
//   fmtNumber(1234, 'fr')               → '1 234'
//   fmtNumber(1234, 'en')               → '1,234'

export type Lang = 'en' | 'fr'

const LOCALE: Record<Lang, string> = { en: 'en-CA', fr: 'fr-CA' }

export function fmtDate(
  input: string | Date | null | undefined,
  lang: Lang = 'fr',
  variant: 'long' | 'short' | 'numeric' = 'long',
): string {
  if (!input) return ''
  // YYYY-MM-DD strings should not get UTC-shifted by Date(); add midday.
  const d = typeof input === 'string'
    ? (input.length === 10 ? new Date(input + 'T12:00:00') : new Date(input))
    : input
  if (isNaN(d.getTime())) return ''
  const opts: Intl.DateTimeFormatOptions =
    variant === 'numeric' ? { year: 'numeric', month: '2-digit', day: '2-digit' }
    : variant === 'short' ? { year: 'numeric', month: 'short', day: 'numeric' }
    :                        { year: 'numeric', month: 'long', day: 'numeric' }
  return new Intl.DateTimeFormat(LOCALE[lang], opts).format(d)
}

export function fmtTime(
  input: string | Date | null | undefined,
  lang: Lang = 'fr',
): string {
  if (!input) return ''
  // 'HH:MM' or 'HH:MM:SS'
  if (typeof input === 'string' && /^\d{2}:\d{2}/.test(input)) {
    const [h, m] = input.split(':').map(Number)
    if (lang === 'en') {
      const ampm = h >= 12 ? 'PM' : 'AM'
      const hh = h % 12 || 12
      return `${hh}:${String(m).padStart(2, '0')} ${ampm}`
    }
    return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`
  }
  const d = typeof input === 'string' ? new Date(input) : input
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(LOCALE[lang], { hour: '2-digit', minute: '2-digit' }).format(d)
}

export function fmtMoney(
  amount: number | string | null | undefined,
  lang: Lang = 'fr',
  currency: string = 'CAD',
): string {
  if (amount === null || amount === undefined || amount === '') return ''
  const n = typeof amount === 'number' ? amount : Number(String(amount).replace(',', '.'))
  if (!Number.isFinite(n)) return ''
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function fmtNumber(
  value: number | null | undefined,
  lang: Lang = 'fr',
  fractionDigits: number = 0,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return ''
  return new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

// Compact relative time. Uses Intl.RelativeTimeFormat where available.
export function fmtRelativeTime(date: string | Date, lang: Lang = 'fr'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const seconds = Math.round((d.getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  const rtf = new Intl.RelativeTimeFormat(LOCALE[lang], { numeric: 'auto' })
  if (abs < 60) return rtf.format(Math.round(seconds), 'second')
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour')
  if (abs < 30 * 86400) return rtf.format(Math.round(seconds / 86400), 'day')
  if (abs < 365 * 86400) return rtf.format(Math.round(seconds / (30 * 86400)), 'month')
  return rtf.format(Math.round(seconds / (365 * 86400)), 'year')
}
