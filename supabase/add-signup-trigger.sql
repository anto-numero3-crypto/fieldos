-- Optional belt-and-suspenders: auto-create an organizations row with a
-- 14-day Pro trial whenever a new auth.users row is inserted.
-- The Next.js /auth/callback handler already does this — this trigger is a
-- safety net in case anyone creates a user through a path that skips it.
-- Safe to run multiple times.

CREATE OR REPLACE FUNCTION public.create_org_for_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  biz_name TEXT;
BEGIN
  -- Skip if an org already exists for this user (e.g. callback already ran).
  IF EXISTS (SELECT 1 FROM organizations WHERE owner_user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  biz_name := COALESCE(
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'full_name',
    'Mon entreprise'
  );

  INSERT INTO organizations (
    owner_user_id, name, email,
    plan, plan_status, trial_ends_at, plan_started_at
  ) VALUES (
    NEW.id, biz_name, NEW.email,
    'pro', 'trial', NOW() + INTERVAL '14 days', NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_org_for_new_user();
