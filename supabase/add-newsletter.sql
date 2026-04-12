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
