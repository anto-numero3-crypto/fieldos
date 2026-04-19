import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED_PREFIXES = [
  '/dashboard', '/customers', '/jobs', '/invoices', '/quotes',
  '/schedule', '/team', '/reports', '/settings', '/assistant',
  '/notifications', '/insights', '/equipe', '/employee', '/feuilles-de-temps',
  '/contrats', '/produits',
]

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Force HTTPS
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }

  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', 'upgrade-insecure-requests')

  if (!isProtected(url.pathname)) return response

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return response

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(toSet) {
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const login = request.nextUrl.clone()
    login.pathname = '/login'
    login.searchParams.set('next', url.pathname)
    return NextResponse.redirect(login)
  }

  // Employee pages skip the org/plan ownership check — employees don't own orgs.
  if (url.pathname.startsWith('/employee')) return response

  // Check plan status. Allow access on query failure so we don't lock users out.
  const { data: org, error } = await supabase
    .from('organizations')
    .select('trial_ends_at, plan_status')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (error || !org) return response

  const now = Date.now()
  const trialEnd = org.trial_ends_at ? new Date(org.trial_ends_at).getTime() : 0
  const status = org.plan_status

  const locked =
    status === 'expired' ||
    status === 'cancelled' ||
    (status === 'trial' && trialEnd > 0 && trialEnd < now)

  // Allow /subscribe itself through even when locked
  if (locked && !url.pathname.startsWith('/subscribe')) {
    const sub = request.nextUrl.clone()
    sub.pathname = '/subscribe'
    return NextResponse.redirect(sub)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|signup|subscribe|book|invoice|quote|contrat/|legal|privacy|terms|about|contact|pricing|security|accessibility|cookies|support|changelog|onboarding|invite).*)',
  ],
}
