export type PlanName = 'starter' | 'pro' | 'business'
export type PlanStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'

export interface PlanLimits {
  maxUsers: number
  maxCustomers: number        // Infinity = unlimited
  maxJobsPerMonth: number
  maxAIMessages: number
  hasTeamManagement: boolean
  hasBookingPortal: boolean
  hasCustomBranding: boolean
  hasAnalytics: boolean
  hasAutomatedReminders: boolean
  hasCampaigns: boolean
  hasMultipleLocations: boolean
  hasWhiteLabel: boolean
  hasSMS: boolean
  hasAdvancedAutomation: boolean
  hasQuickBooksExport: boolean
  showGestivioBranding: boolean
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  starter: {
    maxUsers: 1,
    maxCustomers: 50,
    maxJobsPerMonth: 30,
    maxAIMessages: 20,
    hasTeamManagement: false,
    hasBookingPortal: false,
    hasCustomBranding: false,
    hasAnalytics: false,
    hasAutomatedReminders: false,
    hasCampaigns: false,
    hasMultipleLocations: false,
    hasWhiteLabel: false,
    hasSMS: false,
    hasAdvancedAutomation: false,
    hasQuickBooksExport: false,
    showGestivioBranding: true,
  },
  pro: {
    maxUsers: 5,
    maxCustomers: Infinity,
    maxJobsPerMonth: Infinity,
    maxAIMessages: Infinity,
    hasTeamManagement: true,
    hasBookingPortal: true,
    hasCustomBranding: true,
    hasAnalytics: true,
    hasAutomatedReminders: true,
    hasCampaigns: true,
    hasMultipleLocations: false,
    hasWhiteLabel: false,
    hasSMS: false,
    hasAdvancedAutomation: false,
    hasQuickBooksExport: false,
    showGestivioBranding: false,
  },
  business: {
    maxUsers: 15,
    maxCustomers: Infinity,
    maxJobsPerMonth: Infinity,
    maxAIMessages: Infinity,
    hasTeamManagement: true,
    hasBookingPortal: true,
    hasCustomBranding: true,
    hasAnalytics: true,
    hasAutomatedReminders: true,
    hasCampaigns: true,
    hasMultipleLocations: true,
    hasWhiteLabel: true,
    hasSMS: true,
    hasAdvancedAutomation: true,
    hasQuickBooksExport: true,
    showGestivioBranding: false,
  },
}

export const PLAN_PRICING = {
  starter:  { monthly: 49,  annual: 39,  label: 'Starter',  tagline: 'Pour démarrer' },
  pro:      { monthly: 99,  annual: 79,  label: 'Pro',      tagline: 'Tout ce dont vous avez besoin' },
  business: { monthly: 179, annual: 143, label: 'Business', tagline: 'Pour les entreprises établies' },
} as const

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[(plan as PlanName)] || PLAN_LIMITS.starter
}

export type FeatureFlag =
  | 'hasTeamManagement'
  | 'hasBookingPortal'
  | 'hasCustomBranding'
  | 'hasAnalytics'
  | 'hasAutomatedReminders'
  | 'hasCampaigns'
  | 'hasMultipleLocations'
  | 'hasWhiteLabel'
  | 'hasSMS'
  | 'hasAdvancedAutomation'
  | 'hasQuickBooksExport'

export function isFeatureAvailable(plan: string | null | undefined, feature: FeatureFlag): boolean {
  return getPlanLimits(plan)[feature] === true
}

// First plan (in priority order) that unlocks a given feature.
export function requiredPlanFor(feature: FeatureFlag): PlanName {
  if (PLAN_LIMITS.pro[feature]) return 'pro'
  return 'business'
}

export function daysUntil(date: string | Date | null | undefined): number {
  if (!date) return 0
  const ms = new Date(date).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}
