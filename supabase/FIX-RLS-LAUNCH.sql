-- ═══════════════════════════════════════════════════════════════════
-- FIX-RLS-LAUNCH.sql — FINAL WORKING VERSION (applied 2026-04-22)
-- ═══════════════════════════════════════════════════════════════════
-- History: an anonymous-probe audit found 7 tables leaking data across
-- tenants (invoices, booking_requests, organizations, invoice_activity,
-- promo_codes, availability_schedule, services). Root causes were:
--   1. Newer tables (contracts, employees, invoice_activity, products,
--      job_assignments, profiles, time_entries) never had RLS policies.
--   2. Legacy {public}-role policies with USING (true) on invoices,
--      organizations, booking_requests, promo_codes granted anon read.
--   3. RLS was enabled but not FORCED on invoice_activity, so the table
--      owner (service role via REST when misconfigured) bypassed it.
-- This migration fixes all three. Idempotent; safe to re-run.
--
-- All auth.uid() comparisons cast to text on both sides because user_id
-- columns are UUID on some tables and TEXT on others.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Enable + FORCE RLS on every tenant-data table.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'audit_log','availability_overrides','availability_schedule','availability_settings',
    'booking_requests','contracts','customer_notes','customers','employees',
    'invoice_activity','invoices','job_assignments','jobs','newsletter_subscribers',
    'notifications','organizations','payments','products','profiles',
    'promo_code_attempts','promo_code_redemptions','promo_codes','quotes',
    'services','team_members','time_entries'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;


-- 2. Drop any legacy {public}-role policies that allowed anon reads.
DROP POLICY IF EXISTS "owners_manage_booking_requests"      ON public.booking_requests;
DROP POLICY IF EXISTS "public_read_booking_requests"        ON public.booking_requests;
DROP POLICY IF EXISTS "public_update_booking_requests"      ON public.booking_requests;
DROP POLICY IF EXISTS "public_insert_booking_requests"      ON public.booking_requests;
DROP POLICY IF EXISTS "Users can manage their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete"                     ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert"                     ON public.invoices;
DROP POLICY IF EXISTS "invoices_owner_all"                  ON public.invoices;
DROP POLICY IF EXISTS "invoices_public_read_by_token"       ON public.invoices;
DROP POLICY IF EXISTS "invoices_select"                     ON public.invoices;
DROP POLICY IF EXISTS "invoices_update"                     ON public.invoices;
DROP POLICY IF EXISTS "Users create their org"              ON public.organizations;
DROP POLICY IF EXISTS "Users manage their own org"          ON public.organizations;
DROP POLICY IF EXISTS "public_read_organizations"           ON public.organizations;
DROP POLICY IF EXISTS "public_can_read_active_codes"        ON public.promo_codes;


-- 3. Owner-scoped tables (user_id = auth.uid())
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'audit_log','customers','customer_notes','jobs','invoices','quotes',
    'notifications','time_entries'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON public.%I', t, t);
    EXECUTE format('CREATE POLICY %I_select ON public.%I FOR SELECT TO authenticated USING ((auth.uid())::text = (user_id)::text)', t, t);
    EXECUTE format('CREATE POLICY %I_insert ON public.%I FOR INSERT TO authenticated WITH CHECK ((auth.uid())::text = (user_id)::text)', t, t);
    EXECUTE format('CREATE POLICY %I_update ON public.%I FOR UPDATE TO authenticated USING ((auth.uid())::text = (user_id)::text) WITH CHECK ((auth.uid())::text = (user_id)::text)', t, t);
    EXECUTE format('CREATE POLICY %I_delete ON public.%I FOR DELETE TO authenticated USING ((auth.uid())::text = (user_id)::text)', t, t);
  END LOOP;
END $$;


-- 4. organizations — owner_user_id = auth.uid()
DROP POLICY IF EXISTS organizations_select ON public.organizations;
DROP POLICY IF EXISTS organizations_insert ON public.organizations;
DROP POLICY IF EXISTS organizations_update ON public.organizations;
CREATE POLICY organizations_select ON public.organizations
  FOR SELECT TO authenticated USING ((auth.uid())::text = (owner_user_id)::text);
