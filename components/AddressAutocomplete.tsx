'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, X } from 'lucide-react'

interface Suggestion {
  display_name: string
  lat?: string
  lon?: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
}

// Address autocomplete using OpenStreetMap Nominatim (no API key required,
// Canada-restricted). Falls back to a plain input if the network call fails.
export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = '123 rue Principale, Montréal',
  className = '',
  id,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value || value.trim().length < 3) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ca&addressdetails=1&limit=5&q=${encodeURIComponent(value)}`
        const res = await fetch(url, { headers: { 'Accept-Language': 'fr-CA,fr;q=0.9,en;q=0.8' } })
        if (!res.ok) throw new Error('geocode failed')
        const data = (await res.json()) as Suggestion[]
        setSuggestions(data)
        setOpen(data.length > 0)
        setHighlight(-1)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  const select = (s: Suggestion) => {
    onChange(s.display_name)
    setOpen(false)
    setSuggestions([])
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault()
      select(suggestions[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`block w-full rounded-xl border border-gray-200 pl-9 pr-9 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${className}`}
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); setSuggestions([]); setOpen(false) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Effacer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (suggestions.length > 0 || loading) && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-72 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-xs text-gray-400">Recherche…</div>
          )}
          {suggestions.map((s, i) => (
            <button
              key={`${s.display_name}-${i}`}
              type="button"
              onClick={() => select(s)}
              onMouseEnter={() => setHighlight(i)}
              className={`block w-full text-left px-3 py-2 text-sm transition-colors ${highlight === i ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <span className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-gray-400 shrink-0" />
                <span className="truncate">{s.display_name}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
