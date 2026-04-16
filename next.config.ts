import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/blog', destination: '/', permanent: true },
      { source: '/blog/:slug', destination: '/', permanent: true },
      { source: '/press', destination: '/contact', permanent: true },
      { source: '/careers', destination: '/contact', permanent: true },
      { source: '/billing', destination: '/settings?tab=billing', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            // Tells the browser to auto-upgrade any http:// subresource
            // request to https:// — eliminates mixed-content warnings
            // without having to track down every dynamic asset URL.
            key: 'Content-Security-Policy',
            value: 'upgrade-insecure-requests',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
