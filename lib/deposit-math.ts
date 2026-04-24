// Shared deposit calculation logic so quote editor, public quote page,
// Stripe checkout, and invoice conversion all agree on the same number.

export interface DepositInput {
  required: boolean
  type: 'fixed' | 'percentage' | null
  value: number | null                // $ amount when fixed, percent when percentage
  taxesIncluded: boolean               // if true, deposit includes its share of taxes
}

export interface QuoteTotals {
  subtotal: number
  taxAmount: number      // TPS
  tax2Amount: number     // TVQ
  total: number          // final total (subtotal + taxes - discount)
}

// Compute the dollar amount of the deposit.
// - fixed: use deposit.value directly (ignore taxesIncluded since it's already a $ number the merchant set)
// - percentage + taxesIncluded=false: percent of subtotal (pre-tax)
// - percentage + taxesIncluded=true: percent of total (with tax)
// Returns 0 if deposit is not required or the value is invalid.
export function computeDepositAmount(
  deposit: DepositInput,
  totals: QuoteTotals,
): number {
  if (!deposit.required) return 0
  const v = Number(deposit.value)
  if (!Number.isFinite(v) || v <= 0) return 0

  if (deposit.type === 'fixed') {
    return round2(Math.min(v, totals.total))
  }
  if (deposit.type === 'percentage') {
    const pct = Math.min(Math.max(v, 0), 100) / 100
    const base = deposit.taxesIncluded ? totals.total : totals.subtotal
    return round2(base * pct)
  }
  return 0
}

// Balance the customer owes on the final invoice, after the deposit credit.
export function computeInvoiceBalance(invoiceTotal: number, depositApplied: number): number {
  return round2(Math.max(0, invoiceTotal - (depositApplied || 0)))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// Human-friendly description of the deposit configuration for UI/emails.
export function formatDepositLabel(deposit: DepositInput, lang: 'fr' | 'en' = 'fr'): string {
  if (!deposit.required || !deposit.type || !deposit.value) return ''
  if (deposit.type === 'fixed') {
    return `${deposit.value.toFixed(2)} $`
  }
  return lang === 'fr'
    ? `${deposit.value}% ${deposit.taxesIncluded ? 'du total (taxes incluses)' : 'du sous-total'}`
    : `${deposit.value}% ${deposit.taxesIncluded ? 'of total (taxes included)' : 'of subtotal'}`
}
