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
