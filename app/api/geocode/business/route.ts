import { NextRequest, NextResponse } from 'next/server'

// Cascading geocoder: Google Maps (if key set) → Photon (komoot) → Nominatim.
// Server-side so API keys stay hidden and User-Agent can be set reliably.

function isCanadian(lat: number, lng: number): boolean {
  return lat >= 42 && lat <= 83 && lng >= -141 && lng <= -52
}

async function tryGoogle(address: string): Promise<{ lat: number; lng: number; source: string } | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) return null
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}&region=ca&language=fr`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as { status: string; results: Array<{ geometry: { location: { lat: number; lng: number } }; formatted_address?: string }> }
    if (data.status !== 'OK' || !data.results?.length) return null
    const { lat, lng } = data.results[0].geometry.location
    if (!isCanadian(lat, lng)) return null
    console.log('[geocode] google ok:', data.results[0].formatted_address, { lat, lng })
    return { lat, lng, source: 'google' }
  } catch (err) {
    console.warn('[geocode] google error:', err)
    return null
  }
}

async function tryPhoton(address: string): Promise<{ lat: number; lng: number; source: string } | null> {
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1&lang=fr`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json() as { features: Array<{ geometry: { coordinates: [number, number] }; properties: Record<string, unknown> }> }
    if (!data.features?.length) return null
    const [lng, lat] = data.features[0].geometry.coordinates
    if (!isCanadian(lat, lng)) {
      console.warn('[geocode] photon returned non-Canadian:', { lat, lng })
      return null
    }
    console.log('[geocode] photon ok:', data.features[0].properties, { lat, lng })
    return { lat, lng, source: 'photon' }
  } catch (err) {
    console.warn('[geocode] photon error:', err)
    return null
  }
}

async function tryNominatim(address: string): Promise<{ lat: number; lng: number; source: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=ca`
    const res = await fetch(url, { headers: { 'User-Agent': 'Gestivio/1.0 (support@gestivio.ca)' } })
    if (!res.ok) return null
    const rows = await res.json() as Array<{ lat: string; lon: string; display_name: string }>
    if (!rows.length) return null
    const lat = parseFloat(rows[0].lat)
    const lng = parseFloat(rows[0].lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isCanadian(lat, lng)) return null
    console.log('[geocode] nominatim ok:', rows[0].display_name, { lat, lng })
    return { lat, lng, source: 'nominatim' }
  } catch (err) {
    console.warn('[geocode] nominatim error:', err)
    return null
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { address?: string } | null
  const address = body?.address?.trim()
  if (!address) return NextResponse.json({ error: 'Missing address' }, { status: 400 })

  console.log('[geocode] input:', address)

  const result =
    (await tryGoogle(address)) ||
    (await tryPhoton(address)) ||
    (await tryNominatim(address))

  if (!result) {
    console.warn('[geocode] all providers failed for:', address)
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }
  return NextResponse.json(result)
}
