import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getAuthedUser, UNAUTHORIZED } from '@/lib/supabase-server'
import { canEnableModule, getDependents, type ModuleKey } from '@/lib/modules'

const VALID_KEYS: ModuleKey[] = ['recurring_contracts', 'time_tracking']

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return UNAUTHORIZED()

  const body = await req.json().catch(() => null) as { module?: string; enabled?: boolean } | null
  if (!body || typeof body.module !== 'string' || typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const moduleKey = body.module as ModuleKey
  if (!VALID_KEYS.includes(moduleKey)) {
    return NextResponse.json({ error: 'Invalid module key' }, { status: 400 })
  }

  const supabase = adminClient()
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, plan, enabled_modules')
    .eq('owner_user_id', user.id)
    .single()

  if (orgErr || !org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const currentModules = (org.enabled_modules as Record<string, boolean>) || {}

  if (body.enabled) {
    const check = canEnableModule(currentModules, org.plan, moduleKey)
    if (!check.allowed) {
      return NextResponse.json({ error: 'Module cannot be enabled', reason: check.reason }, { status: 403 })
    }
  }

  const newModules: Record<string, boolean> = { ...currentModules, [moduleKey]: body.enabled }

  // If disabling, also disable dependents
  if (!body.enabled) {
    const dependents = getDependents(moduleKey)
    for (const dep of dependents) {
      newModules[dep] = false
    }
  }

  const { error: updateErr } = await supabase
    .from('organizations')
    .update({ enabled_modules: newModules })
    .eq('id', org.id)

  if (updateErr) {
    console.error('[modules/toggle] db error:', updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, enabled_modules: newModules })
}
