import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  async redirects() {
    return [
      { source: '/blog', destination: '/blogue', permanent: true },
      { source: '/blog/:slug', destination: '/blogue/:slug', permanent: true },
      { source: '/press', destination: '/contact', permanent: true },
      { source: '/careers', destination: '/contact', permanent: true },
      { source: '/billing', destination: '/settings?tab=billing', permanent: true },
      { source: '/team', destination: '/equipe', permanent: true },
      { source: '/logiciel-plombier', destination: '/', permanent: true },
      { source: '/logiciel-electricien', destination: '/', permanent: true },
      { source: '/logiciel-cvc', destination: '/', permanent: true },
      { source: '/logiciel-hvac', destination: '/', permanent: true },
      { source: '/logiciel-nettoyage', destination: '/', permanent: true },
      { source: '/logiciel-paysagiste', destination: '/', permanent: true },
      { source: '/logiciel-renovateur', destination: '/', permanent: true },
      { source: '/fonctionnalites/soumissions', destination: '/fonctionnalites/devis', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: 'upgrade-insecure-requests' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
};

// Only wrap with Sentry when a DSN is configured (keeps local dev free of Sentry auth errors).
const configured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.SENTRY_AUTH_TOKEN)

export default configured
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      widenClientFileUpload: true,
      sourcemaps: { disable: false },
      disableLogger: true,
    })
  : nextConfig;
