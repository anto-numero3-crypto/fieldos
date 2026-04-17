export type PlanName = 'demarrage' | 'pro' | 'croissance'
export type PlanStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'

export interface PlanLimits {
  // Hard limits (Infinity = unlimited)
  maxUsers: number
  maxCustomers: number
  maxJobsPerMonth: number
  maxAIMessages: number
  // Feature flags
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
  // Tier-gated features from the 2026 pricing redesign
  csvExport: boolean
  multiDayJobs: boolean
  fullReports: boolean
  completionNotifications: boolean
  showGestivioBranding: boolean
  availableModules: string[]
}

// Canonical plan limits keyed by the new 2026 names.
// `demarrage` (Starter) / `pro` / `croissance` (Growth).
export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  demarrage: {
    maxUsers: 1,
    maxCustomers: 50,
    maxJobsPerMonth: 25,
    maxAIMessages: 30,
    hasTeamManagement: false,
    hasBookingPortal: true,
    hasCustomBranding: false,
    hasAnalytics: false,
    hasAutomatedReminders: false,
    hasCampaigns: false,
    hasMultipleLocations: false,
    hasWhiteLabel: false,
    hasSMS: false,
    hasAdvancedAutomation: false,
    hasQuickBooksExport: false,
    csvExport: false,
    multiDayJobs: false,
    fullReports: false,
    completionNotifications: false,
    showGestivioBranding: true,
    availableModules: [],
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
    csvExport: true,
    multiDayJobs: true,
    fullReports: true,
    completionNotifications: true,
    showGestivioBranding: false,
    availableModules: ['recurring_contracts', 'team_management', 'time_tracking'],
  },
  croissance: {
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
    csvExport: true,
    multiDayJobs: true,
    fullReports: true,
    completionNotifications: true,
    showGestivioBranding: false,
    availableModules: ['recurring_contracts', 'team_management', 'time_tracking'],
  },
}

// Pricing for the 3 tiers (monthly + 10%-off annual).
// `annualTotal` is what Stripe charges up-front on the yearly plan.
export const PLAN_PRICING = {
  demarrage:  { monthly: 39,  annual: 35,  annualTotal: 420,  label: 'Démarrage', labelEn: 'Starter', tagline: "Pour lancer votre activité",             taglineEn: 'To get your business started' },
  pro:        { monthly: 79,  annual: 71,  annualTotal: 852,  label: 'Pro',        labelEn: 'Pro',     tagline: "Tout ce qu'il vous faut pour grandir",  taglineEn: 'Everything you need to grow' },
  croissance: { monthly: 149, annual: 134, annualTotal: 1608, label: 'Croissance', labelEn: 'Growth',  tagline: 'Pour les entreprises établies',         taglineEn: 'For established businesses' },
} as const

// Normalize legacy plan names ('starter'/'basic' → 'demarrage',
// 'business'/'studio' → 'croissance') so older data keeps working
// while the DB migration runs.
export function normalizePlan(plan: string | null | undefined): PlanName {
  if (!plan) return 'demarrage'
  const p = String(plan).toLowerCase()
  if (p === 'pro') return 'pro'
  if (p === 'croissance' || p === 'business' || p === 'studio') return 'croissance'
  return 'demarrage' // starter, basic, demarrage, unknown
}

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[normalizePlan(plan)]
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
  | 'csvExport'
  | 'multiDayJobs'
  | 'fullReports'
  | 'completionNotifications'

export function isFeatureAvailable(plan: string | null | undefined, feature: FeatureFlag): boolean {
  return getPlanLimits(plan)[feature] === true
}

// First plan (in priority order) that unlocks a given feature.
export function requiredPlanFor(feature: FeatureFlag): PlanName {
  if (PLAN_LIMITS.pro[feature]) return 'pro'
  return 'croissance'
}

export function getPlanDisplayName(plan: string | null | undefined, lang: string): string {
  const n = normalizePlan(plan)
  const p = PLAN_PRICING[n]
  return lang === 'fr' ? p.label : p.labelEn
}

export function daysUntil(date: string | Date | null | undefined): number {
  if (!date) return 0
  const ms = new Date(date).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}
