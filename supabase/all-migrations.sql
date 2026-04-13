-- ═══════════════════════════════════════════════════════════════════
-- FieldOS / Gestivio — CONSOLIDATED MIGRATION
-- Run top-to-bottom in Supabase SQL editor. Idempotent.
-- ═══════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────
-- schema.sql
-- ─────────────────────────────────────────────────────────────────
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
  USING ((auth.uid())::text = (user_id)::text);

-- Team members RLS (owner can manage their team)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own team" ON team_members;
CREATE POLICY "Users can manage their own team"
  ON team_members FOR ALL
  USING ((auth.uid())::text = (owner_user_id)::text);

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see their own notifications" ON notifications;
CREATE POLICY "Users see their own notifications"
  ON notifications FOR ALL
  USING ((auth.uid())::text = (user_id)::text);

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
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['jobs','invoices','quotes','notifications'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;


-- ─────────────────────────────────────────────────────────────────
-- migrations.sql
-- ─────────────────────────────────────────────────────────────────
-- ============================================================
-- FieldOS Schema Migrations
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- Add missing columns to organizations table
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip TEXT,
  ADD COLUMN IF NOT EXISTS tax_number TEXT,
  ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS ai_agent_name TEXT DEFAULT 'Alex',
  ADD COLUMN IF NOT EXISTS ai_agent_greeting TEXT,
  ADD COLUMN IF NOT EXISTS service_types TEXT[] DEFAULT '{}';

-- Drop old RLS if any, add correct one for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their own org" ON organizations;
CREATE POLICY "Users manage their own org"
  ON organizations FOR ALL
  USING ((auth.uid())::text = (owner_user_id)::text);

-- Also allow insert when owner_user_id = auth.uid()
DROP POLICY IF EXISTS "Users create their org" ON organizations;
CREATE POLICY "Users create their org"
  ON organizations FOR INSERT
  WITH CHECK ((auth.uid())::text = (owner_user_id)::text);

-- ============================================================
-- SERVICES CATALOG
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  base_price DECIMAL(10,2) DEFAULT 0,
  unit TEXT DEFAULT 'flat',
  duration_minutes INT DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their services" ON services;
CREATE POLICY "Users manage their services"
  ON services FOR ALL USING ((auth.uid())::text = (user_id)::text);

-- ============================================================
-- TIME ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  clocked_in_at TIMESTAMPTZ,
  clocked_out_at TIMESTAMPTZ,
  duration_minutes INT,
  notes TEXT,
  billable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their time entries" ON time_entries;
CREATE POLICY "Users manage their time entries"
  ON time_entries FOR ALL USING ((auth.uid())::text = (user_id)::text);

-- ============================================================
-- BOOKINGS (from AI booking portal)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  service_type TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  converted_to_job_id UUID REFERENCES jobs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings are public (no auth needed) — allow insert for anonymous
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create a booking" ON bookings;
CREATE POLICY "Anyone can create a booking"
  ON bookings FOR INSERT WITH CHECK (true);

-- ============================================================
-- COMMUNICATIONS LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS communications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'email' CHECK (type IN ('email', 'sms', 'call', 'note')),
  subject TEXT,
  body TEXT,
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their communications" ON communications;
CREATE POLICY "Users manage their communications"
  ON communications FOR ALL USING ((auth.uid())::text = (user_id)::text);

-- ============================================================
-- Realtime for new tables
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers','team_members'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;


-- ─────────────────────────────────────────────────────────────────
-- add-billing-system.sql
-- ─────────────────────────────────────────────────────────────────
-- ============================================================
-- Gestivio Billing System — Run in Supabase SQL Editor
-- ============================================================

-- 1a. Add Stripe Connect fields to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id          TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_country             TEXT DEFAULT 'CA',
  ADD COLUMN IF NOT EXISTS stripe_connect_currency            TEXT DEFAULT 'cad',
  ADD COLUMN IF NOT EXISTS stripe_connect_connected_at        TIMESTAMPTZ;

-- 1b. Add missing base fields to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS owner_user_id   UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS email           TEXT,
  ADD COLUMN IF NOT EXISTS billing_status  TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS ai_agent_name   TEXT DEFAULT 'Alex',
  ADD COLUMN IF NOT EXISTS ai_agent_greeting TEXT,
  ADD COLUMN IF NOT EXISTS service_types   TEXT[] DEFAULT '{}';

-- 2. Add public token + tracking fields to invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS token           UUID DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS viewed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_count  INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_notes    TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes  TEXT,
  ADD COLUMN IF NOT EXISTS terms           TEXT DEFAULT 'Paiement dû dans 30 jours.',
  ADD COLUMN IF NOT EXISTS discount_type   TEXT DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percent')),
  ADD COLUMN IF NOT EXISTS discount2_rate  DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount2_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_name        TEXT DEFAULT 'TPS',
  ADD COLUMN IF NOT EXISTS tax2_name       TEXT,
  ADD COLUMN IF NOT EXISTS tax2_rate       DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax2_amount     DECIMAL(10,2) DEFAULT 0;

-- Backfill tokens for any existing invoices that don't have one
UPDATE invoices SET token = gen_random_uuid() WHERE token IS NULL;

-- 3. Add fields to payments table
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_date  DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS reference     TEXT,
  ADD COLUMN IF NOT EXISTS send_receipt  BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS org_id        UUID REFERENCES organizations(id);

-- 4. Indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS invoices_token_idx        ON invoices(token);
CREATE INDEX        IF NOT EXISTS invoices_user_status_idx  ON invoices(user_id, status);
CREATE INDEX        IF NOT EXISTS invoices_due_date_idx     ON invoices(due_date) WHERE status != 'paid';

-- 5. RLS policies for invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_public_read_by_token" ON invoices;
CREATE POLICY "invoices_public_read_by_token"
  ON invoices FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "invoices_owner_all" ON invoices;
CREATE POLICY "invoices_owner_all"
  ON invoices FOR ALL
  USING ((user_id)::text = (auth.uid())::text);


-- ─────────────────────────────────────────────────────────────────
-- add-services-pricing.sql
-- ─────────────────────────────────────────────────────────────────
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


-- ─────────────────────────────────────────────────────────────────
-- add-booking-system.sql
-- ─────────────────────────────────────────────────────────────────
-- ============================================================
-- FieldOS / Gestivio — Online Booking System
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add slug to organizations (used as public booking URL key)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Backfill slugs from org name for existing orgs
UPDATE organizations
  SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
  WHERE slug IS NULL AND name IS NOT NULL;

-- 2. Availability settings (one row per user)
CREATE TABLE IF NOT EXISTS availability_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  org_id UUID REFERENCES organizations(id),
  timezone TEXT DEFAULT 'America/Toronto',
  auto_accept BOOLEAN DEFAULT false,
  advance_booking_days INT DEFAULT 60,
  minimum_notice_hours INT DEFAULT 24,
  slot_duration_minutes INT DEFAULT 60,
  buffer_minutes INT DEFAULT 15,
  booking_page_title TEXT DEFAULT 'Book an Appointment',
  booking_page_description TEXT,
  booking_page_color TEXT DEFAULT '#4f46e5',
  confirmation_message TEXT,
  cancellation_policy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Weekly availability schedule (0=Sun, 1=Mon … 6=Sat)
CREATE TABLE IF NOT EXISTS availability_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_available BOOLEAN DEFAULT true,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  UNIQUE (user_id, day_of_week)
);

