'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../app/supabase'
import {
  getPlanLimits,
  isFeatureAvailable,
  type FeatureFlag,
  type PlanLimits,
  type PlanName,
  type PlanStatus,
  daysUntil,
} from '../plan-limits'

interface PlanInfo {
  plan: PlanName
  status: PlanStatus
  trialEndsAt: string | null
  trialDaysLeft: number
  nextBillingAt: string | null
  limits: PlanLimits
  // Usage counters (pulled from org row)
  customerCount: number
  aiMessagesThisMonth: number
  teamMemberCount: number
  loading: boolean
  isFeatureAvailable: (f: FeatureFlag) => boolean
  isAtCustomerLimit: boolean
  isAtAIMessageLimit: boolean
  isAtTeamLimit: boolean
  refresh: () => Promise<void>
}

const DEFAULT: PlanInfo = {
  plan: 'starter',
  status: 'trial',
  trialEndsAt: null,
  trialDaysLeft: 0,
  nextBillingAt: null,
  limits: getPlanLimits('starter'),
  customerCount: 0,
  aiMessagesThisMonth: 0,
  teamMemberCount: 0,
  loading: true,
  isFeatureAvailable: () => false,
  isAtCustomerLimit: false,
  isAtAIMessageLimit: false,
  isAtTeamLimit: false,
  refresh: async () => {},
}

// Per-page cache so the hook doesn't hit Supabase on every mount.
let cached: PlanInfo | null = null

export function usePlan(): PlanInfo {
  const [info, setInfo] = useState<PlanInfo>(cached || DEFAULT)

  const load = async () => {
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return

    const { data: org } = await supabase
      .from('organizations')
      .select('plan, plan_status, trial_ends_at, next_billing_at, ai_messages_this_month')
      .eq('owner_user_id', user.id)
      .single()

    // Counts — keep them cheap (head + count only)
    const [custRes, teamRes] = await Promise.all([
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    const plan = (org?.plan || 'starter') as PlanName
    const status = (org?.plan_status || 'trial') as PlanStatus
    const limits = getPlanLimits(plan)
    const customerCount = custRes.count || 0
    const aiMessagesThisMonth = org?.ai_messages_this_month || 0
    const teamMemberCount = (teamRes.count || 0) + 1 // +1 for the owner

    const next: PlanInfo = {
      plan,
      status,
      trialEndsAt: org?.trial_ends_at || null,
      trialDaysLeft: daysUntil(org?.trial_ends_at || null),
      nextBillingAt: org?.next_billing_at || null,
      limits,
      customerCount,
      aiMessagesThisMonth,
      teamMemberCount,
      loading: false,
      isFeatureAvailable: (f) => isFeatureAvailable(plan, f),
      isAtCustomerLimit: customerCount >= limits.maxCustomers,
      isAtAIMessageLimit: aiMessagesThisMonth >= limits.maxAIMessages,
      isAtTeamLimit: teamMemberCount >= limits.maxUsers,
      refresh: load,
    }
    cached = next
    setInfo(next)
  }

  useEffect(() => { if (!cached) void load() }, [])

  return info
}
