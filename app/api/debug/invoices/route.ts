import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser } from '@/lib/supabase-server'

// Temporary diagnostic route. Remove when invoices issue is resolved.
export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  const supabase = adminClient()

  const { count: totalCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })

  const { data: sampleRow } = await supabase
    .from('invoices')
    .select('id, user_id, created_at')
    .limit(1)
    .maybeSingle()

  const { data: allForUser, count: userCount } = await supabase
    .from('invoices')
    .select('id, user_id, invoice_number, status, amount', { count: 'exact' })
    .eq('user_id', user?.id || '')
    .limit(5)

  return NextResponse.json({
    authedUserId: user?.id || null,
    authedUserEmail: user?.email || null,
    serviceRoleKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    totalInvoicesInDb: totalCount ?? 0,
    userInvoiceCount: userCount ?? 0,
    firstSampleRowUserId: sampleRow?.user_id ?? null,
    firstSampleRowUserIdType: sampleRow ? typeof sampleRow.user_id : null,
    recentForUser: allForUser || [],
  })
}
