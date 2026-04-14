-- Rewrite every http:// asset URL stored in the DB to https://
-- Safe to run multiple times — the WHERE clause filters out already-https rows.

UPDATE organizations
  SET logo_url = REPLACE(logo_url, 'http://', 'https://')
  WHERE logo_url LIKE 'http://%';

UPDATE team_members
  SET avatar_url = REPLACE(avatar_url, 'http://', 'https://')
  WHERE avatar_url LIKE 'http://%';

-- customers.avatar_url / profiles.avatar_url are idempotent updates that
-- will be no-ops if those columns don't exist or hold no http:// rows.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'avatar_url'
  ) THEN
    EXECUTE $sql$
      UPDATE customers
        SET avatar_url = REPLACE(avatar_url, 'http://', 'https://')
        WHERE avatar_url LIKE 'http://%'
    $sql$;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    EXECUTE $sql$
      UPDATE profiles
        SET avatar_url = REPLACE(avatar_url, 'http://', 'https://')
        WHERE avatar_url LIKE 'http://%'
    $sql$;
  END IF;
END $$;
