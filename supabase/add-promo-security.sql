-- Secure promo code hardening. Safe to re-run.

-- 1. Slug backfill for existing orgs that never got one ─────────────
UPDATE organizations
SET slug = lower(
  regexp_replace(
    regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL AND name IS NOT NULL AND name <> '';

-- 2. Promo-code extensions ──────────────────────────────────────────
ALTER TABLE promo_codes
  ADD COLUMN IF NOT EXISTS code_type             TEXT DEFAULT 'full_access',
  ADD COLUMN IF NOT EXISTS discount_percent      INT,
  ADD COLUMN IF NOT EXISTS discount_months       INT,
  ADD COLUMN IF NOT EXISTS allowed_email_domains TEXT[],
  ADD COLUMN IF NOT EXISTS valid_from            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes                 TEXT,
  ADD COLUMN IF NOT EXISTS created_by_admin      TEXT;

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS promo_codes_code_type_check;
ALTER TABLE promo_codes ADD CONSTRAINT promo_codes_code_type_check
  CHECK (code_type IN ('full_access', 'trial_extension', 'discount', 'lifetime'));

-- Make duration_days nullable so lifetime codes work
DO $$ BEGIN
  EXECUTE 'ALTER TABLE promo_codes ALTER COLUMN duration_days DROP NOT NULL';
EXCEPTION WHEN others THEN NULL; END $$;

-- 3. Brute-force attempt log ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_code_attempts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code_attempted  TEXT NOT NULL,
  user_id         TEXT,
  org_id          UUID,
  ip_address      TEXT,
  user_agent      TEXT,
  success         BOOLEAN DEFAULT false,
  failure_reason  TEXT,
  attempted_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_attempts_user_time
  ON promo_code_attempts (user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_promo_attempts_ip_time
  ON promo_code_attempts (ip_address, attempted_at DESC);

ALTER TABLE promo_code_attempts ENABLE ROW LEVEL SECURITY;
-- Only service role reads this (no SELECT policy for public).