CREATE POLICY organizations_insert ON public.organizations
  FOR INSERT TO authenticated WITH CHECK ((auth.uid())::text = (owner_user_id)::text);
CREATE POLICY organizations_update ON public.organizations
  FOR UPDATE TO authenticated USING ((auth.uid())::text = (owner_user_id)::text) WITH CHECK ((auth.uid())::text = (owner_user_id)::text);


-- 5. profiles — id = auth.uid()
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated USING ((auth.uid())::text = (id)::text);
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated WITH CHECK ((auth.uid())::text = (id)::text);
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated USING ((auth.uid())::text = (id)::text) WITH CHECK ((auth.uid())::text = (id)::text);


-- 6. team_members — owner-only (table has no member-auth column).
DROP POLICY IF EXISTS team_members_select_owner  ON public.team_members;
DROP POLICY IF EXISTS team_members_select_member ON public.team_members;
DROP POLICY IF EXISTS team_members_modify_owner  ON public.team_members;
DROP POLICY IF EXISTS team_members_all           ON public.team_members;
CREATE POLICY team_members_all ON public.team_members
  FOR ALL TO authenticated USING ((auth.uid())::text = (user_id)::text) WITH CHECK ((auth.uid())::text = (user_id)::text);


-- 7. org_id-scoped tables — joined back to organizations.owner_user_id
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['contracts','employees','invoice_activity','products'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON public.%I', t, t);
    EXECUTE format($q$CREATE POLICY %I_select ON public.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.organizations o WHERE (o.id)::text = (%I.org_id)::text AND (o.owner_user_id)::text = (auth.uid())::text))$q$, t, t, t);
    EXECUTE format($q$CREATE POLICY %I_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.organizations o WHERE (o.id)::text = (%I.org_id)::text AND (o.owner_user_id)::text = (auth.uid())::text))$q$, t, t, t);
    EXECUTE format($q$CREATE POLICY %I_update ON public.%I FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.organizations o WHERE (o.id)::text = (%I.org_id)::text AND (o.owner_user_id)::text = (auth.uid())::text)) WITH CHECK (EXISTS (SELECT 1 FROM public.organizations o WHERE (o.id)::text = (%I.org_id)::text AND (o.owner_user_id)::text = (auth.uid())::text))$q$, t, t, t, t);
    EXECUTE format($q$CREATE POLICY %I_delete ON public.%I FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.organizations o WHERE (o.id)::text = (%I.org_id)::text AND (o.owner_user_id)::text = (auth.uid())::text))$q$, t, t, t);
  END LOOP;
END $$;


-- 8. job_assignments — via parent job's user_id
DROP POLICY IF EXISTS job_assignments_select ON public.job_assignments;
DROP POLICY IF EXISTS job_assignments_insert ON public.job_assignments;
DROP POLICY IF EXISTS job_assignments_delete ON public.job_assignments;
CREATE POLICY job_assignments_select ON public.job_assignments
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.jobs j WHERE (j.id)::text = (job_assignments.job_id)::text AND (j.user_id)::text = (auth.uid())::text));
CREATE POLICY job_assignments_insert ON public.job_assignments
  FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE (j.id)::text = (job_assignments.job_id)::text AND (j.user_id)::text = (auth.uid())::text));
CREATE POLICY job_assignments_delete ON public.job_assignments
  FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.jobs j WHERE (j.id)::text = (job_assignments.job_id)::text AND (j.user_id)::text = (auth.uid())::text));


-- 9. payments — readable only by invoice owner (writes via webhook/service role)
DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.invoices i WHERE (i.id)::text = (payments.invoice_id)::text AND (i.user_id)::text = (auth.uid())::text));


