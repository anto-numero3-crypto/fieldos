// Lightweight analytics helpers that fire on both GA4 and Meta Pixel when present.
// Safe to call anywhere: no-ops when the pixels aren't installed.

type GAGtag = (command: string, action: string, params?: Record<string, unknown>) => void
type FbqFn = (action: string, event: string, params?: Record<string, unknown>) => void

declare global {
  interface Window {
    gtag?: GAGtag
    fbq?: FbqFn
  }
}

function safeGtag(): GAGtag | null {
  if (typeof window === 'undefined') return null
  return window.gtag || null
}

function safeFbq(): FbqFn | null {
  if (typeof window === 'undefined') return null
  return window.fbq || null
}

// Signup / trial start. Fire right after the Supabase auth succeeds on /signup.
export function trackSignup(params?: { method?: string; plan?: string }) {
  safeGtag()?.('event', 'sign_up', { method: params?.method ?? 'email', plan: params?.plan })
  safeFbq()?.('track', 'CompleteRegistration', params as Record<string, unknown>)
}

// Trial upgrade or new subscription. Fire right before redirect to Stripe checkout.
export function trackCheckoutStarted(params: { plan: string; cycle: 'monthly' | 'annual'; value?: number; currency?: string }) {
  const value = params.value ?? undefined
  const currency = params.currency ?? 'CAD'
  safeGtag()?.('event', 'begin_checkout', { items: [{ item_id: params.plan, item_category: params.cycle }], value, currency })
  safeFbq()?.('track', 'InitiateCheckout', { content_ids: [params.plan], content_category: params.cycle, value, currency })
}

// Confirmed paid subscription. Fire on the /dashboard success return from Stripe.
export function trackSubscribed(params: { plan: string; cycle: 'monthly' | 'annual'; value: number; currency?: string }) {
  const currency = params.currency ?? 'CAD'
  safeGtag()?.('event', 'purchase', {
    transaction_id: `${params.plan}-${Date.now()}`,
    value: params.value,
    currency,
    items: [{ item_id: params.plan, item_category: params.cycle, price: params.value, quantity: 1 }],
  })
  safeFbq()?.('track', 'Subscribe', {
    content_ids: [params.plan],
    content_category: params.cycle,
    value: params.value,
    currency,
  })
}

// Generic lead event (e.g. contact form, newsletter signup).
export function trackLead(params?: { source?: string }) {
  safeGtag()?.('event', 'generate_lead', params)
  safeFbq()?.('track', 'Lead', params as Record<string, unknown>)
}
