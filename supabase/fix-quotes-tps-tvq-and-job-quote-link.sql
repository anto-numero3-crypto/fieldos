-- ═══════════════════════════════════════════════════════════════════
-- fix-quotes-tps-tvq-and-job-quote-link.sql
-- ═══════════════════════════════════════════════════════════════════
-- Fixes two bugs reported by a customer (Charles Thibodeau, Mudco
-- finition) on 2026-09-11:
--
-- 1. "Convertir en intervention" on a quote fails with:
--      Could not find the 'quote_id' column of 'jobs' in the schema cache
--    ConvertQuoteModal.tsx, jobs/[id]/page.tsx, and apply-deposit/route.ts
--    all read/write jobs.quote_id, but the column was never added to the
--    jobs table (only invoices got it, and deposits got its own). This
--    adds it.
--
-- 2. Quotes only expose a single freeform "tax rate %" input, unlike
--    invoices' TPS(5%)/TVQ(9.975%) toggle pair. This is both a feature
--    gap and the source of the "taxes always get rounded" complaint:
--    Quebec users naturally type the combined rate with a comma
--    ("14,975"), which a plain <input type=number> silently truncates
--    at the comma. Splitting into two fixed-rate toggles (as invoices
--    already do) removes manual rate entry entirely. This adds the
--    tax_name/tax2_name/tax2_rate/tax2_amount columns quotes needs to
--    mirror invoices' schema (invoices already has these).
-- Idempotent; safe to re-run.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_quote_id ON public.jobs(quote_id);

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS tax_name  TEXT DEFAULT 'TPS',
  ADD COLUMN IF NOT EXISTS tax2_name TEXT DEFAULT 'TVQ',
  ADD COLUMN IF NOT EXISTS tax2_rate DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax2_amount DECIMAL(10,2) DEFAULT 0;
