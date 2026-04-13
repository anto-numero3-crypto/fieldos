'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export const PAGE_SIZE = 25

/**
 * Client-side paginator wired to `?page=N` in the URL.
 * `total` is the full count (e.g. filtered.length). Returns the page slice
 * range plus a setter that updates state + URL.
 */
export function usePagination(total: number, pageSize: number = PAGE_SIZE) {
  const initial = (() => {
    if (typeof window === 'undefined') return 1
    const p = parseInt(new URLSearchParams(window.location.search).get('page') || '1', 10)
    return Number.isFinite(p) && p > 0 ? p : 1
  })()
  const [page, setPageState] = useState<number>(initial)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  // Keep state in sync if data shrinks
  useEffect(() => {
    if (page > totalPages) setPageState(totalPages)
  }, [page, totalPages])

  const setPage = useCallback((p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p))
    setPageState(clamped)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (clamped === 1) url.searchParams.delete('page')
      else url.searchParams.set('page', String(clamped))
      window.history.replaceState({}, '', url.toString())
    }
  }, [totalPages])

  const range = useMemo(() => ({
    from: (safePage - 1) * pageSize,
    to:   safePage * pageSize,
  }), [safePage, pageSize])

  const reset = useCallback(() => setPage(1), [setPage])

  return { page: safePage, setPage, range, pageSize, reset }
}
