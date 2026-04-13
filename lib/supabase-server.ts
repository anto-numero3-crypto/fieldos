import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export function adminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function serverClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(toSet) {
          try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { /* read-only in some contexts */ }
        },
      },
    }
  )
}

export const UNAUTHORIZED = () =>
  NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

/**
 * Resolves the authenticated user from either:
 *   1. The Supabase cookie-backed session (preferred, set via @supabase/ssr)
 *   2. An `Authorization: Bearer <jwt>` header (fallback for localStorage-based clients)
 * Returns null when no valid session is present.
 */
export async function getAuthedUser(req?: NextRequest): Promise<{ id: string; email?: string | null } | null> {
  // 1. Try cookie session
  try {
    const sb = await serverClient()
    const { data: { user } } = await sb.auth.getUser()
    if (user?.id) return { id: user.id, email: user.email }
  } catch { /* continue */ }

  // 2. Bearer token fallback
  const auth = req?.headers.get('authorization') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  if (!token) return null
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await sb.auth.getUser(token)
    if (user?.id) return { id: user.id, email: user.email }
  } catch { /* ignore */ }
  return null
}
