# Gestivio — Launch readiness checklist

Actions only you (Antoine) can take before running paid ads. Each line is one account to create or one value to paste into Vercel → Settings → Environment Variables (Production scope), then redeploy.

## 1. Rotate live keys (CRITICAL — do this first)

The file `URGENT-ROTATE-KEYS.md` was in the repo when this session started and live values were visible in `.env.local`. If these haven't been rotated since, rotate them now.

- **Stripe** → Developers → API keys → "Roll key" on the secret key. Paste the new value into Vercel as `STRIPE_SECRET_KEY`. Also reissue the webhook signing secret (`STRIPE_WEBHOOK_SECRET`) from Developers → Webhooks.
- **Supabase** → Project Settings → API → "Reset service role key". Paste into Vercel as `SUPABASE_SERVICE_ROLE_KEY`. Also consider rotating the anon/publishable key if you're unsure who's seen it (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- **Resend** → API Keys → create new, delete old. Vercel env: `RESEND_API_KEY`.
- **Anthropic** → Keys → rotate. Vercel env: `ANTHROPIC_API_KEY`.
- Delete `URGENT-ROTATE-KEYS.md` from the repo once all keys are rotated.

## 2. Sentry (error monitoring)

Already installed in the code. You just need a project.

1. Go to **sentry.io** → Create project → platform: **Next.js** → name: `gestivio`.
2. Copy the **DSN** it gives you. It looks like `https://abc123@o456.ingest.sentry.io/789`.
3. In Vercel, add env var:
   - `NEXT_PUBLIC_SENTRY_DSN` = (the DSN)
4. For source maps (optional but recommended), also add:
   - `SENTRY_AUTH_TOKEN` = auth token from Sentry (User Settings → Auth Tokens → create with `project:releases` and `project:write` scopes)
   - `SENTRY_ORG` = your Sentry org slug (e.g. `gestivio`)
   - `SENTRY_PROJECT` = `gestivio`
5. Redeploy. Trigger a test error by visiting any page and forcing a bug — check Sentry's Issues tab populates within ~1 min.

## 3. GA4 (Google Analytics)

Already installed in the code.

1. Go to **analytics.google.com** → Admin → Create property → name `Gestivio`, timezone Montréal, currency CAD.
2. Create a **Web data stream** for `https://gestivio.ca`.
3. Copy the **Measurement ID** (starts with `G-`).
4. Vercel env: `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-XXXXXXXXXX`.
5. Redeploy. Open gestivio.ca in an incognito window, then check GA4 → Reports → Realtime to see the pageview.

Conversion events already wire up automatically once GA4 is live:
- `sign_up` — fires when a trial signup completes
- `begin_checkout` — fires when user clicks a paid plan
- `purchase` — fires on return from Stripe checkout with value in CAD

## 4. Meta Pixel (for Facebook/Instagram ads)

Already installed in the code.

1. Go to **business.facebook.com** → Events Manager → Connect Data Sources → Web → Pixel → name `Gestivio Pixel`.
2. Enter site URL `https://gestivio.ca`. Skip the integration wizard.
3. Copy the **Pixel ID** (15–17 digit number).
4. Vercel env: `NEXT_PUBLIC_META_PIXEL_ID` = (the number).
5. Redeploy. Open gestivio.ca with the **Meta Pixel Helper** Chrome extension — you should see PageView firing green.

The same conversion events fire on Meta Pixel automatically:
- `CompleteRegistration` — signup
- `InitiateCheckout` — clicked paid plan
- `Subscribe` — finished paid plan

## 5. Email deliverability — SPF, DKIM, DMARC

Right now your app sends from `noreply@gestivio.ca` via Resend. Without proper DNS, a significant chunk of invoices/quotes will land in spam — disastrous for a paid product.

1. In **Resend** → Domains → add `gestivio.ca` and follow the "Add DNS records" step.
2. Resend will give you 3 TXT/CNAME records. Add them in whatever DNS provider hosts gestivio.ca (likely Vercel's nameservers or Cloudflare).
3. After DNS propagation (5–30 min), Resend's domain page should show all 3 as ✓ Verified.
4. Send a test invoice to yourself at Gmail — click the three-dot "Show original" — SPF: PASS / DKIM: PASS / DMARC: PASS.
5. Also add a DMARC record: `_dmarc.gestivio.ca` TXT `v=DMARC1; p=none; rua=mailto:support@gestivio.ca`.

## 6. Supabase Row Level Security (RLS) audit

You have customers, jobs, invoices, quotes, contracts, team_members, organizations all holding tenant data. One missing RLS policy = customer A can see customer B's invoices. I didn't have access to audit the policies in this session.

1. Supabase → Database → Tables. For EACH table that holds customer data, click → Authorization → "RLS enabled?" must be green.
2. For each enabled table, review the policies. Every `SELECT` policy should include something like `auth.uid() = user_id` (or equivalent ownership check).
3. As a smoke test: in Supabase → SQL editor, run: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';` — any table with `rowsecurity=false` that has customer data is a problem.

## 7. Legal pages — Quebec Law 25

Quebec's Law 25 (Privacy Act) applies to you since you're collecting personal info from Quebec businesses.

- Privacy page (`/privacy`) exists but should explicitly mention: you're the responsible party, how to reach your Privacy Officer (now `support@gestivio.ca`), the right to access/rectify/delete, 30-day response commitment, and the list of sub-processors (Supabase, Stripe, Resend, Vercel, Anthropic).
- Terms (`/terms`) exists — check that the refund policy (30-day money back) is stated consistently with what pricing page shows.
- Cookie banner — you have `/cookies` but check that an actual cookie consent banner shows up on first visit. Quebec Law 25 requires it for non-essential cookies (GA4 + Meta Pixel qualify).

I did not modify these pages substantively in this session beyond email addresses. Review yourself or ping me to do a targeted pass.

## 8. Status page (optional but cheap)

Customers need a way to check "is it me or is Gestivio down?" when something breaks.

- Option A (free): **BetterStack Uptime** — free tier gives a public status page + 10-minute checks.
- Option B (free): **UptimeRobot** — free tier 5-minute checks.
- Configure checks for: `https://gestivio.ca`, `https://gestivio.ca/login`, your Supabase API URL. Point customers to the page from `/support` or the footer.

## 9. Conversion tracking smoke test

Before spending ad money, verify the funnel fires events correctly:

1. Open gestivio.ca in incognito with GA4 Debug View open (GA4 → Configure → DebugView) and Meta Pixel Helper extension on.
2. Click "Start free trial" → complete signup with a throwaway email.
3. Verify `sign_up` / `CompleteRegistration` fires.
4. In /subscribe, click a paid plan (don't actually pay — cancel at Stripe).
5. Verify `begin_checkout` / `InitiateCheckout` fires.
6. If you want to test `purchase`, use a real Stripe test card during a test-mode switch, otherwise just check the event fires on return.

## 10. The Stripe/Billing handling verification

Scenarios to test manually at least once each:

- [ ] New user signup → 14-day trial starts → plan = demarrage, status = trial
- [ ] Subscribe monthly Starter → success → dashboard shows active
- [ ] Upgrade monthly Starter → monthly Pro → proration shown in Stripe
- [ ] Switch monthly → annual on same tier
- [ ] Cancel → dashboard shows `cancel_at_period_end`
- [ ] Trial expires → access gated correctly

---

## When all of the above are ✓, you're ready for the first $100-200 ad test.

(See my separate reply in the chat for the ad-channel and targeting recommendation.)
