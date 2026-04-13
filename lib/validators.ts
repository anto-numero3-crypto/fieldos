// Shared form validators + error copy. All messages in Quebec French.
// Return an error string, or empty string when valid.

export const ERR = {
  required: 'Ce champ est obligatoire',
  email:    'Adresse courriel invalide',
  phone:    'Numéro de téléphone invalide',
  pwdShort: 'Minimum 8 caractères',
  pwdMatch: 'Les mots de passe ne correspondent pas',
  amount:   'Montant invalide',
  integer:  'Nombre entier requis',
  terms:    'Vous devez accepter les conditions',
  url:      'Adresse web invalide',
  postal:   'Code postal invalide',
} as const

export function validateRequired(v: string | null | undefined): string {
  return v && String(v).trim() ? '' : ERR.required
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export function validateEmail(v: string, required = true): string {
  const s = (v || '').trim()
  if (!s) return required ? ERR.required : ''
  return EMAIL_RE.test(s) ? '' : ERR.email
}

// North-American-friendly: accepts 10 digits, with or without +1,
// spaces/dots/hyphens/parens.
const PHONE_RE = /^[+]?[\d\s().-]{10,}$/
export function validatePhone(v: string, required = false): string {
  const s = (v || '').trim()
  if (!s) return required ? ERR.required : ''
  // Extract just the digits and require 10–15
  const digits = s.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return ERR.phone
  return PHONE_RE.test(s) ? '' : ERR.phone
}

export function validatePassword(v: string, required = true): string {
  if (!v && !required) return ''
  if (!v) return ERR.required
  if (v.length < 8) return ERR.pwdShort
  return ''
}

export function validatePasswordMatch(a: string, b: string): string {
  if (!b) return ERR.required
  return a === b ? '' : ERR.pwdMatch
}

export function validateAmount(v: string | number, required = true): string {
  if (v === '' || v === null || v === undefined) return required ? ERR.required : ''
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) return ERR.amount
  return ''
}

export function validateInteger(v: string | number, required = true, min?: number): string {
  if (v === '' || v === null || v === undefined) return required ? ERR.required : ''
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isInteger(n)) return ERR.integer
  if (min !== undefined && n < min) return ERR.integer
  return ''
}

// Canadian postal code loose check (A1A 1A1)
const POSTAL_RE = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/
export function validatePostal(v: string, required = false): string {
  const s = (v || '').trim()
  if (!s) return required ? ERR.required : ''
  return POSTAL_RE.test(s) ? '' : ERR.postal
}

export function validateUrl(v: string, required = false): string {
  const s = (v || '').trim()
  if (!s) return required ? ERR.required : ''
  try {
    const url = new URL(s.match(/^https?:\/\//) ? s : `https://${s}`)
    return url.hostname.includes('.') ? '' : ERR.url
  } catch { return ERR.url }
}

// Utility: true if all validators returned empty strings.
export function allValid(errors: Record<string, string>): boolean {
  return Object.values(errors).every((e) => !e)
}

// Shared input class helpers so every form uses the same red-border styling.
export const inputBase =
  'block w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all'
export const inputOk =
  'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
export const inputErr =
  'border-red-300 focus:border-red-500 focus:ring-red-500/20'

export function inputCls(hasError: boolean): string {
  return `${inputBase} ${hasError ? inputErr : inputOk}`
}
