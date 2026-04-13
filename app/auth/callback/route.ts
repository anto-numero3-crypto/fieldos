import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
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

    // First login: make sure the user has an organizations row with an
    // active Pro trial before we send them into the app.
    if (data.user) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: existingOrg } = await admin
        .from('organizations')
        .select('id, name')
        .eq('owner_user_id', data.user.id)
        .maybeSingle()

      if (!existingOrg) {
        const bizName =
          (data.user.user_metadata?.business_name as string | undefined) ||
          (data.user.user_metadata?.full_name as string | undefined) ||
          'Mon entreprise'
        const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        await admin.from('organizations').insert({
          owner_user_id: data.user.id,
          name: bizName,
          email: data.user.email,
          plan: 'pro',
          plan_status: 'trial',
          trial_ends_at: trialEndsAt,
          plan_started_at: new Date().toISOString(),
        })
      }

      // If the user provided a promo code at signup, try to apply it now.
      const promoCode = data.user.user_metadata?.promo_code as string | undefined
      if (promoCode) {
        try {
          await fetch(`${origin}/api/promo/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: promoCode, userId: data.user.id }),
          })
        } catch { /* non-fatal */ }
      }

      // Send to /onboarding if they haven't finished setup yet:
      // no org yet (edge case) OR no customers imported OR default placeholder name.
      const needsOnboarding =
        !existingOrg ||
        !existingOrg.name ||
        existingOrg.name === 'Mon entreprise'
      const { count: customerCount } = await admin
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', data.user.id)

      const redirectTo = (needsOnboarding || (customerCount ?? 0) === 0)
        ? `${origin}/onboarding`
        : `${origin}${next}`
      return NextResponse.redirect(redirectTo)
    }
  }

  // Fallback
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