-- 4. Date-specific overrides (holidays, vacations, special hours)
CREATE TABLE IF NOT EXISTS availability_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT false,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  UNIQUE (user_id, date)
);

-- 5. Booking requests from customers
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  org_id UUID REFERENCES organizations(id),
  service_id UUID,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  service_name TEXT NOT NULL,
  service_price DECIMAL(10,2),
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  requested_end_time TIME,
  duration_minutes INT DEFAULT 60,
  notes TEXT,
  internal_notes TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','declined','cancelled','completed','no_show')),
  auto_accepted BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  confirmed_by TEXT,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  reminder_sent_at TIMESTAMPTZ,
  converted_to_job_id UUID REFERENCES jobs(id),
  source TEXT DEFAULT 'booking_page',
  token UUID DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS booking_requests_user_status_idx ON booking_requests(user_id, status);
CREATE INDEX IF NOT EXISTS booking_requests_date_idx ON booking_requests(requested_date);
CREATE UNIQUE INDEX IF NOT EXISTS booking_requests_token_idx ON booking_requests(token);

-- 7. RLS
ALTER TABLE availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

-- Owner: full access
DROP POLICY IF EXISTS "owners_manage_availability_settings" ON availability_settings;
CREATE POLICY "owners_manage_availability_settings"
  ON availability_settings FOR ALL
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "owners_manage_availability_schedule" ON availability_schedule;
CREATE POLICY "owners_manage_availability_schedule"
  ON availability_schedule FOR ALL
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "owners_manage_availability_overrides" ON availability_overrides;
CREATE POLICY "owners_manage_availability_overrides"
  ON availability_overrides FOR ALL
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "owners_manage_booking_requests" ON booking_requests;
CREATE POLICY "owners_manage_booking_requests"
  ON booking_requests FOR ALL
  USING (auth.uid()::text = user_id);

-- Public: read availability to show booking page
DROP POLICY IF EXISTS "public_read_availability_settings" ON availability_settings;
CREATE POLICY "public_read_availability_settings"
  ON availability_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_availability_schedule" ON availability_schedule;
