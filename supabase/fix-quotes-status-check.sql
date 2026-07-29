-- The quotes.status CHECK constraint only allowed
-- ('draft', 'sent', 'approved', 'rejected', 'expired') — but the app writes
-- 'accepted' (customer-facing accept, no deposit) and 'converted' (convert
-- to job), so both of those actions fail with:
--   new row for relation "quotes" violates check constraint "quotes_status_check"
-- Widen it to match every status value the app actually writes/displays.
-- Safe to re-run.

ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('draft', 'sent', 'viewed', 'approved', 'accepted', 'rejected', 'converted', 'expired'));
