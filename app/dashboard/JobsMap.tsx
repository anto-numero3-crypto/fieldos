'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtTime } from '@/lib/format'

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
  scheduled:        '#2563eb',
  in_progress:      '#16a34a',
  needs_completion: '#ea580c',
  completed:        '#6b7280',
  complete:         '#6b7280',
  invoiced:         '#6b7280',
  cancelled:        '#9ca3af',
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

export default function JobsMap({ jobs }: Props) {
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const [geocoded, setGeocoded] = useState<Geocoded[]>([])
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const abortRef = useRef(false)

  useEffect(() => {
    const read = () => setIsDark(document.documentElement.classList.contains('dark'))
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
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

  return (
    <div className="relative h-[360px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
        />
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
        <FitToMarkers points={points} />
      </MapContainer>

      {/* Overlay — shown while geocoding, or when nothing to show */}
      {(loading || !hasMarkers) && (
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
    </div>
  )
}
