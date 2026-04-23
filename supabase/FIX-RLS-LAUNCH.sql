-- ═══════════════════════════════════════════════════════════════════
-- FIX-RLS-LAUNCH.sql
-- ═══════════════════════════════════════════════════════════════════
-- Run this ONCE in Supabase → SQL Editor before launching paid traffic.
--
-- Why: a security probe found that anonymous visitors can currently read
-- invoices, booking_requests (customer PII: name/email/phone/address),
-- organizations, invoice_activity, availability_schedule, promo_codes,
-- and services across all tenants. This locks every table down to the
-- tenant that owns the row while keeping the public booking portal working.
--
-- Safe to re-run: every statement is idempotent (ENABLE RLS is a no-op if
-- already on; DROP POLICY IF EXISTS + CREATE POLICY is a clean replace).
-- ═══════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 1. Enable RLS on every table that holds customer or tenant data.
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.audit_log               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_overrides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_schedule   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_activity        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_assignments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_redemptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries            ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────────────
-- 2. Owner-scoped tables (user_id = auth.uid())
--    The authenticated user can CRUD only their own rows.
-- ────────────────────────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'audit_log',
    'customers',
    'customer_notes',
    'jobs',
    'invoices',
    'quotes',
    'notifications',
    'products',
    'time_entries'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_select ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t, t);
    EXECUTE format(
      'CREATE POLICY %I_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t, t);
    EXECUTE format(
      'CREATE POLICY %I_update ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t, t);
    EXECUTE format(
      'CREATE POLICY %I_delete ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t, t);
  END LOOP;
END $$;


-- ────────────────────────────────────────────────────────────────────
-- 3. organizations — scoped by owner_user_id
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS organizations_select ON public.organizations;
DROP POLICY IF EXISTS organizations_insert ON public.organizations;
DROP POLICY IF EXISTS organizations_update ON public.organizations;

CREATE POLICY organizations_select ON public.organizations
  FOR SELECT TO authenticated USING (auth.uid() = owner_user_id);
CREATE POLICY organizations_insert ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY organizations_update ON public.organizations
  FOR UPDATE TO authenticated USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
-- No DELETE from client; service role handles account deletion.


-- ────────────────────────────────────────────────────────────────────
-- 4. profiles — id = auth.uid()
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- ────────────────────────────────────────────────────────────────────
-- 5. team_members — owner (user_id) manages, member (member_user_id) reads
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS team_members_select_owner  ON public.team_members;
DROP POLICY IF EXISTS team_members_select_member ON public.team_members;
DROP POLICY IF EXISTS team_members_modify_owner  ON public.team_members;

CREATE POLICY team_members_select_owner ON public.team_members
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY team_members_select_member ON public.team_members
  FOR SELECT TO authenticated USING (auth.uid() = member_user_id);
CREATE POLICY team_members_modify_owner ON public.team_members
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────────
-- 6. org-scoped tables (org_id joins back to organizations.owner_user_id)
--    Applies to: contracts, employees, invoice_activity
-- ────────────────────────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['contracts', 'employees', 'invoice_activity'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON public.%I', t, t);
    EXECUTE format($q$
      CREATE POLICY %I_select ON public.%I FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = %I.org_id AND o.owner_user_id = auth.uid())
      )$q$, t, t, t);
    EXECUTE format($q$
      CREATE POLICY %I_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = %I.org_id AND o.owner_user_id = auth.uid())
      )$q$, t, t, t);
    EXECUTE format($q$
      CREATE POLICY %I_update ON public.%I FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = %I.org_id AND o.owner_user_id = auth.uid())
      ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = %I.org_id AND o.owner_user_id = auth.uid())
      )$q$, t, t, t, t);
    EXECUTE format($q$
      CREATE POLICY %I_delete ON public.%I FOR DELETE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = %I.org_id AND o.owner_user_id = auth.uid())
      )$q$, t, t, t);
  END LOOP;
END $$;


