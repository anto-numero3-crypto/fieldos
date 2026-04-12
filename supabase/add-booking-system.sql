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
