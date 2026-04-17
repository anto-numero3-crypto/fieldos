'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtTime } from '@/lib/format'
import { JOB_COLORS } from '@/lib/status-colors'
import { supabase } from '@/app/supabase'

// Default location: Montreal (centre-ville)
const DEFAULT_CENTER: [number, number] = [45.5017, -73.5673]
const DEFAULT_ZOOM = 11

export interface JobMarker {
  id: string
  title: string
  status: 'scheduled' | 'in_progress' | 'complete' | 'cancelled' | string
  service_address: string | null
  customer_name: string | null
  start_time: string | null
  technician: string | null
}

interface Geocoded extends JobMarker {
  lat: number
  lng: number
}

const STATUS_COLOR: Record<string, string> = {
  scheduled:        JOB_COLORS.scheduled.hex,
  in_progress:      JOB_COLORS.in_progress.hex,
  needs_completion: JOB_COLORS.needs_completion.hex,
  completed:        JOB_COLORS.completed.hex,
  complete:         JOB_COLORS.completed.hex,
  invoiced:         JOB_COLORS.invoiced.hex,
  cancelled:        JOB_COLORS.cancelled.hex,
}

// In-memory cache so repeated addresses (e.g. between 60s refreshes) don't
// hit Nominatim again. Also persisted to localStorage.
const MEM_CACHE = new Map<string, { lat: number; lng: number } | null>()
const LS_KEY = 'gestivio-geocode-cache-v1'

function loadCacheFromStorage() {
  if (typeof window === 'undefined' || MEM_CACHE.size > 0) return
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, { lat: number; lng: number } | null>
    for (const k in parsed) MEM_CACHE.set(k, parsed[k])
  } catch {
    // ignore parse errors
  }
}

function saveCacheToStorage() {
  if (typeof window === 'undefined') return
  try {
    const obj: Record<string, { lat: number; lng: number } | null> = {}
    MEM_CACHE.forEach((v, k) => { obj[k] = v })
    localStorage.setItem(LS_KEY, JSON.stringify(obj))
  } catch {
    // quota / disabled storage — ignore
  }
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = address.trim().toLowerCase()
  if (!key) return null
  if (MEM_CACHE.has(key)) return MEM_CACHE.get(key) || null
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!res.ok) { MEM_CACHE.set(key, null); return null }
    const rows = (await res.json()) as Array<{ lat: string; lon: string }>
    if (!rows.length) { MEM_CACHE.set(key, null); return null }
    const first = rows[0]
    const out = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) }
    MEM_CACHE.set(key, out)
    saveCacheToStorage()
    return out
  } catch {
    MEM_CACHE.set(key, null)
    return null
  }
}

// Canada bounding box: lat 42→83, lng -141→-52
function isCanadianCoord(lat: number, lng: number): boolean {
  return lat >= 42 && lat <= 83 && lng >= -141 && lng <= -52
}

// Business geocoder — server-side cascade (Google → Photon → Nominatim)
// behind /api/geocode/business. Way more accurate than raw Nominatim
// for Canadian street addresses.
async function geocodeBusiness(query: string): Promise<{ lat: number; lng: number } | null> {
  console.log('[business geocode] input:', query)
  try {
    const res = await fetch('/api/geocode/business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: query }),
    })
    if (!res.ok) {
      console.warn('[business geocode] api returned', res.status)
      return null
    }
    const data = await res.json() as { lat: number; lng: number; source: string }
    console.log('[business geocode] result:', data)
    return { lat: data.lat, lng: data.lng }
  } catch (err) {
    console.error('[business geocode] fetch error:', err)
    return null
  }
}

async function persistLocation(lat: number, lng: number) {
  try {
    await fetch('/api/org/update-location', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location_lat: lat, location_lng: lng }),
    })
  } catch (err) {
    console.error('[business marker] failed to persist coords:', err)
  }
}

function makeBusinessIcon() {
  const html = `
    <div style="width:24px;height:24px;border-radius:5px;background:#000000;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>
  `
  return L.divIcon({
    className: 'gestivio-business-pin',
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  })
}

