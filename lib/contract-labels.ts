export function getBillingTypeLabel(type: string, lang: string): string {
  const m: Record<string, [string, string]> = {
    per_visit: ['Par visite', 'Per visit'],
    monthly: ['Mensuelle', 'Monthly'],
    seasonal: ['Saisonnière', 'Seasonal'],
    custom: ['Personnalisée', 'Custom'],
  }
  return (m[type] || [type, type])[lang === 'fr' ? 0 : 1]
}

export function getBillingFrequencyLabel(freq: string, lang: string): string {
  const m: Record<string, [string, string]> = {
    per_visit: ['Par visite', 'Per visit'],
    weekly: ['Hebdomadaire', 'Weekly'],
    monthly: ['Mensuelle', 'Monthly'],
    quarterly: ['Trimestrielle', 'Quarterly'],
    seasonal: ['Saisonnière', 'Seasonal'],
  }
  return (m[freq] || [freq, freq])[lang === 'fr' ? 0 : 1]
}

export function getRecurrenceLabel(type: string, lang: string): string {
  const m: Record<string, [string, string]> = {
    none: ['Aucune', 'None'],
    daily: ['Quotidienne', 'Daily'],
    weekly: ['Hebdomadaire', 'Weekly'],
    biweekly: ['Aux 2 semaines', 'Biweekly'],
    monthly: ['Mensuelle', 'Monthly'],
    custom: ['Personnalisée', 'Custom'],
  }
  return (m[type] || [type, type])[lang === 'fr' ? 0 : 1]
}

export function getDayLabels(days: number[], lang: string): string {
  const names = lang === 'fr'
    ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days.map(d => names[d] || '').filter(Boolean).join(', ')
}
