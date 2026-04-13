#!/usr/bin/env node
/* eslint-disable no-console */
// Seed the default Gestivio promo codes.
//
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
//   node scripts/create-promo-codes.js
//
// Idempotent: uses upsert on `code` — safe to re-run. Does NOT reset
// uses_count for codes that already exist.

const { createClient } = require('@supabase/supabase-js')

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(URL, KEY)

const PROMO_CODES = [
  { code: 'GESTIVIO-BETA',    plan: 'business', duration_days: 90,  max_uses: 50,  description: 'Beta tester — 90 days Business plan' },
  { code: 'GESTIVIO-DEMO',    plan: 'business', duration_days: 30,  max_uses: 100, description: 'Demo account — 30 days Business plan' },
  { code: 'GESTIVIO-PARTNER', plan: 'business', duration_days: 365, max_uses: 10,  description: 'Partner account — 1 year Business plan' },
  { code: 'GESTIVIO-VIP',     plan: 'business', duration_days: 365, max_uses: 5,   description: 'VIP — 1 year Business plan' },
]

;(async () => {
  for (const c of PROMO_CODES) {
    const { data: existing } = await supabase
      .from('promo_codes')
      .select('id, uses_count')
      .eq('code', c.code)
      .maybeSingle()

    if (existing) {
      // Preserve uses_count; update everything else.
      const { error } = await supabase
        .from('promo_codes')
        .update({
          plan: c.plan,
          duration_days: c.duration_days,
          max_uses: c.max_uses,
          description: c.description,
          is_active: true,
        })
        .eq('id', existing.id)
      if (error) console.error(`✗ ${c.code}: ${error.message}`)
      else       console.log(`↻ ${c.code} updated (${existing.uses_count}/${c.max_uses} uses)`)
    } else {
      const { error } = await supabase
        .from('promo_codes')
        .insert({ ...c, is_active: true, created_by: 'seed-script' })
      if (error) console.error(`✗ ${c.code}: ${error.message}`)
      else       console.log(`✓ ${c.code} created`)
    }
  }
  console.log('\nDone.')
})().catch((err) => { console.error(err); process.exit(1) })