CREATE POLICY "public_read_availability_schedule"
  ON availability_schedule FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_availability_overrides" ON availability_overrides;
CREATE POLICY "public_read_availability_overrides"
  ON availability_overrides FOR SELECT USING (true);

-- Public: create + read bookings (for booking flow and cancel/reschedule by token)
DROP POLICY IF EXISTS "public_insert_booking_requests" ON booking_requests;
CREATE POLICY "public_insert_booking_requests"
  ON booking_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_booking_requests" ON booking_requests;
CREATE POLICY "public_read_booking_requests"
  ON booking_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_update_booking_requests" ON booking_requests;
CREATE POLICY "public_update_booking_requests"
  ON booking_requests FOR UPDATE USING (true);

-- Also allow public read on services so booking page can show them
DROP POLICY IF EXISTS "public_read_services" ON services;
CREATE POLICY "public_read_services"
  ON services FOR SELECT USING (true);

-- Allow public read on organizations for booking page
DROP POLICY IF EXISTS "public_read_organizations" ON organizations;
CREATE POLICY "public_read_organizations"
  ON organizations FOR SELECT USING (true);


-- ─────────────────────────────────────────────────────────────────
-- add-newsletter.sql
-- ─────────────────────────────────────────────────────────────────
-- Newsletter subscribers — CASL compliant, stores consent + source.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL UNIQUE,
  locale       TEXT DEFAULT 'fr',
  source       TEXT,
  consented_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed    BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  unsubscribed BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- Public INSERT allowed (signup from marketing pages)
DROP POLICY IF EXISTS "public_subscribe" ON newsletter_subscribers;
CREATE POLICY "public_subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
-- Only service role can read (no SELECT policy for public)


-- ─────────────────────────────────────────────────────────────────
-- add-plan-limits.sql
-- ─────────────────────────────────────────────────────────────────
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


-- ─────────────────────────────────────────────────────────────────
-- add-signup-trigger.sql
-- ─────────────────────────────────────────────────────────────────
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


-- ─────────────────────────────────────────────────────────────────
-- add-promo-codes.sql
-- ─────────────────────────────────────────────────────────────────
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


-- ─────────────────────────────────────────────────────────────────
-- add-promo-security.sql
-- ─────────────────────────────────────────────────────────────────
-- Secure promo code hardening. Safe to re-run.

