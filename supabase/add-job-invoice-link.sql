-- Bi-directional link between jobs and invoices.
-- Safe to run multiple times.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_invoice_id ON jobs (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON invoices (job_id);
