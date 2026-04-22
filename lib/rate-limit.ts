// Simple in-memory sliding-window rate limiter.
// Good enough for protecting public endpoints from casual abuse; Vercel Fluid
// Compute reuses function instances so the counters persist between invocations
// on the same container. For harder guarantees, swap for Upstash Redis later.

import { NextRequest, NextResponse } from 'next/server'

type Bucket = { hits: number[]; firstSeen: number }
const buckets = new Map<string, Bucket>()

// Garbage-collect buckets idle for 30 minutes.
const GC_INTERVAL = 30 * 60 * 1000

function gc() {
  const now = Date.now()
  for (const [key, b] of buckets) {
    if (now - b.firstSeen > GC_INTERVAL && b.hits.length === 0) buckets.delete(key)
  }
}

function ipFrom(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

export function rateLimit(
  req: NextRequest,
  opts: { key?: string; limit: number; windowMs: number }
): NextResponse | null {
  const id = `${opts.key ?? 'default'}:${ipFrom(req)}`
  const now = Date.now()
  const bucket: Bucket = buckets.get(id) ?? { hits: [], firstSeen: now }
  // Drop hits outside the window.
  bucket.hits = bucket.hits.filter((t) => now - t < opts.windowMs)
  if (bucket.hits.length >= opts.limit) {
    const retryAfterSec = Math.ceil((opts.windowMs - (now - bucket.hits[0]!)) / 1000)
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
    )
  }
  bucket.hits.push(now)
  buckets.set(id, bucket)
  if (Math.random() < 0.01) gc() // cheap probabilistic GC
  return null
}
