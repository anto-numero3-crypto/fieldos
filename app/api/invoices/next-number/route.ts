import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const supabase = adminClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('invoice_prefix, invoice_next_number')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  const prefix = org?.invoice_prefix || 'FAC'
  const nextNum = org?.invoice_next_number || 1

  const number = `${prefix}-${String(nextNum).padStart(4, '0')}`

  return NextResponse.json({ number, prefix, next_number: nextNum })
}
