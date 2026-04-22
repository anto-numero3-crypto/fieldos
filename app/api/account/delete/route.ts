import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser } from '@/lib/supabase-server'

const USER_SCOPED_TABLES = [
  'audit_log',
  'availability_overrides',
  'availability_schedule',
  'availability_settings',
  'booking_requests',
  'customer_notes',
  'customers',
  'invoices',
  'jobs',
  'notifications',
  'payments',
  'profiles',
  'promo_code_attempts',
  'promo_code_redemptions',
  'quotes',
  'services',
  'team_members',
]

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (body.confirmation !== 'SUPPRIMER') {
    return NextResponse.json({ error: 'Confirmation invalide' }, { status: 400 })
  }

  const admin = adminClient()
  const errors: string[] = []

  for (const table of USER_SCOPED_TABLES) {
    const { error } = await admin.from(table).delete().eq('user_id', user.id)
    if (error && !/column .* does not exist/i.test(error.message)) {
      errors.push(`${table}: ${error.message}`)
    }
  }

  const { error: orgErr } = await admin.from('organizations').delete().eq('owner_user_id', user.id)
  if (orgErr) errors.push(`organizations: ${orgErr.message}`)

  const { error: authErr } = await admin.auth.admin.deleteUser(user.id)
  if (authErr) {
    return NextResponse.json({ error: `Auth deletion failed: ${authErr.message}`, dataErrors: errors }, { status: 500 })
  }

  if (user.email) {
    try {
      const origin = req.headers.get('origin') || new URL(req.url).origin
      await fetch(`${origin}/api/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: 'Votre compte Gestivio a été supprimé / Your Gestivio account has been deleted',
          body: `Votre compte Gestivio et toutes les données associées ont été supprimés définitivement. Si ce n'était pas vous, contactez-nous immédiatement à support@gestivio.ca.\n\nYour Gestivio account and all associated data have been permanently deleted. If this wasn't you, contact us immediately at support@gestivio.ca.`,
        }),
      })
    } catch {
      // Non-fatal — account is already deleted
    }
  }

  return NextResponse.json({ success: true, dataErrors: errors })
}
