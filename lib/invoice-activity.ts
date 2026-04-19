import type { SupabaseClient } from '@supabase/supabase-js'

export async function logInvoiceActivity(
  sb: SupabaseClient,
  invoiceId: string,
  orgId: string,
  eventType: string,
  eventData?: Record<string, unknown>,
) {
  try {
    await sb.from('invoice_activity').insert({
      invoice_id: invoiceId,
      org_id: orgId,
      event_type: eventType,
      event_data: eventData || {},
    })
  } catch {
    /* non-blocking */
  }
}
