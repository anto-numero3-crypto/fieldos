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
  USING (auth.uid() = owner_user_id);

-- Also allow insert when owner_user_id = auth.uid()
DROP POLICY IF EXISTS "Users create their org" ON organizations;
CREATE POLICY "Users create their org"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

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
  ON services FOR ALL USING (auth.uid() = user_id);

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
  ON time_entries FOR ALL USING (auth.uid() = user_id);

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
  ON communications FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Realtime for new tables
-- ============================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE customers;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