-- 10. booking_requests — public INSERT (booking portal), owner-only reads/updates
DROP POLICY IF EXISTS booking_requests_select ON public.booking_requests;
DROP POLICY IF EXISTS booking_requests_insert_public ON public.booking_requests;
DROP POLICY IF EXISTS booking_requests_insert ON public.booking_requests;
DROP POLICY IF EXISTS booking_requests_update ON public.booking_requests;
DROP POLICY IF EXISTS booking_requests_delete ON public.booking_requests;
CREATE POLICY booking_requests_select ON public.booking_requests
  FOR SELECT TO authenticated USING ((auth.uid())::text = (user_id)::text);
CREATE POLICY booking_requests_insert_public ON public.booking_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY booking_requests_update ON public.booking_requests
  FOR UPDATE TO authenticated USING ((auth.uid())::text = (user_id)::text) WITH CHECK ((auth.uid())::text = (user_id)::text);
CREATE POLICY booking_requests_delete ON public.booking_requests
  FOR DELETE TO authenticated USING ((auth.uid())::text = (user_id)::text);


-- 11. services — active services publicly listable (booking portal menu),
--     owner-only modify.
DROP POLICY IF EXISTS services_select_public ON public.services;
DROP POLICY IF EXISTS services_select_owner  ON public.services;
DROP POLICY IF EXISTS services_insert ON public.services;
DROP POLICY IF EXISTS services_update ON public.services;
DROP POLICY IF EXISTS services_delete ON public.services;
CREATE POLICY services_select_public ON public.services
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY services_select_owner ON public.services
  FOR SELECT TO authenticated USING ((auth.uid())::text = (user_id)::text);
CREATE POLICY services_insert ON public.services
  FOR INSERT TO authenticated WITH CHECK ((auth.uid())::text = (user_id)::text);
CREATE POLICY services_update ON public.services
  FOR UPDATE TO authenticated USING ((auth.uid())::text = (user_id)::text) WITH CHECK ((auth.uid())::text = (user_id)::text);
CREATE POLICY services_delete ON public.services
  FOR DELETE TO authenticated USING ((auth.uid())::text = (user_id)::text);


-- 12. availability tables — public SELECT (booking portal needs open slots),
--     owner-only modify.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['availability_schedule','availability_settings','availability_overrides'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select_public ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON public.%I', t, t);
    EXECUTE format('CREATE POLICY %I_select_public ON public.%I FOR SELECT TO anon, authenticated USING (true)', t, t);
    EXECUTE format('CREATE POLICY %I_insert ON public.%I FOR INSERT TO authenticated WITH CHECK ((auth.uid())::text = (user_id)::text)', t, t);
    EXECUTE format('CREATE POLICY %I_update ON public.%I FOR UPDATE TO authenticated USING ((auth.uid())::text = (user_id)::text) WITH CHECK ((auth.uid())::text = (user_id)::text)', t, t);
    EXECUTE format('CREATE POLICY %I_delete ON public.%I FOR DELETE TO authenticated USING ((auth.uid())::text = (user_id)::text)', t, t);
  END LOOP;
END $$;


-- 13. promo_codes / promo_code_attempts / newsletter_subscribers — no client
--     access. Service-role routes handle everything.
DROP POLICY IF EXISTS promo_codes_no_anon ON public.promo_codes;
DROP POLICY IF EXISTS promo_code_attempts_no_anon ON public.promo_code_attempts;
DROP POLICY IF EXISTS newsletter_no_anon ON public.newsletter_subscribers;
CREATE POLICY promo_codes_no_anon ON public.promo_codes
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY promo_code_attempts_no_anon ON public.promo_code_attempts
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY newsletter_no_anon ON public.newsletter_subscribers
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- promo_code_redemptions — users see their own redemption history.
DROP POLICY IF EXISTS promo_code_redemptions_select ON public.promo_code_redemptions;
CREATE POLICY promo_code_redemptions_select ON public.promo_code_redemptions
  FOR SELECT TO authenticated USING ((auth.uid())::text = (user_id)::text);
