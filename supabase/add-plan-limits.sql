-- Plan enforcement on organizations. Safe to re-run.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'pro',
  ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS next_billing_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_messages_this_month INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_messages_reset_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS jobs_this_month_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Constraints (drop-then-add pattern so the migration is idempotent)
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check
  CHECK (plan IN ('starter', 'pro', 'business'));

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_status_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_plan_status_check
  CHECK (plan_status IN ('trial', 'active', 'past_due', 'cancelled', 'expired'));

-- Helpful index for trial-expiry cron lookups.
CREATE INDEX IF NOT EXISTS idx_organizations_trial_ends_at ON organizations (trial_ends_at)
  WHERE plan_status = 'trial';
