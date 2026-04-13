# URGENT: Key Rotation Playbook

You run every step below. Do not paste any secret into ChatGPT, Claude, or any
shared terminal. Do not screenshot. Work from a private window.

## 0. Stop the bleeding first

Before rotating, confirm the actual leak vector so the new keys don't leak the
same way:

- `git log --all -p -- .env.local` → `.env.local` is **not** in git history (verified). ✅
- Check Vercel deployment logs for any place the key was printed (search the key's
  last 4 chars across recent logs).
- Check GitHub repo + any forks for accidental commits (Settings → Secret scanning).
- Check Slack / DMs / screenshots / gists.
- If you shared a full `.env.local` anywhere (tickets, emails, screen-shares), assume
  every key in it is compromised — rotate them all, not just the ones you remember.

## 1. Anthropic (ANTHROPIC_API_KEY)

1. Open https://console.anthropic.com/settings/keys in a **private browser window**.
2. Find the key currently in use (check the last 4 characters against your
   `.env.local`).
3. Click **Delete** on that key. It is now revoked instantly.
4. Click **Create Key** → name it `gestivio-prod-<date>` → copy the new `sk-ant-...`
   value **once** (shown only at creation).
5. Paste into your password manager, then into `.env.local` (locally) and into
   Vercel env vars (step 6 below).

## 2. Stripe secret key (STRIPE_SECRET_KEY)

1. https://dashboard.stripe.com/apikeys
2. Next to the **Secret key** row click the `⋯` menu → **Roll key**.
3. Choose an expiry for the old key: **Expire now** (nuclear) or **12 hours**
   (safer — gives production time to pick up the new value before the old one
   breaks). If you're confident Vercel will redeploy fast, use **Expire now**.
4. Copy the new `sk_live_...` (shown once).

## 3. Stripe webhook signing secret (STRIPE_WEBHOOK_SECRET)

1. https://dashboard.stripe.com/webhooks
2. Click the Gestivio endpoint (`https://gestivio.ca/api/stripe/webhook`).
3. In the **Signing secret** box, click **Roll secret** → expire immediately.
4. Copy the new `whsec_...`.
5. Separately, verify these events are still subscribed:
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.payment_failed`, `account.updated`.

## 4. Resend (RESEND_API_KEY)

1. https://resend.com/api-keys
2. Delete the exposed key.
3. Click **Create API Key** → name `gestivio-prod-<date>` → full-access or
   sending-only as appropriate.
4. Copy the new `re_...`.

## 5. Supabase service-role key (SUPABASE_SERVICE_ROLE_KEY)

If `.env.local` leaked, your service-role key is almost certainly in it and is
the most dangerous one — it bypasses RLS.

1. https://supabase.com/dashboard/project/<your-project>/settings/api
2. Under **Project API keys**, click **Reset service_role key**. This invalidates
   the old one immediately.
3. Copy the new `eyJ...` value.

## 6. Push new values to Vercel

Option A — Dashboard (recommended for rotation; clearer audit trail):

1. https://vercel.com/<your-team>/fieldos/settings/environment-variables
2. For each of these, click **Edit** → paste new value → **Save**. Make sure
   **Production** is checked (and Preview if you want previews to work):
   - `ANTHROPIC_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Click the `⋯` on the latest Production deployment → **Redeploy** → uncheck
   "Use existing Build Cache" → **Redeploy**. New env vars are only injected
   into new deployments.

Option B — Vercel CLI (install first: `npm i -g vercel`, then `vercel link`):

```bash
vercel env rm ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY production   # paste when prompted

vercel env rm STRIPE_SECRET_KEY production
vercel env add STRIPE_SECRET_KEY production

vercel env rm STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_WEBHOOK_SECRET production

vercel env rm RESEND_API_KEY production
vercel env add RESEND_API_KEY production

vercel env rm SUPABASE_SERVICE_ROLE_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

vercel --prod
```

## 7. Update `.env.local`

Update the file locally so dev still works. It's in `.gitignore` — keep it that
way. Never `git add -f` it.

## 8. Verify

- Open https://gestivio.ca — confirm it loads (no 500 from missing env).
- Send a test AI message via the in-app assistant → confirms Anthropic key works.
- Trigger a Stripe test webhook from the dashboard (**Send test webhook** →
  `checkout.session.completed`) → confirms webhook secret matches.
- Send a test email (trigger a booking or newsletter signup) → confirms Resend.
- Query `organizations` via any logged-in page → confirms Supabase client + service
  role still work.
- Check Vercel runtime logs for `Invalid signature` or `401` — if any appear,
  the env vars didn't propagate; redeploy.

## 9. Create Stripe products (only after STRIPE_SECRET_KEY is rotated)

Run **on your own machine**, not here:

```bash
cd /path/to/fieldos
STRIPE_SECRET_KEY=sk_live_NEW_KEY node scripts/create-stripe-products.js
```

The script is idempotent — safe to re-run. Paste the 6 `STRIPE_PRICE_*` env-var
lines it prints into Vercel (dashboard or `vercel env add`) and redeploy.

## 10. Post-rotation hygiene

- Clear your shell history where any secret may have appeared:
  `history -c && rm ~/.bash_history ~/.zsh_history 2>/dev/null`
- Clear any cached `.env.local` from editor tabs / previews.
- Add a monthly calendar reminder to rotate these keys anyway — hygiene, not
  emergency.
- Consider moving to Vercel's OIDC-based integrations for Supabase so the
  service-role key isn't needed at all. Not urgent; flag for later.

## 11. Stop using the compromised keys immediately in dev

If anyone on your team has the old keys in their `.env.local`, their local dev
will break after you rotate. Tell them to pull new values via `vercel env pull
.env.local` or from the password manager.
