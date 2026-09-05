-- ═══════════════════════════════════════════════════════════════════
-- add-contracts-table.sql — recurring-contracts feature (backfill)
-- ═══════════════════════════════════════════════════════════════════
-- The `contracts` table (app/api/contracts/*) was created directly against
-- production and never captured in a committed migration — a fresh
-- environment or disaster-recovery restore from these SQL files would be
-- missing it entirely. This reconstructs the table as it exists in
-- production today (columns, defaults, and status values cross-checked
-- against every `.from('contracts')` call in the app and the live data).
--
-- Safe to re-run: CREATE TABLE IF NOT EXISTS, so it's a no-op if the table
-- already exists (e.g. on production). RLS for this table is already
-- applied by supabase/FIX-RLS-LAUNCH.sql (it's in the org_id-scoped table
-- loop) — that script must run after this one on a fresh restore.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'approved', 'client_signed', 'active', 'fully_executed', 'cancelled', 'expired')),

  -- Recurrence schedule
  start_date DATE,
  end_date DATE,
  recurrence_type TEXT,
  recurrence_days JSONB DEFAULT '[]',

  -- Service / pricing
  service_name TEXT,
  service_description TEXT,
  price_per_visit DECIMAL(10,2),
  total_price DECIMAL(10,2),
  billing_type TEXT,
  billing_frequency TEXT,
  include_tps BOOLEAN DEFAULT true,
  include_tvq BOOLEAN DEFAULT true,

  -- Client approval (public token flow)
  approval_token UUID DEFAULT gen_random_uuid(),
  approved_at TIMESTAMPTZ,
  approved_by_name TEXT,

  -- Signatures
  owner_signature TEXT,
  owner_signed_at TIMESTAMPTZ,
  owner_signed_name TEXT,
  client_signature TEXT,
  client_signed_at TIMESTAMPTZ,
  client_signed_name TEXT,
  client_signed_ip TEXT,
  fully_executed_at TIMESTAMPTZ,

  -- Deposit collection (mirrors the quotes deposit fields)
  deposit_required BOOLEAN DEFAULT false,
  deposit_type TEXT CHECK (deposit_type IS NULL OR deposit_type IN ('fixed', 'percentage')),
  deposit_value NUMERIC,
  deposit_taxes_included BOOLEAN DEFAULT false,
  deposit_amount NUMERIC,
  deposit_paid_at TIMESTAMPTZ,
  deposit_payment_intent_id TEXT,
  deposit_charge_id TEXT,
  deposit_refunded_at TIMESTAMPTZ,
  deposit_refunded_amount NUMERIC DEFAULT 0,

  -- Recurring job generation bookkeeping
  jobs_generated_count INTEGER DEFAULT 0,
  last_job_generated_at TIMESTAMPTZ,
  next_job_date DATE,

  notes TEXT,
  internal_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_org_id ON contracts(org_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_approval_token_unique ON contracts(approval_token);
