import { NextRequest, NextResponse } from 'next/server'
import { sendPlanEmail, type PlanEmailType } from '@/lib/plan-emails'

// Thin wrapper so client pages (signup) can trigger lifecycle emails
// without exposing RESEND_API_KEY.
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    type?: PlanEmailType
    to?: string
    name?: string
    planLabel?: string
    planPrice?: string
    nextBilling?: string
    daysLeft?: number
  }
  if (!body.type || !body.to) {
    return NextResponse.json({ error: 'Missing type or to' }, { status: 400 })
  }
  // Only allow client-safe types; lifecycle events from Stripe go via webhook.
  const allowed: PlanEmailType[] = ['welcome_trial']
  if (!allowed.includes(body.type)) {
    return NextResponse.json({ error: 'Forbidden email type' }, { status: 403 })
  }
  await sendPlanEmail(body.type, { to: body.to, name: body.name })
  return NextResponse.json({ success: true })
}