function makeIcon(color: string) {
  // Colored teardrop pin via divIcon + inline SVG. No image assets required.
  const html = `
    <div style="position:relative;width:28px;height:36px;transform:translate(-14px,-34px);">
      <svg viewBox="0 0 28 36" width="28" height="36" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.35"/>
          </filter>
        </defs>
        <path filter="url(#pinShadow)" d="M14 0C6.268 0 0 6.268 0 14c0 9.94 12.31 20.84 13.15 21.565a1.3 1.3 0 0 0 1.7 0C15.69 34.84 28 23.94 28 14 28 6.268 21.732 0 14 0z" fill="${color}"/>
        <circle cx="14" cy="14" r="5" fill="white"/>
      </svg>
    </div>
  `
  return L.divIcon({
    className: 'gestivio-pin',
    html,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -30],
  })
}

// Fits the map bounds to all provided markers. No-op if fewer than 1 marker.
function FitToMarkers({ points }: { points: Array<[number, number]> }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    if (points.length === 1) {
      map.setView(points[0], 13, { animate: true })
      return
    }
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [map, points])
  return null
}

interface Props {
  jobs: JobMarker[]
}

interface Business {
  name: string
  address: string
  lat: number
  lng: number
  matchedAddress: string | null
}

export default function JobsMap({ jobs }: Props) {
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const [geocoded, setGeocoded] = useState<Geocoded[]>([])
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)
  const [businessMissing, setBusinessMissing] = useState(false)
  const abortRef = useRef(false)

  useEffect(() => {
    const read = () => setIsDark(document.documentElement.classList.contains('dark'))
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Fetch business address once, geocode, cache
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_user_id', auth.user.id)
        .maybeSingle()
      if (cancelled) return
      console.log('[business] FULL ORG ROW:', JSON.stringify(org, null, 2), 'error:', error)
      console.log('[map render] org from DB:', {
        address: org?.address,
        location_lat: org?.location_lat,
        location_lng: org?.location_lng,
      })

      if (!org) { setBusinessMissing(true); return }

      // If org.address contains commas it's already a complete address string
      // (e.g. "5920 Rue Desaulniers, Montréal, Québec, H1N 1V8, Canada").
      // Use it as-is — do NOT append city/state/zip again.
      const addressIsComplete = !!org.address && org.address.includes(',')
      const addressLabel = addressIsComplete
        ? String(org.address).trim()
        : ([org.address, org.city, org.state, org.zip].filter((p) => p && String(p).trim()).join(', ')
           || [org.city, org.state].filter(Boolean).join(', '))

      // 0. Saved coords in DB (either manual entry or previously persisted geocode result)
      //    Validate they're in Canada; if not, treat as stale and re-geocode.
      const savedLat = Number(org.location_lat)
      const savedLng = Number(org.location_lng)
      if (Number.isFinite(savedLat) && Number.isFinite(savedLng) && isCanadianCoord(savedLat, savedLng)) {
        console.log('[business marker] using saved coords from DB:', savedLat, savedLng)
        setBusiness({
          name: org.name || 'Gestivio',
          address: addressLabel,
          lat: savedLat,
          lng: savedLng,
          matchedAddress: null,
        })
        return
      }
      if (Number.isFinite(savedLat) && Number.isFinite(savedLng)) {
        console.warn('[business marker] saved coords outside Canada — will re-geocode:', savedLat, savedLng)
      }

      if (!org.address?.trim() && !org.city?.trim()) {
        console.warn('[business marker] no address/city on organization — prompting user')
        setBusinessMissing(true)
        return
      }

      // If the address field already contains a full address (e.g. was typed
      // Same logic: if org.address has commas, use it directly for geocoding.
      const fullAddress = addressIsComplete
        ? String(org.address).trim()
        : [org.address, org.city, org.state, org.zip]
            .filter((p) => p && String(p).trim())
            .join(', ')
      console.log('[business geocode] addressIsComplete:', addressIsComplete)
      console.log('[business geocode] fullAddress:', fullAddress)

      // 1. Full address
      let coords = fullAddress ? await geocodeBusiness(fullAddress) : null

      // 2. Fallback: city + province only
      if (!coords && org.city) {
        const cityQuery = `${org.city}, ${org.state || 'Quebec'}`
        console.log('[business geocode] trying city fallback:', cityQuery)
        coords = await geocodeBusiness(cityQuery)
      }

      if (cancelled) return

      if (!coords) {
        console.warn('[business marker] geocoding failed at every level — no marker rendered')
        setBusinessMissing(true)
        return
      }

      // Persist to DB so we never geocode this business again
      console.log('[business geocode] saving to DB:', coords.lat, coords.lng)
      persistLocation(coords.lat, coords.lng)

      setBusiness({
        name: org.name || 'Gestivio',
        address: addressLabel,
        lat: coords.lat,
        lng: coords.lng,
        matchedAddress: null,
      })
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    loadCacheFromStorage()
    abortRef.current = false
    let cancelled = false

    ;(async () => {
      const addressJobs = jobs.filter((j) => j.service_address && j.service_address.trim())
      // Trim to a reasonable number so we don't hammer Nominatim.
      const limited = addressJobs.slice(0, 20)
      const results: Geocoded[] = []
      for (const j of limited) {
        if (cancelled || abortRef.current) return
        const coords = await geocode(j.service_address!)
        if (coords) results.push({ ...j, lat: coords.lat, lng: coords.lng })
        // Gentle pacing — Nominatim asks for <= 1 req/sec. We only pause
        // when the address wasn't cached; cache hits are near-instant.
      }
      if (cancelled) return
      setGeocoded(results)
      setLoading(false)
    })()

    return () => {
      cancelled = true
      abortRef.current = true
    }
  }, [jobs])

  const points: Array<[number, number]> = geocoded.map((g) => [g.lat, g.lng])
  const hasMarkers = geocoded.length > 0
  const center: [number, number] = business ? [business.lat, business.lng] : DEFAULT_CENTER
  const zoom = business ? 12 : DEFAULT_ZOOM

  return (
    <div className="relative h-[360px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
        />
        {business && (
          <Marker position={[business.lat, business.lng]} icon={makeBusinessIcon()}>
            <Popup>
              <div className="text-xs space-y-1 min-w-[180px]">
                <div className="font-semibold text-gray-900">{business.name}</div>
                <div className="text-gray-600">{business.address}</div>
                {business.matchedAddress && (
                  <div className="text-gray-400 text-[11px] leading-snug pt-1 border-t border-gray-100">
                    {fr ? 'Localisé à :' : 'Located at:'} {business.matchedAddress}
                  </div>
                )}
                <a href="/settings" className="inline-block mt-1 text-indigo-600 hover:underline">
                  {fr ? "Modifier l'adresse" : 'Edit address'}
                </a>
              </div>
            </Popup>
          </Marker>
        )}
        {geocoded.map((j) => (
          <Marker
            key={j.id}
            position={[j.lat, j.lng]}
            icon={makeIcon(STATUS_COLOR[j.status] || STATUS_COLOR.scheduled)}
          >
            <Popup>
              <div className="text-xs space-y-1 min-w-[180px]">
                <div className="font-semibold text-gray-900">{j.title || (fr ? 'Intervention' : 'Job')}</div>
                {j.customer_name && <div className="text-gray-700">{j.customer_name}</div>}
                {j.service_address && <div className="text-gray-500">{j.service_address}</div>}
                {j.start_time && (
                  <div className="text-gray-600">
                    {fr ? 'Heure' : 'Time'}: {fmtTime(j.start_time, lang)}
                  </div>
                )}
                {j.technician && (
                  <div className="text-gray-600">
                    {fr ? 'Technicien' : 'Technician'}: {j.technician}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        <FitToMarkers points={business ? [...points, [business.lat, business.lng] as [number, number]] : points} />
      </MapContainer>

      {/* Overlay — shown while geocoding, or when nothing to show */}
      {(loading || !hasMarkers) && !business && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-950/60 backdrop-blur-[2px]">
          <div className="pointer-events-auto rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-3 shadow-lg text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {loading
                ? (fr ? 'Localisation des interventions…' : 'Locating jobs…')
                : (fr ? 'Aucune intervention géolocalisée' : 'No jobs to show on the map')}
            </p>
            {!loading && !hasMarkers && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {fr ? 'Ajoutez une adresse aux interventions du jour.' : 'Add an address to today\'s jobs.'}
              </p>
            )}
          </div>
        </div>
      )}

      {!loading && businessMissing && !hasMarkers && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs pointer-events-auto">
          <a href="/settings" className="block rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2 shadow-sm text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 mr-1.5 align-middle" />
            {fr ? 'Configurez votre adresse dans Paramètres → Entreprise' : 'Set your address in Settings → Business'}
          </a>
        </div>
      )}
    </div>
  )
}