-- 1. Slug backfill for existing orgs that never got one ─────────────
UPDATE organizations
SET slug = lower(
  regexp_replace(
    regexp_replace(name, '[^a-zA-Z0-9[:space:]-]', '', 'g'),
    '[[:space:]]+', '-', 'g'
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


-- ─────────────────────────────────────────────────────────────────
-- add-performance-indexes.sql
-- ─────────────────────────────────────────────────────────────────
-- Performance indexes for common query patterns. Safe to re-run.

CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date
  ON jobs (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id
  ON jobs (customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_status
  ON jobs (user_id, status);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id
  ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_status
  ON invoices (user_id, status);

CREATE INDEX IF NOT EXISTS idx_customers_user_id
  ON customers (user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_email
  ON customers (user_id, email);

CREATE INDEX IF NOT EXISTS idx_booking_requests_user_status
  ON booking_requests (user_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_customer_id
  ON booking_requests (customer_id);


-- ─────────────────────────────────────────────────────────────────
-- availability-and-invoice-fixes.sql
-- ─────────────────────────────────────────────────────────────────
-- Ensure the upsert on availability_schedule has a matching unique key
ALTER TABLE availability_schedule
  DROP CONSTRAINT IF EXISTS availability_schedule_user_id_day_of_week_key;
ALTER TABLE availability_schedule
  ADD CONSTRAINT availability_schedule_user_id_day_of_week_key
  UNIQUE (user_id, day_of_week);

-- Availability schedule RLS (owner manages own rows)
DROP POLICY IF EXISTS "owners_manage_schedule" ON availability_schedule;
CREATE POLICY "owners_manage_schedule"
  ON availability_schedule FOR ALL
  USING ((user_id)::text = (auth.uid())::text)
  WITH CHECK ((user_id)::text = (auth.uid())::text);

-- Invoice policies — drop all old variants, recreate with text cast.
-- Permissive OR handles any shape (uuid/text) user_id was written as.
DROP POLICY IF EXISTS "invoices_owner_select" ON invoices;
DROP POLICY IF EXISTS "invoices_owner_all" ON invoices;
DROP POLICY IF EXISTS "invoices_public_read_by_token" ON invoices;

CREATE POLICY "invoices_owner_all"
  ON invoices FOR ALL
  USING ((user_id)::text = (auth.uid())::text)
  WITH CHECK ((user_id)::text = (auth.uid())::text);

-- Public token-based read remains open so /invoice/[token] page works
CREATE POLICY "invoices_public_read_by_token"
  ON invoices FOR SELECT
  USING (true);


-- ─────────────────────────────────────────────────────────────────
-- add-job-booking-link.sql
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL;
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_booking_id ON jobs (booking_id);
CREATE INDEX IF NOT EXISTS idx_jobs_invoice_id ON jobs (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON invoices (job_id);


-- ─────────────────────────────────────────────────────────────────
-- security-audit-rls.sql
-- ─────────────────────────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════════════════
-- Security Audit: Row Level Security (RLS)
-- Run this in the Supabase SQL editor to enable RLS on all tables
-- and install the correct owner-scoped policies.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Audit which tables have RLS disabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- ── Per-user tables (owner = auth.uid() matches user_id) ──────────
-- customers, jobs, invoices, quotes, booking_requests, availability_*,
-- notifications, services, payments (via invoice).

ALTER TABLE public.customers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_schedule   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_overrides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_redemptions  ENABLE ROW LEVEL SECURITY;

-- ── Generic helper macro pattern ──────────────────────────────────
-- For every "user_id owner" table we install identical 4 policies.
-- Drop-then-create to make this script idempotent.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','jobs','invoices','quotes','booking_requests',
    'availability_settings','availability_schedule','availability_overrides',
    'notifications','services'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON public.%I', t, t);

    EXECUTE format(
      'CREATE POLICY %I_select ON public.%I FOR SELECT USING ((auth.uid())::text = (user_id)::text)', t, t);
    EXECUTE format(
      'CREATE POLICY %I_insert ON public.%I FOR INSERT WITH CHECK ((auth.uid())::text = (user_id)::text)', t, t);
    EXECUTE format(
      'CREATE POLICY %I_update ON public.%I FOR UPDATE USING ((auth.uid())::text = (user_id)::text) WITH CHECK ((auth.uid())::text = (user_id)::text)', t, t);
    EXECUTE format(
      'CREATE POLICY %I_delete ON public.%I FOR DELETE USING ((auth.uid())::text = (user_id)::text)', t, t);
  END LOOP;
END $$;

-- ── organizations: scoped by owner_user_id ────────────────────────
DROP POLICY IF EXISTS organizations_select ON public.organizations;
DROP POLICY IF EXISTS organizations_insert ON public.organizations;
DROP POLICY IF EXISTS organizations_update ON public.organizations;
DROP POLICY IF EXISTS organizations_delete ON public.organizations;

CREATE POLICY organizations_select ON public.organizations
  FOR SELECT USING ((auth.uid())::text = (owner_user_id)::text);
CREATE POLICY organizations_insert ON public.organizations
  FOR INSERT WITH CHECK ((auth.uid())::text = (owner_user_id)::text);
CREATE POLICY organizations_update ON public.organizations
  FOR UPDATE USING ((auth.uid())::text = (owner_user_id)::text) WITH CHECK ((auth.uid())::text = (owner_user_id)::text);
-- No client-side delete for organizations

-- ── team_members: owner scopes by owner_user_id ──────────────────
DROP POLICY IF EXISTS team_members_select_owner  ON public.team_members;
DROP POLICY IF EXISTS team_members_select_member ON public.team_members;
DROP POLICY IF EXISTS team_members_modify_owner  ON public.team_members;

CREATE POLICY team_members_modify_owner ON public.team_members
  FOR ALL USING ((auth.uid())::text = (owner_user_id)::text) WITH CHECK ((auth.uid())::text = (owner_user_id)::text);

-- ── payments: readable by invoice owner; writes via service role only ─
DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = payments.invoice_id AND (i.user_id)::text = (auth.uid())::text
    )
  );

-- ── promo_codes: owner-admin only (service role bypasses RLS anyway) ─
DROP POLICY IF EXISTS promo_codes_no_anon ON public.promo_codes;
CREATE POLICY promo_codes_no_anon ON public.promo_codes
  FOR SELECT USING (false);
-- Writes happen only via service role (admin/promo route).

-- ── promo_code_redemptions: users can see their own redemptions ──
DROP POLICY IF EXISTS promo_code_redemptions_select ON public.promo_code_redemptions;
CREATE POLICY promo_code_redemptions_select ON public.promo_code_redemptions
  FOR SELECT USING ((auth.uid())::text = (user_id)::text);

-- ── promo_code_attempts: no client access (abuse log) ─────────────
DROP POLICY IF EXISTS promo_code_attempts_no_anon ON public.promo_code_attempts;
CREATE POLICY promo_code_attempts_no_anon ON public.promo_code_attempts
  FOR ALL USING (false);

-- ── Post-check: every public table should now have rowsecurity = true ─
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

