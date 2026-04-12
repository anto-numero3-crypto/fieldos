# Analytics & SEO — Setup Guide

This guide walks you through connecting Gestivio to Google Analytics 4, Google Search Console, and Google Tag Manager.

## 1. Google Analytics 4

1. Go to https://analytics.google.com and create a GA4 property for `gestivio.ca`.
2. Add a **Web** data stream for `https://gestivio.ca`.
3. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`).
4. In Vercel → fieldos project → Settings → Environment Variables, add:
   - Name: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - Value: `G-XXXXXXXXXX`
   - Environment: Production (and Preview if you want analytics on previews)
5. Trigger a redeploy. GA4 begins tracking page views automatically via `components/GoogleAnalytics.tsx`.

## 2. Google Tag Manager (optional)

GTM lets you add tracking tags (Meta Pixel, LinkedIn Insight, etc.) without code changes.

1. Create a container at https://tagmanager.google.com for `gestivio.ca`.
2. Copy the container ID (format: `GTM-XXXXXXX`).
3. Add env var `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX` in Vercel.
4. Redeploy.

## 3. Google Search Console

1. Go to https://search.google.com/search-console.
2. Add a property: `https://gestivio.ca` (URL prefix).
3. Verify via the **HTML tag** method (easiest with Vercel) — add the verification token in `app/layout.tsx`:
   ```tsx
   verification: { google: 'your-verification-token' }
   ```
   Or use the DNS TXT record method on your domain registrar.
4. Once verified, submit your sitemap: `https://gestivio.ca/sitemap.xml`.
5. Wait 24–72 hours for the first crawl data.

## 4. Connect GSC to GA4

In GA4 → Admin → Product Links → Search Console Links, add your verified property. This surfaces search queries alongside behavior data.

## 5. Google Business Profile (Google My Business)

1. Go to https://business.google.com and create a business profile for "Gestivio".
2. Category: **Software Company**.
3. Add service area (Québec, Canada) — this is a software business, so no physical storefront needed.
4. Verify via postcard or phone (Google's choice).
5. Link to your website and add photos.

This helps you rank in local searches like "logiciel gestion Montréal".

## 6. Conversion tracking

Add these events to GA4 for conversion tracking. In `components/GoogleAnalytics.tsx` you can expose a `gtag` helper, or fire events from pages:

```ts
window.gtag?.('event', 'signup_started', { method: 'email' })
window.gtag?.('event', 'trial_started')
window.gtag?.('event', 'booking_completed', { value: 150, currency: 'CAD' })
```

Mark `signup_started`, `trial_started`, and `booking_completed` as **conversions** in GA4 → Admin → Events.

## 7. Environment variables summary

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX   # optional
```

## 8. Verify everything

After deploy:
- Open https://gestivio.ca, open DevTools → Network → filter `gtag`. You should see requests to `googletagmanager.com`.
- Check GA4 real-time report: your session should appear within 30 seconds.
- Check GSC Coverage report after 72 hours for indexed pages.
