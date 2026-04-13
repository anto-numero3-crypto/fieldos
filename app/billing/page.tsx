import { redirect } from 'next/navigation'

// /billing is canonicalized under /settings?tab=billing to avoid two
// sources of truth for subscription management.
export default function BillingRedirect() {
  redirect('/settings?tab=billing')
}
