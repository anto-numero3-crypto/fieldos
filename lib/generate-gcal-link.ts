interface GCalParams {
  title: string
  scheduled_date: string
  start_time: string
  end_time?: string
  address?: string
  description?: string
  customer_name?: string
  customer_phone?: string
}

function toGCalDate(date: string, time: string): string {
  const [h, m] = time.split(':').map(Number)
  const d = date.replace(/-/g, '')
  return `${d}T${String(h).padStart(2, '0')}${String(m || 0).padStart(2, '0')}00`
}

export function generateGoogleCalendarLink(params: GCalParams): string {
  const dtStart = toGCalDate(params.scheduled_date, params.start_time)
  let dtEnd: string
  if (params.end_time) {
    dtEnd = toGCalDate(params.scheduled_date, params.end_time)
  } else {
    const [h, m] = params.start_time.split(':').map(Number)
    const endH = (h + 1) % 24
    dtEnd = toGCalDate(params.scheduled_date, `${endH}:${m || 0}`)
  }

  const descParts: string[] = []
  if (params.customer_name) descParts.push(`Client: ${params.customer_name}`)
  if (params.customer_phone) descParts.push(`Téléphone: ${params.customer_phone}`)
  if (params.address) descParts.push(`Adresse: ${params.address}`)
  if (params.description) descParts.push('', params.description)

  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: params.title,
    dates: `${dtStart}/${dtEnd}`,
  })
  if (descParts.length > 0) p.set('details', descParts.join('\n'))
  if (params.address) p.set('location', params.address)

  return `https://calendar.google.com/calendar/render?${p.toString()}`
}
