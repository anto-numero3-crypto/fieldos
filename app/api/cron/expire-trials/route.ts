import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendPlanEmail } from '@/lib/plan-emails'

// Daily cron — expires trials past their deadline + sends the 3-day-warning
// email to trials expiring in 3 days.
//
// Protected by CRON_SECRET. Vercel's internal cron sends
// Authorization: Bearer $CRON_SECRET automatically when configured in
// vercel.json.

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // disabled locally
  const header = req.headers.get('authorization') || ''
  return header === `Bearer ${secret}`
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = adminClient()
  const now = new Date()

  // ── 1. Expire trials whose deadline has passed ─────────────────────
  const { data: expired } = await supabase
    .from('organizations')
    .select('id, owner_user_id, email, name')
    .eq('plan_status', 'trial')
    .lt('trial_ends_at', now.toISOString())

  let expiredCount = 0
  for (const org of expired || []) {
    await supabase
      .from('organizations')
      .update({ plan: 'starter', plan_status: 'expired' })
      .eq('id', org.id)
    if (org.email) {
      await sendPlanEmail('trial_expired', { to: org.email, name: org.name || undefined })
    }
    expiredCount++
  }

  // ── 2. Send 3-day-warning to trials ending in 3 days ──────────────
  const threeDaysFrom = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const threeDaysFromStart = new Date(threeDaysFrom); threeDaysFromStart.setUTCHours(0, 0, 0, 0)
  const threeDaysFromEnd   = new Date(threeDaysFrom); threeDaysFromEnd.setUTCHours(23, 59, 59, 999)

  const { data: warnings } = await supabase
    .from('organizations')
    .select('id, email, name, trial_ends_at')
    .eq('plan_status', 'trial')
    .gte('trial_ends_at', threeDaysFromStart.toISOString())
    .lte('trial_ends_at', threeDaysFromEnd.toISOString())

  let warningCount = 0
  for (const org of warnings || []) {
    if (org.email) {
      await sendPlanEmail('trial_ending_3d', { to: org.email, name: org.name || undefined, daysLeft: 3 })
      warningCount++
    }
  }

  // ── 3. Expire promo-code plans whose promo_expires_at has passed ───
  const { data: promoExpired } = await supabase
    .from('organizations')
    .select('id, owner_user_id, email, name')
    .eq('plan_status', 'active')
    .not('promo_code_id', 'is', null)
    .lt('promo_expires_at', now.toISOString())

  let promoExpiredCount = 0
  for (const org of promoExpired || []) {
    await supabase
      .from('organizations')
      .update({ plan: 'starter', plan_status: 'expired', promo_code_id: null, promo_expires_at: null })
      .eq('id', org.id)
    if (org.email) {
      // Reuse trial_expired template — copy is equivalent for "your access ended".
      await sendPlanEmail('trial_expired', { to: org.email, name: org.name || undefined })
    }
    promoExpiredCount++
  }

  return NextResponse.json({ expiredCount, warningCount, promoExpiredCount })
}
