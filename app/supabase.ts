import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cookie-backed browser client so API routes can verify the session
// via @supabase/ssr's createServerClient + cookies().
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
