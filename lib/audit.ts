import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout'

export async function writeAuditLog({
  userId,
  action,
  resourceType,
  resourceId,
  details,
}: {
  userId: string
  action: AuditAction
  resourceType: string
  resourceId?: string
  details?: Record<string, unknown>
}) {
  try {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId || null,
      details: details || null,
      created_at: new Date().toISOString(),
    })
  } catch {
    // Audit log failures should never break the main flow
  }
}
