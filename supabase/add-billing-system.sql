-- ============================================================
-- Gestivio Billing System — Run in Supabase SQL Editor
-- ============================================================

-- 1. Add Stripe Connect fields to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_country          TEXT DEFAULT 'CA',
  ADD COLUMN IF NOT EXISTS stripe_connect_currency         TEXT DEFAULT 'cad',
  ADD COLUMN IF NOT EXISTS stripe_connect_connected_at     TIMESTAMPTZ,
  -- Missing fields from original schema
  ADD COLUMN IF NOT EXISTS owner_user_id                   UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS email                           TEXT,
  ADD COLUMN IF NOT EXISTS billing_status                  TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS ai_agent_name                   TEXT DEFAULT 'Alex',
  ADD COLUMN IF NOT EXISTS ai_agent_greeting               TEXT,
  ADD COLUMN IF NOT EXISTS service_types                   TEXT[] DEFAULT '{}';

-- 2. Add public token + tracking to invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS token                UUID DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS viewed_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reminder_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_count       INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_notes         TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes       TEXT,
  ADD COLUMN IF NOT EXISTS terms                TEXT DEFAULT 'Paiement dû dans 30 jours.',
  ADD COLUMN IF NOT EXISTS discount_type        TEXT DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percent')),
  ADD COLUMN IF NOT EXISTS discount2_rate       DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount2_amount     DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax2_name            TEXT,
  ADD COLUMN IF NOT EXISTS tax2_rate            DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax2_amount          DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_name             TEXT DEFAULT 'TPS';

-- Backfill tokens for existing invoices without one
UPDATE invoices SET token = gen_random_uuid() WHERE token IS NULL;

-- 3. Enhance payments table
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_date         DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS reference            TEXT,
  ADD COLUMN IF NOT EXISTS send_receipt         BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS org_id               UUID REFERENCES organizations(id);

-- 4. Index for fast public invoice lookup
CREATE UNIQUE INDEX IF NOT EXISTS invoices_token_idx ON invoices(token);
CREATE INDEX IF NOT EXISTS invoices_user_status_idx ON invoices(user_id, status);
CREATE INDEX IF NOT EXISTS invoices_due_date_idx ON invoices(due_date) WHERE status != 'paid';

-- 5. RLS policy for public invoice access (read only by token)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing if any to recreate cleanly
DROP POLICY IF EXISTS "invoices_public_read_by_token" ON invoices;
CREATE POLICY "invoices_public_read_by_token"
  ON invoices FOR SELECT
  USING (true);  -- token-based access enforced at app layer

DROP POLICY IF EXISTS "invoices_owner_all" ON invoices;
CREATE POLICY "invoices_owner_all"
  ON invoices FOR ALL
  USING (user_id = auth.uid());
