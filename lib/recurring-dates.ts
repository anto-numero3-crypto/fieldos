/**
 * Calculate recurring job dates between start and end based on recurrence type.
 *
 * @param start  YYYY-MM-DD
 * @param end    YYYY-MM-DD
 * @param type   'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom'
 * @param days   For weekly/biweekly/custom: ISO day-of-week numbers (1=Mon … 7=Sun).
 *               For monthly: day-of-month (e.g. [15] = 15th of each month).
 * @returns Array of YYYY-MM-DD strings.
 */
export function calculateRecurringDates(
  start: string,
  end: string,
  type: string,
  days: number[] = [],
): string[] {
  const dates: string[] = []
  const startDate = new Date(start + 'T12:00:00')
  const endDate = new Date(end + 'T12:00:00')

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return dates
  if (startDate > endDate) return dates

  const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const jsDay = (d: Date): number => {
    const day = d.getDay()
    return day === 0 ? 7 : day // Mon=1 … Sun=7
  }

  if (type === 'daily') {
    const cur = new Date(startDate)
    while (cur <= endDate) {
      dates.push(toISO(cur))
      cur.setDate(cur.getDate() + 1)
    }
    return dates
  }

  if (type === 'weekly' || type === 'custom') {
    if (!days.length) return dates
    const sorted = [...days].sort((a, b) => a - b)
    const cur = new Date(startDate)
    while (cur <= endDate) {
      if (sorted.includes(jsDay(cur))) {
        dates.push(toISO(cur))
      }
      cur.setDate(cur.getDate() + 1)
    }
    return dates
  }

  if (type === 'biweekly') {
    if (!days.length) return dates
    const sorted = [...days].sort((a, b) => a - b)
    // Week 0 = start week; jobs only on even weeks
    const weekZeroMonday = new Date(startDate)
    const startDayOfWeek = weekZeroMonday.getDay()
    const mondayOffset = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek
    weekZeroMonday.setDate(weekZeroMonday.getDate() + mondayOffset)

    const cur = new Date(startDate)
    while (cur <= endDate) {
      const daysSinceWeekZero = Math.floor(
        (cur.getTime() - weekZeroMonday.getTime()) / 86400000,
      )
      const weekIndex = Math.floor(daysSinceWeekZero / 7)
      if (weekIndex % 2 === 0 && sorted.includes(jsDay(cur))) {
        dates.push(toISO(cur))
      }
      cur.setDate(cur.getDate() + 1)
    }
    return dates
  }

  if (type === 'monthly') {
    const dayOfMonth = days.length > 0 ? days[0] : startDate.getDate()
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1, 12)
    while (cur <= endDate) {
      const lastDay = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate()
      const actualDay = Math.min(dayOfMonth, lastDay)
      const candidate = new Date(cur.getFullYear(), cur.getMonth(), actualDay, 12)
      if (candidate >= startDate && candidate <= endDate) {
        dates.push(toISO(candidate))
      }
      cur.setMonth(cur.getMonth() + 1)
    }
    return dates
  }

  return dates
}

/**
 * Estimate the number of visits for a contract.
 */
export function estimateVisitCount(
  start: string,
  end: string,
  type: string,
  days: number[] = [],
): number {
  return calculateRecurringDates(start, end, type, days).length
}
