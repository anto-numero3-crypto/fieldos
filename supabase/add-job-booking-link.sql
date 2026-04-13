-- Link jobs to booking_requests and record provenance.
-- Safe to run multiple times.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS idx_jobs_booking_id ON jobs (booking_id);