-- ────────────────────────────────────────────────────────────────────
-- 7. job_assignments — scoped via parent job's user_id
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS job_assignments_select ON public.job_assignments;
DROP POLICY IF EXISTS job_assignments_insert ON public.job_assignments;
DROP POLICY IF EXISTS job_assignments_delete ON public.job_assignments;

CREATE POLICY job_assignments_select ON public.job_assignments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_assignments.job_id AND j.user_id = auth.uid())
  );
CREATE POLICY job_assignments_insert ON public.job_assignments
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_assignments.job_id AND j.user_id = auth.uid())
  );
CREATE POLICY job_assignments_delete ON public.job_assignments
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_assignments.job_id AND j.user_id = auth.uid())
  );


-- ────────────────────────────────────────────────────────────────────
-- 8. payments — readable only by the invoice owner
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = payments.invoice_id AND i.user_id = auth.uid())
  );
-- Writes happen only via service role (Stripe webhook).


-- ────────────────────────────────────────────────────────────────────
-- 9. booking_requests — public INSERT (booking portal) but owner-only reads
--    The public booking form submits a row; only the merchant sees it.
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS booking_requests_select ON public.booking_requests;
DROP POLICY IF EXISTS booking_requests_insert_public ON public.booking_requests;
DROP POLICY IF EXISTS booking_requests_insert ON public.booking_requests;
DROP POLICY IF EXISTS booking_requests_update ON public.booking_requests;
DROP POLICY IF EXISTS booking_requests_delete ON public.booking_requests;

CREATE POLICY booking_requests_select ON public.booking_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY booking_requests_insert_public ON public.booking_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY booking_requests_update ON public.booking_requests
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY booking_requests_delete ON public.booking_requests
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────────
-- 10. services — owner CRUD; active services are publicly listable so the
--     booking portal can show the service menu.
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS services_select_public ON public.services;
DROP POLICY IF EXISTS services_select_owner  ON public.services;
DROP POLICY IF EXISTS services_insert ON public.services;
DROP POLICY IF EXISTS services_update ON public.services;
DROP POLICY IF EXISTS services_delete ON public.services;

CREATE POLICY services_select_public ON public.services
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY services_select_owner ON public.services
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY services_insert ON public.services
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY services_update ON public.services
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY services_delete ON public.services
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────────
-- 11. availability tables — public SELECT (so the booking portal can
--     compute open slots), owner-only modify.
-- ────────────────────────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['availability_schedule', 'availability_settings', 'availability_overrides'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select_public ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_select_public ON public.%I FOR SELECT TO anon, authenticated USING (true)', t, t);
    EXECUTE format(
      'CREATE POLICY %I_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t, t);
    EXECUTE format(
      'CREATE POLICY %I_update ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t, t);
    EXECUTE format(
      'CREATE POLICY %I_delete ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t, t);
  END LOOP;
END $$;


-- ────────────────────────────────────────────────────────────────────
-- 12. promo_codes, promo_code_attempts — no client access.
--     The /api/promo/* routes use the service role key (bypasses RLS).
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS promo_codes_no_anon ON public.promo_codes;
DROP POLICY IF EXISTS promo_code_attempts_no_anon ON public.promo_code_attempts;

CREATE POLICY promo_codes_no_anon ON public.promo_codes
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY promo_code_attempts_no_anon ON public.promo_code_attempts
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- promo_code_redemptions: users can see their own redemption history.
DROP POLICY IF EXISTS promo_code_redemptions_select ON public.promo_code_redemptions;
CREATE POLICY promo_code_redemptions_select ON public.promo_code_redemptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────────
-- 13. newsletter_subscribers — no client access.
--     Writes happen from the /api/newsletter/subscribe route using
--     the service role key; nobody needs to read this client-side.
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS newsletter_no_anon ON public.newsletter_subscribers;
CREATE POLICY newsletter_no_anon ON public.newsletter_subscribers
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);


-- ────────────────────────────────────────────────────────────────────
-- 14. Post-check — every table should show rowsecurity = true
-- ────────────────────────────────────────────────────────────────────
-- Run this manually after the migration to confirm:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
