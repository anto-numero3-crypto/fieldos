export type ModuleKey = 'recurring_contracts' | 'team_management' | 'time_tracking' | 'quickbooks'

export interface Module {
  key: ModuleKey
  name: { fr: string; en: string }
  description: { fr: string; en: string }
  icon: string // lucide-react icon name
  requiredPlan: 'pro' | 'croissance'
  requiresModule?: ModuleKey
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
    key: 'team_management',
    name: { fr: "Gestion d'équipe", en: 'Team management' },
    description: { fr: 'Invitez des employés, assignez des interventions et gérez les accès.', en: 'Invite employees, assign jobs and manage access.' },
    icon: 'Users',
    requiredPlan: 'pro',
    category: 'operations',
  },
  {
    key: 'time_tracking',
    name: { fr: 'Suivi du temps', en: 'Time tracking' },
    description: { fr: 'Poinçonnage mobile et feuilles de temps automatiques pour vos employés.', en: 'Mobile punch in/out and automatic timesheets for your employees.' },
    icon: 'Clock',
    requiredPlan: 'pro',
    requiresModule: 'team_management',
    category: 'operations',
  },
  {
    key: 'quickbooks',
    name: { fr: 'QuickBooks Online', en: 'QuickBooks Online' },
    description: { fr: 'Synchronisez vos factures et paiements avec QuickBooks Online automatiquement.', en: 'Automatically sync your invoices and payments with QuickBooks Online.' },
    icon: 'BookOpen',
    requiredPlan: 'pro',
    category: 'integrations',
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
  if (mod.requiresModule && enabledModules?.[mod.requiresModule] !== true) {
    const dep = MODULES.find(m => m.key === mod.requiresModule)
    return { allowed: false, reason: { fr: `Nécessite le module \u00ab ${dep?.name.fr} \u00bb`, en: `Requires "${dep?.name.en}" module` } }
  }
  return { allowed: true }
}

// Get dependents of a module (modules that require it)
export function getDependents(key: ModuleKey): ModuleKey[] {
  return MODULES.filter(m => m.requiresModule === key).map(m => m.key)
}
