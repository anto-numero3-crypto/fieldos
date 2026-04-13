-- ═══════════════════════════════════════════════════════════════════
-- Security Audit: Row Level Security (RLS)
-- Run this in the Supabase SQL editor to enable RLS on all tables
-- and install the correct owner-scoped policies.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Audit which tables have RLS disabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- ── Per-user tables (owner = auth.uid() matches user_id) ──────────
-- customers, jobs, invoices, quotes, booking_requests, availability_*,
-- notifications, services, payments (via invoice).

ALTER TABLE public.customers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_schedule   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_overrides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_redemptions  ENABLE ROW LEVEL SECURITY;

-- ── Generic helper macro pattern ──────────────────────────────────
-- For every "user_id owner" table we install identical 4 policies.
-- Drop-then-create to make this script idempotent.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','jobs','invoices','quotes','booking_requests',
    'availability_settings','availability_schedule','availability_overrides',
    'notifications','services'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON public.%I', t, t);

    EXECUTE format(
      'CREATE POLICY %I_select ON public.%I FOR SELECT USING ((auth.uid())::text = (user_id)::text)', t, t);
    EXECUTE format(
      'CREATE POLICY %I_insert ON public.%I FOR INSERT WITH CHECK ((auth.uid())::text = (user_id)::text)', t, t);
    EXECUTE format(
      'CREATE POLICY %I_update ON public.%I FOR UPDATE USING ((auth.uid())::text = (user_id)::text) WITH CHECK ((auth.uid())::text = (user_id)::text)', t, t);
    EXECUTE format(
      'CREATE POLICY %I_delete ON public.%I FOR DELETE USING ((auth.uid())::text = (user_id)::text)', t, t);
  END LOOP;
END $$;

-- ── organizations: scoped by owner_user_id ────────────────────────
DROP POLICY IF EXISTS organizations_select ON public.organizations;
DROP POLICY IF EXISTS organizations_insert ON public.organizations;
DROP POLICY IF EXISTS organizations_update ON public.organizations;
DROP POLICY IF EXISTS organizations_delete ON public.organizations;

CREATE POLICY organizations_select ON public.organizations
  FOR SELECT USING ((auth.uid())::text = (owner_user_id)::text);
CREATE POLICY organizations_insert ON public.organizations
  FOR INSERT WITH CHECK ((auth.uid())::text = (owner_user_id)::text);
CREATE POLICY organizations_update ON public.organizations
  FOR UPDATE USING ((auth.uid())::text = (owner_user_id)::text) WITH CHECK ((auth.uid())::text = (owner_user_id)::text);
-- No client-side delete for organizations

-- ── team_members: owner can manage, member can read own row ───────
DROP POLICY IF EXISTS team_members_select_owner  ON public.team_members;
DROP POLICY IF EXISTS team_members_select_member ON public.team_members;
DROP POLICY IF EXISTS team_members_modify_owner  ON public.team_members;

CREATE POLICY team_members_select_owner ON public.team_members
  FOR SELECT USING ((auth.uid())::text = (user_id)::text);
CREATE POLICY team_members_select_member ON public.team_members
  FOR SELECT USING ((auth.uid())::text = (member_user_id)::text);
CREATE POLICY team_members_modify_owner ON public.team_members
  FOR ALL USING ((auth.uid())::text = (user_id)::text) WITH CHECK ((auth.uid())::text = (user_id)::text);

-- ── payments: readable by invoice owner; writes via service role only ─
DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = payments.invoice_id AND (i.user_id)::text = (auth.uid())::text
    )
  );

-- ── promo_codes: owner-admin only (service role bypasses RLS anyway) ─
DROP POLICY IF EXISTS promo_codes_no_anon ON public.promo_codes;
CREATE POLICY promo_codes_no_anon ON public.promo_codes
  FOR SELECT USING (false);
-- Writes happen only via service role (admin/promo route).

-- ── promo_code_redemptions: users can see their own redemptions ──
DROP POLICY IF EXISTS promo_code_redemptions_select ON public.promo_code_redemptions;
CREATE POLICY promo_code_redemptions_select ON public.promo_code_redemptions
  FOR SELECT USING ((auth.uid())::text = (user_id)::text);

-- ── promo_code_attempts: no client access (abuse log) ─────────────
DROP POLICY IF EXISTS promo_code_attempts_no_anon ON public.promo_code_attempts;
CREATE POLICY promo_code_attempts_no_anon ON public.promo_code_attempts
  FOR ALL USING (false);

-- ── Post-check: every public table should now have rowsecurity = true ─
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
