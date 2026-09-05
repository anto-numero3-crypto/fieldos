-- app/api/bookings/custom-request/route.ts:96 writes status: 'custom_request',
-- but the booking_requests.status CHECK constraint from add-booking-system.sql
-- only ever allowed ('pending','confirmed','declined','cancelled','completed',
-- 'no_show') — no migration ever widened it for custom requests. Every
-- "demande de devis personnalisé" submitted via the public booking portal has
-- failed silently (the customer sees a generic "Failed to save request" 500).
-- Zero custom_request rows exist in production, confirming the feature has
-- never worked. Safe to re-run.

ALTER TABLE booking_requests DROP CONSTRAINT IF EXISTS booking_requests_status_check;
ALTER TABLE booking_requests ADD CONSTRAINT booking_requests_status_check
  CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled', 'completed', 'no_show', 'custom_request'));
