interface ICSParams {
  uid: string
  title: string
  scheduled_date: string
  start_time: string
  end_time?: string
  address?: string
  description?: string
  customer_name?: string
  customer_phone?: string
  organizer_email?: string
  organizer_name?: string
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function foldLine(line: string): string {
  const parts: string[] = []
  let remaining = line
  while (remaining.length > 75) {
    parts.push(remaining.slice(0, 75))
    remaining = ' ' + remaining.slice(75)
  }
  parts.push(remaining)
  return parts.join('\r\n')
}

function toUTC(date: string, time: string): string {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00`)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  const hr = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${y}${mo}${da}T${hr}${mi}00`
}

export function generateICS(params: ICSParams): string {
  const dtStart = toUTC(params.scheduled_date, params.start_time)
  let dtEnd: string
  if (params.end_time) {
    dtEnd = toUTC(params.scheduled_date, params.end_time)
  } else {
    const [h, m] = params.start_time.split(':').map(Number)
    const endH = (h + 1) % 24
    dtEnd = toUTC(params.scheduled_date, `${endH}:${m || 0}`)
  }

  const now = new Date()
  const dtStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}Z`

  const descParts: string[] = []
  if (params.description) descParts.push(params.description)
  if (params.customer_name) descParts.push(`Client: ${params.customer_name}`)
  if (params.customer_phone) descParts.push(`Téléphone: ${params.customer_phone}`)
  if (params.address) descParts.push(`Adresse: ${params.address}`)

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gestivio//Gestivio//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${params.uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=America/Toronto:${dtStart}`,
    `DTEND;TZID=America/Toronto:${dtEnd}`,
    `SUMMARY:${escapeText(params.title)}`,
    `STATUS:CONFIRMED`,
  ]

  if (descParts.length > 0) lines.push(`DESCRIPTION:${escapeText(descParts.join('\\n'))}`)
  if (params.address) lines.push(`LOCATION:${escapeText(params.address)}`)
  if (params.organizer_email) {
    const cn = params.organizer_name ? `;CN=${escapeText(params.organizer_name)}` : ''
    lines.push(`ORGANIZER${cn}:mailto:${params.organizer_email}`)
  }

  lines.push('END:VEVENT', 'END:VCALENDAR')

  return lines.map(foldLine).join('\r\n') + '\r\n'
}
