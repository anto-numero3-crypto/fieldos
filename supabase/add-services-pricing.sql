-- Flexible service pricing + custom request support
-- Safe to run multiple times.

-- 1. Pricing flexibility on services
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS pricing_type TEXT DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS price_max DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS pricing_note TEXT,
  ADD COLUMN IF NOT EXISTS buffer_minutes INT DEFAULT 0;

-- Add constraint (drop first so rerunning is safe)
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_pricing_type_check;
ALTER TABLE services ADD CONSTRAINT services_pricing_type_check
  CHECK (pricing_type IN ('fixed', 'starting_from', 'quote_required', 'free', 'hourly', 'custom_range'));

-- 2. Custom-request support on booking_requests
-- Allow a wider status set for custom-request flows; drop+recreate check if present.
ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS request_description TEXT,
  ADD COLUMN IF NOT EXISTS preferred_date TEXT,
  ADD COLUMN IF NOT EXISTS attachments JSONB;

-- Make requested_date / requested_time nullable for custom requests (they may not have a specific slot)
DO $$ BEGIN
  EXECUTE 'ALTER TABLE booking_requests ALTER COLUMN requested_date DROP NOT NULL';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER TABLE booking_requests ALTER COLUMN requested_time DROP NOT NULL';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  EXECUTE 'ALTER TABLE booking_requests ALTER COLUMN service_name DROP NOT NULL';
EXCEPTION WHEN others THEN NULL; END $$;
