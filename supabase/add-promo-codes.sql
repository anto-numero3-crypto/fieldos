-- Promo code system — safe to re-run.

CREATE TABLE IF NOT EXISTS promo_codes (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code           TEXT UNIQUE NOT NULL,
  plan           TEXT DEFAULT 'business',
  duration_days  INT  DEFAULT 30,
  max_uses       INT  DEFAULT 1,
  uses_count     INT  DEFAULT 0,
  is_active      BOOLEAN DEFAULT true,
  description    TEXT,
  created_by     TEXT,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS promo_codes_plan_check;
ALTER TABLE promo_codes ADD CONSTRAINT promo_codes_plan_check
  CHECK (plan IN ('starter', 'pro', 'business'));

CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id   UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL,
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  redeemed_at     TIMESTAMPTZ DEFAULT NOW(),
  plan_expires_at TIMESTAMPTZ
);

-- One redemption per (code, user) pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_redemption_unique
  ON promo_code_redemptions (promo_code_id, user_id);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- Public can SELECT active codes (needed for validation on client). The
-- /api/promo/redeem route re-validates + writes via service-role anyway.
DROP POLICY IF EXISTS "public_can_read_active_codes" ON promo_codes;
CREATE POLICY "public_can_read_active_codes"
  ON promo_codes FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "users_can_read_own_redemptions" ON promo_code_redemptions;
CREATE POLICY "users_can_read_own_redemptions"
  ON promo_code_redemptions FOR SELECT
  USING (auth.uid()::text = user_id);

-- Promo fields on organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS promo_code_id    UUID REFERENCES promo_codes(id),
  ADD COLUMN IF NOT EXISTS promo_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_organizations_promo_expires_at
  ON organizations (promo_expires_at)
  WHERE promo_code_id IS NOT NULL;
