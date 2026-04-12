'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, X, Edit3 } from 'lucide-react'

interface Suggestion {
  label: string
  source?: 'photon' | 'nominatim' | 'manual'
}

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
}

// Address autocomplete: queries our /api/geocode proxy (Photon + Nominatim).
// Always allows freeform ("Use as typed") so addresses outside the dataset
// still work.
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
  const abortRef = useRef<AbortController | null>(null)

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
    if (abortRef.current) abortRef.current.abort()

    const q = value.trim()
    if (q.length < 2) {
      setSuggestions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&country=ca`, { signal: controller.signal })
        if (!res.ok) throw new Error('geocode failed')
        const data = await res.json() as { suggestions: Suggestion[] }
        setSuggestions(data.suggestions || [])
        setOpen(true)
        setHighlight(-1)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSuggestions([])
          setOpen(true) // still open so the "use as typed" row shows
        }
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  const select = (label: string) => {
    onChange(label)
    setOpen(false)
    setSuggestions([])
  }

  // Compose final list: API suggestions + a "use as typed" fallback row
  const manualOption: Suggestion | null =
    value.trim().length >= 2 &&
    !suggestions.some((s) => s.label.toLowerCase() === value.trim().toLowerCase())
      ? { label: value.trim(), source: 'manual' }
      : null
  const items: Suggestion[] = [
    ...suggestions,
    ...(manualOption ? [manualOption] : []),
  ]

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault()
      select(items[highlight].label)
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
          onFocus={() => { if (value.trim().length >= 2) setOpen(true) }}
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

      {open && (items.length > 0 || loading) && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-80 overflow-y-auto">
          {loading && items.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400">Recherche…</div>
          )}
          {items.map((s, i) => (
            <button
              key={`${s.label}-${i}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(s.label)}
              onMouseEnter={() => setHighlight(i)}
              className={`block w-full text-left px-3 py-2 text-sm transition-colors ${highlight === i ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'} ${s.source === 'manual' ? 'border-t border-gray-100' : ''}`}
            >
              <span className="flex items-start gap-2">
                {s.source === 'manual' ? (
                  <Edit3 className="h-3.5 w-3.5 mt-0.5 text-gray-400 shrink-0" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 mt-0.5 text-gray-400 shrink-0" />
                )}
                <span className="truncate">
                  {s.source === 'manual' ? (
                    <>Utiliser cette adresse : <span className="font-medium text-gray-900">{s.label}</span></>
                  ) : (
                    s.label
                  )}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
