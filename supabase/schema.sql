-- ============================================================
-- FieldOS Complete Database Schema
-- Run in Supabase SQL Editor → New Query → Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ORGANIZATIONS (multi-tenant root)
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'pro', 'scale')),
  plan_status TEXT DEFAULT 'trial' CHECK (plan_status IN ('trial', 'active', 'past_due', 'cancelled')),
  logo_url TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'CA',
  website TEXT,
  tax_number TEXT,
  currency TEXT DEFAULT 'CAD',
  timezone TEXT DEFAULT 'America/Toronto',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  seats_limit INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS — enhanced schema
-- ============================================================
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_job_date DATE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES auth.users(id), -- which account owns this org
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'technician' CHECK (role IN ('owner', 'admin', 'dispatcher', 'technician')),
  skills TEXT[] DEFAULT '{}',
  service_areas TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10,2),
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  invite_token TEXT,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- JOBS — enhanced schema
-- ============================================================
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id),
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS service_address TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS labor_hours DECIMAL(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS materials_cost DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invoice_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- QUOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  org_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  quote_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')),
  line_items JSONB DEFAULT '[]',
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  terms TEXT,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  signature_url TEXT,
  converted_to_job_id UUID REFERENCES jobs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVOICES — enhanced schema
-- ============================================================
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id),
  ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'manual',
  stripe_payment_intent_id TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT false,
  link TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  org_id UUID REFERENCES organizations(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CUSTOMER NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Customers RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own customers" ON customers;
CREATE POLICY "Users can manage their own customers"
  ON customers FOR ALL
  USING (auth.uid()::text = user_id);

-- Jobs RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own jobs" ON jobs;
CREATE POLICY "Users can manage their own jobs"
  ON jobs FOR ALL
  USING (auth.uid()::text = user_id);

-- Invoices RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own invoices" ON invoices;
CREATE POLICY "Users can manage their own invoices"
  ON invoices FOR ALL
  USING (auth.uid()::text = user_id);

-- Quotes RLS (user_id is UUID)
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own quotes" ON quotes;
CREATE POLICY "Users can manage their own quotes"
  ON quotes FOR ALL
  USING (auth.uid() = user_id);

-- Team members RLS (owner_user_id is UUID)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own team" ON team_members;
CREATE POLICY "Users can manage their own team"
  ON team_members FOR ALL
  USING (auth.uid() = owner_user_id);

-- Notifications RLS (user_id is UUID)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see their own notifications" ON notifications;
CREATE POLICY "Users see their own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = user_id);

-- Customer notes RLS (user_id in customers is TEXT)
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage notes for their customers" ON customer_notes;
CREATE POLICY "Users can manage notes for their customers"
  ON customer_notes FOR ALL
  USING (
    auth.uid()::text IN (
      SELECT user_id FROM customers WHERE id = customer_notes.customer_id
    )
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS quotes_updated_at ON quotes;
CREATE TRIGGER quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  seq INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq
  FROM invoices
  WHERE user_id = NEW.user_id;
  NEW.invoice_number = 'INV-' || LPAD(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_number ON invoices;
CREATE TRIGGER set_invoice_number BEFORE INSERT ON invoices
  FOR EACH ROW WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION generate_invoice_number();

-- Auto-generate quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  seq INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq
  FROM quotes
  WHERE user_id = NEW.user_id;
  NEW.quote_number = 'QUO-' || LPAD(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_quote_number ON quotes;
CREATE TRIGGER set_quote_number BEFORE INSERT ON quotes
  FOR EACH ROW WHEN (NEW.quote_number IS NULL)
  EXECUTE FUNCTION generate_quote_number();

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
