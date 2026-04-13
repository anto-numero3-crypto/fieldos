#!/usr/bin/env node
/* eslint-disable no-console */
// One-shot script to create Gestivio Stripe products + prices.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_... node scripts/create-stripe-products.js
//
// Output prints env-var lines to add to your Vercel project.
// Safe to re-run: it looks up existing products by metadata.gestivio_plan
// and only creates missing ones.

const Stripe = require('stripe')

const KEY = process.env.STRIPE_SECRET_KEY
if (!KEY) {
  console.error('STRIPE_SECRET_KEY env var is required.')
  process.exit(1)
}

const stripe = new Stripe(KEY)

const PLANS = [
  { id: 'starter',  name: 'Gestivio Starter',  monthly: 4900,  annual: 46800  }, // $49 / $39*12
  { id: 'pro',      name: 'Gestivio Pro',      monthly: 9900,  annual: 94800  }, // $99 / $79*12
  { id: 'business', name: 'Gestivio Business', monthly: 17900, annual: 171600 }, // $179 / $143*12
]

async function findOrCreateProduct(plan) {
  const existing = await stripe.products.search({
    query: `metadata['gestivio_plan']:'${plan.id}' AND active:'true'`,
    limit: 1,
  })
  if (existing.data.length > 0) return existing.data[0]
  return stripe.products.create({
    name: plan.name,
    metadata: { gestivio_plan: plan.id },
  })
}

async function findOrCreatePrice(product, planId, interval, unitAmount) {
  const existing = await stripe.prices.search({
    query: `product:'${product.id}' AND active:'true' AND metadata['gestivio_interval']:'${interval}'`,
    limit: 1,
  })
  if (existing.data.length > 0) return existing.data[0]
  return stripe.prices.create({
    product: product.id,
    unit_amount: unitAmount,
    currency: 'cad',
    recurring: { interval: interval === 'annual' ? 'year' : 'month' },
    metadata: { gestivio_plan: planId, gestivio_interval: interval },
  })
}

;(async () => {
  const envLines = []
  for (const plan of PLANS) {
    const product = await findOrCreateProduct(plan)
    console.log(`✓ Product ${plan.name} -> ${product.id}`)

    const monthly = await findOrCreatePrice(product, plan.id, 'monthly', plan.monthly)
    const annual  = await findOrCreatePrice(product, plan.id, 'annual',  plan.annual)
    console.log(`  · monthly ${monthly.id}`)
    console.log(`  · annual  ${annual.id}`)
    envLines.push(`STRIPE_PRICE_${plan.id.toUpperCase()}_MONTHLY=${monthly.id}`)
    envLines.push(`STRIPE_PRICE_${plan.id.toUpperCase()}_ANNUAL=${annual.id}`)
  }
  console.log('\n=== Add these to Vercel env vars ===')
  for (const line of envLines) console.log(line)
})().catch((err) => { console.error(err); process.exit(1) })
