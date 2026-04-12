export type PricingType =
  | 'fixed'
  | 'starting_from'
  | 'quote_required'
  | 'free'
  | 'hourly'
  | 'custom_range'

export interface PricingInfo {
  pricing_type?: PricingType | string | null
  base_price?: number | null
  price_max?: number | null
  pricing_note?: string | null
}

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  fixed: 'Prix fixe',
  starting_from: 'À partir de',
  quote_required: 'Sur devis',
  free: 'Gratuit',
  hourly: 'Par heure',
  custom_range: 'Fourchette',
}

export function formatPrice(info: PricingInfo, currency: string = 'CAD'): string {
  const type = (info.pricing_type as PricingType) || 'fixed'
  const symbol = currency === 'CAD' || currency === 'USD' ? '$' : currency + ' '
  const p = info.base_price ?? 0
  const max = info.price_max ?? 0
  switch (type) {
    case 'free':
      return 'Gratuit'
    case 'quote_required':
      return 'Sur devis'
    case 'hourly':
      return `${symbol}${p.toFixed(2)}/h`
    case 'starting_from':
      return `À partir de ${symbol}${p.toFixed(2)}`
    case 'custom_range':
      if (max > p) return `${symbol}${p.toFixed(2)} – ${symbol}${max.toFixed(2)}`
      return `${symbol}${p.toFixed(2)}`
    case 'fixed':
    default:
      return `${symbol}${p.toFixed(2)}`
  }
}

export function requiresQuote(info: PricingInfo): boolean {
  return info.pricing_type === 'quote_required'
}

export function isPriced(info: PricingInfo): boolean {
  const t = info.pricing_type
  return t !== 'quote_required' && t !== 'free'
}
