-- ═══════════════════════════════════════════════════════════════════
-- add-billing-rls-guard.sql
-- ═══════════════════════════════════════════════════════════════════
-- middleware.ts already blocks page access once an org's trial/subscription
-- has lapsed, but that check lives only in the Next.js app. Row Level
-- Security on customers/jobs/invoices/quotes only checks ownership
-- (auth.uid() = user_id), so a direct call to the Supabase REST API with a
-- valid user JWT — bypassing the app entirely — could still read/write
-- tenant data after expiry. This migration closes that gap at the DB layer,
-- mirroring the exact lock condition from middleware.ts:
--   locked = plan_status IN ('expired','cancelled')
--         OR (plan_status = 'trial' AND trial_ends_at < now())
-- Run this in the Supabase SQL editor. Idempotent; safe to re-run.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.org_plan_active(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.owner_user_id = uid
      AND o.plan_status NOT IN ('expired', 'cancelled')
      AND NOT (o.plan_status = 'trial' AND o.trial_ends_at IS NOT NULL AND o.trial_ends_at < now())
  );
$$;

REVOKE ALL ON FUNCTION public.org_plan_active(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.org_plan_active(uuid) TO authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers','jobs','invoices','quotes'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON public.%I', t, t);

    EXECUTE format(
      'CREATE POLICY %I_select ON public.%I FOR SELECT TO authenticated USING ((auth.uid())::text = (user_id)::text AND public.org_plan_active(auth.uid()))', t, t);
    EXECUTE format(
      'CREATE POLICY %I_insert ON public.%I FOR INSERT TO authenticated WITH CHECK ((auth.uid())::text = (user_id)::text AND public.org_plan_active(auth.uid()))', t, t);
    EXECUTE format(
      'CREATE POLICY %I_update ON public.%I FOR UPDATE TO authenticated USING ((auth.uid())::text = (user_id)::text AND public.org_plan_active(auth.uid())) WITH CHECK ((auth.uid())::text = (user_id)::text AND public.org_plan_active(auth.uid()))', t, t);
    EXECUTE format(
      'CREATE POLICY %I_delete ON public.%I FOR DELETE TO authenticated USING ((auth.uid())::text = (user_id)::text AND public.org_plan_active(auth.uid()))', t, t);
  END LOOP;
END $$;

-- Note: API routes using the service-role admin client (lib/supabase-server.ts
-- adminClient()) bypass RLS by design and are unaffected by this migration.
-- Employee-facing routes (/api/employees/*, /api/time/*) also go through the
-- admin client and are untouched — this only tightens direct owner-scoped
-- access via the anon key + user JWT (i.e. the app's own client-side calls,
-- and any bypass attempt hitting Supabase directly).
