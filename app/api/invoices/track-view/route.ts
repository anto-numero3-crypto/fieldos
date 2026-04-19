import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase-server'
import { logInvoiceActivity } from '@/lib/invoice-activity'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { token?: string } | null
  if (!body?.token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const supabase = adminClient()

  // Look up invoice by token
  const { data: invoice, error: fetchErr } = await supabase
    .from('invoices')
    .select('id, user_id, viewed_count, viewed_at')
    .eq('token', body.token)
    .maybeSingle()

  if (fetchErr || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const currentCount = invoice.viewed_count || 0
  const isFirstView = !invoice.viewed_at

  // Update view tracking on the invoice
  const updates: Record<string, unknown> = {
    viewed_count: currentCount + 1,
  }
  if (isFirstView) {
    updates.viewed_at = new Date().toISOString()
  }

  await supabase
    .from('invoices')
    .update(updates)
    .eq('id', invoice.id)

  // Resolve org_id for activity log
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_user_id', invoice.user_id)
    .maybeSingle()

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  if (org) {
    await logInvoiceActivity(supabase, invoice.id, org.id, 'viewed', {
      ip,
      user_agent: userAgent,
      view_number: currentCount + 1,
      first_view: isFirstView,
    })
  }

  return NextResponse.json({ ok: true })
}
