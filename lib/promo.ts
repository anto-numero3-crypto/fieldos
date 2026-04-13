import { randomInt } from 'crypto'

// Unambiguous alphabet — removes 0/O, 1/I/L that users confuse when typing.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const SEGMENT_LEN = 6

export function generateSecureCode(prefix: string): string {
  const p = prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  const segment = () => Array.from({ length: SEGMENT_LEN }, () => ALPHABET[randomInt(0, ALPHABET.length)]).join('')
  return `${p}-${segment()}-${segment()}`
}

// Normalize user input: uppercase, strip whitespace, trim hyphens.
export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '')
}

// Shape check: PREFIX-XXXXXX-XXXXXX where PREFIX is 1-20 alphanumeric
// and each segment is exactly 6 chars from our alphabet. Used as a cheap
// pre-DB guard.
const CODE_SHAPE = /^[A-Z0-9]{1,20}-[A-HJ-NP-Z2-9]{6}-[A-HJ-NP-Z2-9]{6}$/

export function isValidCodeShape(code: string): boolean {
  return CODE_SHAPE.test(code)
}

// Visible mask for admin UIs — keep prefix, hide segments.
export function maskCode(code: string): string {
  const parts = code.split('-')
  if (parts.length < 3) return '••••••'
  return `${parts[0]}-${'•'.repeat(SEGMENT_LEN)}-${'•'.repeat(SEGMENT_LEN)}`
}
