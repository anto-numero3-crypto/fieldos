-- ═══════════════════════════════════════════════════════════════════
-- ADD-DEPOSITS.sql — Deposit collection feature (full version)
-- ═══════════════════════════════════════════════════════════════════
-- Adds automatic deposit collection on quotes, contracts, and jobs,
-- with a single deposits audit table that ties everything together
-- and auto-applies the deposit as a credit on the final invoice.
--
-- Safe to re-run; every statement is idempotent.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Quotes — deposit fields + public token + acceptance fields
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS token text UNIQUE,
  ADD COLUMN IF NOT EXISTS deposit_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_type text CHECK (deposit_type IS NULL OR deposit_type IN ('fixed','percentage')),
  ADD COLUMN IF NOT EXISTS deposit_value numeric,
  ADD COLUMN IF NOT EXISTS deposit_taxes_included boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric,
  ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS deposit_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS deposit_charge_id text,
  ADD COLUMN IF NOT EXISTS deposit_refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS deposit_refunded_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_by_name text,
  ADD COLUMN IF NOT EXISTS accepted_by_email text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz;

-- Backfill tokens for existing quotes
UPDATE public.quotes SET token = gen_random_uuid()::text WHERE token IS NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_token ON public.quotes(token);


-- 2. Contracts — deposit fields
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS deposit_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_type text CHECK (deposit_type IS NULL OR deposit_type IN ('fixed','percentage')),
  ADD COLUMN IF NOT EXISTS deposit_value numeric,
  ADD COLUMN IF NOT EXISTS deposit_taxes_included boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric,
  ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS deposit_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS deposit_charge_id text,
  ADD COLUMN IF NOT EXISTS deposit_refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS deposit_refunded_amount numeric DEFAULT 0;


-- 3. Jobs — standalone deposit fields + public payment token
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS deposit_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric,
  ADD COLUMN IF NOT EXISTS deposit_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS deposit_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS deposit_charge_id text,
  ADD COLUMN IF NOT EXISTS deposit_refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS deposit_refunded_amount numeric DEFAULT 0;


-- 4. Invoices — applied deposit columns + source_quote link
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS deposit_amount_applied numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_paid_date date,
  ADD COLUMN IF NOT EXISTS source_quote_id uuid;

-- Foreign key to quotes (nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'invoices_source_quote_id_fkey' AND table_name = 'invoices'
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_source_quote_id_fkey
      FOREIGN KEY (source_quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL;
  END IF;
END $$;


-- 5. Deposits — audit table that ties every deposit to its source
CREATE TABLE IF NOT EXISTS public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  taxes_included boolean DEFAULT false,
  source text NOT NULL CHECK (source IN ('quote','contract','job')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded','partial_refunded')),
  stripe_payment_intent_id text,
  stripe_charge_id text,
  refunded_amount numeric DEFAULT 0,
  refund_reason text,
  paid_at timestamptz,
  refunded_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deposits_user        ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_quote       ON public.deposits(quote_id);
CREATE INDEX IF NOT EXISTS idx_deposits_contract    ON public.deposits(contract_id);
CREATE INDEX IF NOT EXISTS idx_deposits_job         ON public.deposits(job_id);
CREATE INDEX IF NOT EXISTS idx_deposits_invoice     ON public.deposits(invoice_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status      ON public.deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_payment_intent ON public.deposits(stripe_payment_intent_id);


-- 6. RLS on deposits
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deposits_select ON public.deposits;
DROP POLICY IF EXISTS deposits_insert ON public.deposits;
DROP POLICY IF EXISTS deposits_update ON public.deposits;
DROP POLICY IF EXISTS deposits_delete ON public.deposits;

CREATE POLICY deposits_select ON public.deposits
  FOR SELECT TO authenticated USING ((auth.uid())::text = (user_id)::text);
CREATE POLICY deposits_insert ON public.deposits
  FOR INSERT TO authenticated WITH CHECK ((auth.uid())::text = (user_id)::text);
CREATE POLICY deposits_update ON public.deposits
  FOR UPDATE TO authenticated USING ((auth.uid())::text = (user_id)::text) WITH CHECK ((auth.uid())::text = (user_id)::text);
CREATE POLICY deposits_delete ON public.deposits
  FOR DELETE TO authenticated USING ((auth.uid())::text = (user_id)::text);
