export function formatTime(time: string | null | undefined, lang: string): string {
  if (!time) return ''
  const parts = time.slice(0, 5).split(':')
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1] || '0', 10)
  if (isNaN(hours) || isNaN(minutes)) return ''

  if (lang === 'fr') {
    return `${hours}h${minutes.toString().padStart(2, '0')}`
  }
  const period = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 || 12
  return `${h12}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function formatTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  lang: string,
): string {
  if (!startTime) return ''
  const start = formatTime(startTime, lang)
  if (!endTime) return start
  const end = formatTime(endTime, lang)
  return `${start} — ${end}`
}
