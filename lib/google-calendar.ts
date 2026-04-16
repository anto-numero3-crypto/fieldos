import { adminClient } from './supabase-server'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'openid',
  'email',
].join(' ')

export function buildAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  if (!clientId || !redirectUri) throw new Error('Google OAuth env vars missing')
  const p = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
    include_granted_scopes: 'true',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`
}

export async function exchangeCodeForTokens(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    grant_type: 'authorization_code',
  })
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`)
  return res.json() as Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
    id_token?: string
    scope?: string
    token_type?: string
  }>
}

function decodeIdTokenEmail(idToken?: string): string | null {
  if (!idToken) return null
  try {
    const payload = idToken.split('.')[1]
    const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    return typeof json.email === 'string' ? json.email : null
  } catch { return null }
}

export async function getValidAccessToken(orgId: string): Promise<string | null> {
  const supabase = adminClient()
  const { data: org, error } = await supabase
    .from('organizations')
    .select('google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry, google_calendar_connected')
    .eq('id', orgId)
    .single()
  if (error) {
    console.error('[google-calendar] org fetch failed:', error)
    return null
  }
  if (!org) {
    console.warn(`[google-calendar] org ${orgId} not found`)
    return null
  }
  if (!org.google_calendar_connected) {
    console.log(`[google-calendar] org ${orgId} not connected`)
    return null
  }
  if (!org.google_calendar_refresh_token) {
    console.error(`[google-calendar] org ${orgId} has no refresh token — connect flow likely failed`)
    return null
  }

  const expiry = org.google_calendar_token_expiry ? new Date(org.google_calendar_token_expiry).getTime() : 0
  const buffer = 60_000
  if (org.google_calendar_access_token && Date.now() + buffer < expiry) {
    return org.google_calendar_access_token
  }

  console.log(`[google-calendar] refreshing access token for org ${orgId}`)
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: org.google_calendar_refresh_token,
    grant_type: 'refresh_token',
  })
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    console.error(`[google-calendar] refresh failed (${res.status}):`, await res.text())
    return null
  }
  const tok = await res.json() as { access_token: string; expires_in: number }
  const newExpiry = new Date(Date.now() + tok.expires_in * 1000).toISOString()
  const { error: upErr } = await supabase
    .from('organizations')
    .update({
      google_calendar_access_token: tok.access_token,
      google_calendar_token_expiry: newExpiry,
    })
    .eq('id', orgId)
  if (upErr) console.error('[google-calendar] failed to save refreshed token:', upErr)
  return tok.access_token
}

export async function revokeToken(token: string) {
  try {
    await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: 'POST' })
  } catch (err) {
    console.error('[google-calendar] revoke failed:', err)
  }
}

export function savedEmailFromIdToken(idToken?: string) {
  return decodeIdTokenEmail(idToken)
}

type JobLike = {
  id: string
  title: string | null
  description: string | null
  scheduled_date: string | null
  start_time: string | null
  end_time: string | null
  service_address: string | null
  address?: string | null
  google_event_id?: string | null
  customers?: { name?: string | null; phone?: string | null; email?: string | null } | null
}

function normalizeTime(t: string): string {
  const parts = t.split(':')
  const h = (parts[0] || '00').padStart(2, '0')
  const m = (parts[1] || '00').padStart(2, '0')
  const s = (parts[2] || '00').padStart(2, '0').slice(0, 2)
  return `${h}:${m}:${s}`
}

function buildEventPayload(job: JobLike, timezone: string) {
  if (!job.scheduled_date) return null
  const startTime = job.start_time ? normalizeTime(job.start_time) : null
  const endTimeRaw = job.end_time ? normalizeTime(job.end_time) : null
  const start = startTime
    ? { dateTime: `${job.scheduled_date}T${startTime}`, timeZone: timezone }
    : { date: job.scheduled_date }
  let end: typeof start
  if (startTime) {
    if (endTimeRaw) {
      end = { dateTime: `${job.scheduled_date}T${endTimeRaw}`, timeZone: timezone }
    } else {
      const [h, m] = startTime.split(':').map(Number)
      const endH = (h + 1) % 24
      const endTime = `${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00`
      end = { dateTime: `${job.scheduled_date}T${endTime}`, timeZone: timezone }
    }
  } else {
    const d = new Date(job.scheduled_date)
    d.setDate(d.getDate() + 1)
    end = { date: d.toISOString().slice(0, 10) }
  }

  const address = job.service_address || job.address || null
  const desc: string[] = []
  if (job.description) desc.push(job.description)
  if (job.customers?.name) desc.push(`Client: ${job.customers.name}`)
  if (job.customers?.phone) desc.push(`Téléphone: ${job.customers.phone}`)
  if (address) desc.push(`Adresse: ${address}`)

  return {
    summary: job.title || 'Intervention',
    description: desc.join('\n'),
    location: address || undefined,
    start,
    end,
  }
}

export type CalendarResult =
  | { ok: true; eventId: string }
  | { ok: false; reason: 'no_token' | 'no_date' | 'api_error'; status?: number; body?: unknown; message?: string }

async function parseGoogleError(res: Response) {
  const text = await res.text()
  try {
    const parsed = JSON.parse(text)
    const msg = parsed?.error?.message || parsed?.error_description || text
    return { body: parsed, message: msg as string }
  } catch {
    return { body: text, message: text }
  }
}

export async function createCalendarEvent(orgId: string, job: JobLike, timezone: string): Promise<CalendarResult> {
  const token = await getValidAccessToken(orgId)
  if (!token) {
    console.error(`[google-calendar] createEvent: no access token for org ${orgId}`)
    return { ok: false, reason: 'no_token' }
  }
  const payload = buildEventPayload(job, timezone)
  if (!payload) {
    console.log(`[google-calendar] createEvent: job ${job.id} has no scheduled_date, skipping`)
    return { ok: false, reason: 'no_date' }
  }
  console.log(`[google-calendar] creating event for job ${job.id}:`, JSON.stringify(payload))
  const res = await fetch(CALENDAR_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await parseGoogleError(res)
    console.error(`[google-calendar] create event failed (${res.status}):`, err.message, err.body)
    return { ok: false, reason: 'api_error', status: res.status, body: err.body, message: err.message }
  }
  const data = await res.json() as { id: string }
  console.log(`[google-calendar] created event ${data.id}`)
  return { ok: true, eventId: data.id }
}

export async function updateCalendarEvent(orgId: string, job: JobLike, timezone: string): Promise<CalendarResult> {
  if (!job.google_event_id) return { ok: false, reason: 'no_date' }
  const token = await getValidAccessToken(orgId)
  if (!token) {
    console.error(`[google-calendar] updateEvent: no access token for org ${orgId}`)
    return { ok: false, reason: 'no_token' }
  }
  const payload = buildEventPayload(job, timezone)
  if (!payload) return { ok: false, reason: 'no_date' }
  const res = await fetch(`${CALENDAR_API}/${encodeURIComponent(job.google_event_id)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await parseGoogleError(res)
    console.error(`[google-calendar] update event failed (${res.status}):`, err.message, err.body)
    return { ok: false, reason: 'api_error', status: res.status, body: err.body, message: err.message }
  }
  return { ok: true, eventId: job.google_event_id }
}

export async function deleteCalendarEvent(orgId: string, eventId: string) {
  const token = await getValidAccessToken(orgId)
  if (!token) return false
  const res = await fetch(`${CALENDAR_API}/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    console.error('[google-calendar] delete event failed:', await res.text())
    return false
  }
  return true
}
