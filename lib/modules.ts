export type ModuleKey = 'recurring_contracts' | 'time_tracking'

export interface Module {
  key: ModuleKey
  name: { fr: string; en: string }
  description: { fr: string; en: string }
  icon: string
  requiredPlan: 'pro' | 'croissance'
  category: 'operations' | 'integrations'
}

export const MODULES: Module[] = [
  {
    key: 'recurring_contracts',
    name: { fr: 'Contrats récurrents', en: 'Recurring contracts' },
    description: { fr: 'Gérez des contrats saisonniers et générez des interventions récurrentes automatiquement.', en: 'Manage seasonal contracts and automatically generate recurring jobs.' },
    icon: 'FileText',
    requiredPlan: 'pro',
    category: 'operations',
  },
  {
    key: 'time_tracking',
    name: { fr: 'Suivi du temps', en: 'Time tracking' },
    description: { fr: 'Poinçonnage mobile et feuilles de temps automatiques pour vos employés.', en: 'Mobile punch in/out and automatic timesheets for your employees.' },
    icon: 'Clock',
    requiredPlan: 'pro',
    category: 'operations',
  },
]

export function isModuleEnabled(
  enabledModules: Record<string, boolean> | null | undefined,
  plan: string | null | undefined,
  key: ModuleKey
): boolean {
  const mod = MODULES.find(m => m.key === key)
  if (!mod) return false
  const planOrder = ['demarrage', 'pro', 'croissance']
  const p = String(plan || '').toLowerCase()
  const orgPlan = p === 'pro' ? 'pro' : (p === 'croissance' || p === 'business') ? 'croissance' : 'demarrage'
  if (planOrder.indexOf(orgPlan) < planOrder.indexOf(mod.requiredPlan)) return false
  return enabledModules?.[key] === true
}

export function canEnableModule(
  enabledModules: Record<string, boolean> | null | undefined,
  plan: string | null | undefined,
  key: ModuleKey
): { allowed: boolean; reason?: { fr: string; en: string } } {
  const mod = MODULES.find(m => m.key === key)
  if (!mod) return { allowed: false }
  const planOrder = ['demarrage', 'pro', 'croissance']
  const p = String(plan || '').toLowerCase()
  const orgPlan = p === 'pro' ? 'pro' : (p === 'croissance' || p === 'business') ? 'croissance' : 'demarrage'
  if (planOrder.indexOf(orgPlan) < planOrder.indexOf(mod.requiredPlan)) {
    return { allowed: false, reason: { fr: `Disponible avec le plan ${mod.requiredPlan === 'pro' ? 'Pro' : 'Croissance'}`, en: `Available with ${mod.requiredPlan === 'pro' ? 'Pro' : 'Growth'} plan` } }
  }
  return { allowed: true }
}

export function getDependents(key: ModuleKey): ModuleKey[] {
  return []
}
