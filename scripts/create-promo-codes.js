#!/usr/bin/env node
/* eslint-disable no-console */
// Seed Gestivio promo codes with cryptographically secure, unguessable codes.
//
// Usage:
//   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   node scripts/create-promo-codes.js
//
// On each run:
// 1. Deletes any legacy "GESTIVIO-*" simple codes that match the old format.
// 2. Generates fresh secure codes (PREFIX-XXXXXX-XXXXXX).
// 3. Inserts them into promo_codes.
// 4. Prints each code inside a box — copy and store in 1Password/Bitwarden.
//    Once you leave the terminal, the codes are only recoverable from the DB
//    (which is the point — treat them as credentials).

const { createClient } = require('@supabase/supabase-js')
const { randomInt } = require('crypto')

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}
const supabase = createClient(URL, KEY)

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const segment = () => Array.from({ length: 6 }, () => ALPHABET[randomInt(0, ALPHABET.length)]).join('')
const generate = (prefix) => `${prefix}-${segment()}-${segment()}`

const TEMPLATES = [
  { prefix: 'BETA',    code_type: 'full_access',     plan: 'business', duration_days: 90,   max_uses: 50,  description: 'Beta tester — 90 days Business', label: 'BETA TESTER — 90 days Business — 50 uses' },
  { prefix: 'DEMO',    code_type: 'full_access',     plan: 'business', duration_days: 30,   max_uses: 100, description: 'Demo account — 30 days Business', label: 'DEMO ACCOUNT — 30 days Business — 100 uses' },
  { prefix: 'VIP',     code_type: 'lifetime',        plan: 'business', duration_days: null, max_uses: 5,   description: 'VIP — lifetime Business',          label: 'VIP — lifetime Business — 5 uses' },
  { prefix: 'PARTNER', code_type: 'lifetime',        plan: 'business', duration_days: null, max_uses: 10,  description: 'Partner — lifetime Business',      label: 'PARTNER — lifetime Business — 10 uses' },
  { prefix: 'EXTEND',  code_type: 'trial_extension', plan: 'pro',      duration_days: 30,   max_uses: 200, description: 'Trial extension — 30 extra days Pro', label: 'TRIAL EXTENSION — 30 extra days Pro — 200 uses' },
]

function printBoxed(label, code) {
  const lines = [`  ${label}  `, `  ${code}  `]
  const width = Math.max(...lines.map((l) => l.length)) + 2
  const pad = (s) => s + ' '.repeat(width - s.length)
  const border = '═'.repeat(width)
  console.log(`\n╔${border}╗`)
  console.log(`║${pad(lines[0])}║`)
  console.log(`║${pad(lines[1])}║`)
  console.log(`╚${border}╝`)
}

;(async () => {
  // 1. Remove legacy simple codes so they can't be brute-forced.
  const { error: delError, count: removed } = await supabase
    .from('promo_codes')
    .delete({ count: 'exact' })
    .like('code', 'GESTIVIO-%')
  if (delError) console.warn('⚠︎ delete of legacy GESTIVIO-* codes failed:', delError.message)
  else console.log(`✓ Removed ${removed ?? 0} legacy GESTIVIO-* codes`)

  // 2. Generate + insert
  for (const tpl of TEMPLATES) {
    const code = generate(tpl.prefix)
    const { error } = await supabase.from('promo_codes').insert({
      code,
      code_type: tpl.code_type,
      plan: tpl.plan,
      duration_days: tpl.duration_days,
      max_uses: tpl.max_uses,
      description: tpl.description,
      is_active: true,
      created_by: 'seed-script',
      created_by_admin: 'cli',
    })
    if (error) {
      console.error(`✗ ${tpl.prefix}: ${error.message}`)
      continue
    }
    printBoxed(tpl.label, code)
  }

  console.log('\n✓ Done. Copy the codes above to your password manager.')
  console.log('  They are stored in the DB and visible to anyone with service-role access.')
  console.log('  Treat them as credentials.')
})().catch((err) => { console.error(err); process.exit(1) })
