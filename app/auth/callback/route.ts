import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')

  // Surface Supabase auth errors clearly
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`
    )
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/login?error=confirmation_failed`
      )
    }

    // Check if this is a first login (no customer data yet → onboarding)
    if (data.user) {
      const { count } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', data.user.id)

      const isNewUser = (count ?? 0) === 0

      const redirectTo = isNewUser ? `${origin}/onboarding` : `${origin}${next}`
      return NextResponse.redirect(redirectTo)
    }
  }

  // Fallback
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
