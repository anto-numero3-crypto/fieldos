import { NextRequest, NextResponse } from 'next/server'

interface Suggestion {
  label: string
  source: 'photon' | 'nominatim'
}

// Server-side address search combining Photon + Nominatim for better coverage.
// No API keys required.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() || ''
  const country = (req.nextUrl.searchParams.get('country') || 'ca').toLowerCase()
  if (q.length < 2) return NextResponse.json({ suggestions: [] })

  // Canada bbox (very rough: west, south, east, north)
  const CA_BBOX = '-141.0,41.6,-52.6,83.2'

  const out: Suggestion[] = []
  const seen = new Set<string>()

  // 1. Photon (preferred — better partial-match ranking on OSM)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=fr&bbox=${CA_BBOX}`
    const r = await fetch(photonUrl, { headers: { 'User-Agent': 'Gestivio/1.0' }, cache: 'no-store' })
    if (r.ok) {
      const data = await r.json()
      const feats = Array.isArray(data?.features) ? data.features : []
      for (const f of feats) {
        const p = f?.properties || {}
        if (country && p.countrycode && String(p.countrycode).toLowerCase() !== country) continue
        const parts = [
          [p.housenumber, p.street].filter(Boolean).join(' '),
          p.city || p.town || p.village || p.locality,
          p.state,
          p.postcode,
          p.country,
        ].filter(Boolean)
        const label = parts.join(', ')
        if (!label) continue
        const key = label.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ label, source: 'photon' })
      }
    }
  } catch (e) {
    console.error('[geocode] photon failed:', e)
  }

  // 2. Nominatim (fallback / supplement — only if we have < 5 results)
  if (out.length < 5) {
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=${country}&addressdetails=1&limit=${6 - out.length}&q=${encodeURIComponent(q)}`
      const r = await fetch(nomUrl, {
        headers: {
          'User-Agent': 'Gestivio/1.0 (contact: info@gestivio.ca)',
          'Accept-Language': 'fr-CA,fr;q=0.9,en;q=0.8',
        },
        cache: 'no-store',
      })
      if (r.ok) {
        const data = await r.json() as Array<{ display_name: string }>
        for (const item of data) {
          const label = item.display_name
          if (!label) continue
          const key = label.toLowerCase()
          if (seen.has(key)) continue
          seen.add(key)
          out.push({ label, source: 'nominatim' })
        }
      }
    } catch (e) {
      console.error('[geocode] nominatim failed:', e)
    }
  }

  return NextResponse.json({ suggestions: out.slice(0, 6) })
}
