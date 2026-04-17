import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthedUser(req)
    if (!user) return UNAUTHORIZED()

    const supabase = adminClient()

    await supabase
      .from('organizations')
      .update({
        stripe_connect_account_id: null,
        stripe_connect_charges_enabled: false,
        stripe_connect_payouts_enabled: false,
        stripe_connect_onboarding_complete: false,
      })
      .eq('owner_user_id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[stripe disconnect-connect]', err)
    return NextResponse.json({ error: 'Disconnect failed' }, { status: 500 })
  }
}
