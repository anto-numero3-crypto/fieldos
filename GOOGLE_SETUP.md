# Google Calendar integration — setup

Complete these steps once in the Google Cloud Console, then add the three variables to Vercel + `.env.local`.

## 1. Create Google Cloud project

1. Go to https://console.cloud.google.com
2. Click the project picker (top left) → **New Project**
3. Name: `Gestivio`
4. Click **Create** and wait for it to finish provisioning, then select the project.

## 2. Enable Google Calendar API

1. In the left sidebar → **APIs & Services** → **Library**
2. Search for **Google Calendar API**
3. Click it → **Enable**

## 3. Configure the OAuth consent screen

1. **APIs & Services** → **OAuth consent screen**
2. User type: **External** → **Create**
3. App name: `Gestivio`
4. User support email: your email
5. Developer contact: your email
6. Save and continue through the **Scopes** step — you can leave scopes blank here (they are requested per-session).
7. On **Test users**, add the Google accounts you plan to connect during development (while the app is in "Testing" state, only these accounts can authorize).
8. Save.

## 4. Create OAuth 2.0 Client ID

1. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**
2. Application type: **Web application**
3. Name: `Gestivio Web`
4. **Authorized redirect URIs** — add both:
   - `https://gestivio.ca/api/integrations/google/callback`
   - `http://localhost:3000/api/integrations/google/callback`  *(local dev)*
5. **Create**
6. Copy the **Client ID** and **Client secret** from the dialog.

## 5. Add env vars to Vercel and `.env.local`

```
GOOGLE_CLIENT_ID=<client id from step 4>
GOOGLE_CLIENT_SECRET=<client secret from step 4>
GOOGLE_REDIRECT_URI=https://gestivio.ca/api/integrations/google/callback
```

For local dev, set `GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback` in `.env.local`.

Add on Vercel:
```
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add GOOGLE_REDIRECT_URI production
```

Redeploy after adding.

## 6. Run the SQL migration

Paste into Supabase SQL editor and run:

```sql
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS google_calendar_access_token TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_token_expiry TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_calendar_email TEXT;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;
```

## 7. Publish the app (production)

While in **Testing** mode, only listed test users can connect and refresh tokens expire after 7 days. For real users:

1. **OAuth consent screen** → **Publish app**
2. Google may require verification if you request sensitive scopes. Calendar scopes are sensitive, so expect a verification review (submit a demo video and homepage + privacy policy URLs). `gestivio.ca` already has both.

## Test the flow

1. Go to `/settings?tab=integrations`
2. Click **Connecter Google Calendar**
3. Approve on the Google consent screen
4. You should be redirected back to the settings page with a "Connecté" badge and your Google email
5. Create a job with a scheduled date → open Google Calendar → the event should appear within a second or two
6. Edit the job's date/time → event updates
7. Delete the job → event disappears
