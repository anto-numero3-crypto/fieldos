-- Track onboarding completion explicitly instead of inferring it from
-- customerCount === 0, which false-positives whenever a user skips the
-- optional "add a customer" / "add a job" steps in /onboarding — sending
-- them back into the onboarding wizard on every future code-exchange
-- (email confirmation re-click, magic link, etc.) instead of the dashboard.
-- Safe to run multiple times.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;
