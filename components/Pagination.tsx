'use client'

import { memo, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface Props {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export const PAGE_SIZE = 25

function PaginationImpl({ page, pageSize, total, onPageChange }: Props) {
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end   = Math.min(page * pageSize, total)

  const pages = useMemo(() => {
    const max = 5
    if (totalPages <= max) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const half = Math.floor(max / 2)
    let lo = Math.max(1, page - half)
    const hi = Math.min(totalPages, lo + max - 1)
    lo = Math.max(1, hi - max + 1)
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
  }, [page, totalPages])

  const prev = useCallback(() => onPageChange(Math.max(1, page - 1)), [page, onPageChange])
  const next = useCallback(() => onPageChange(Math.min(totalPages, page + 1)), [page, totalPages, onPageChange])

  if (total <= pageSize) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-white">
      <p className="text-xs text-gray-500">
        {fr ? 'Affichage de' : 'Showing'} <span className="font-semibold text-gray-700">{start}</span>
        {' '}{fr ? 'à' : 'to'} <span className="font-semibold text-gray-700">{end}</span>
        {' '}{fr ? 'sur' : 'of'} <span className="font-semibold text-gray-700">{total}</span> {fr ? 'résultats' : 'results'}
      </p>
      <nav className="flex items-center gap-1">
        <button
          type="button"
          onClick={prev}
          disabled={page === 1}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label={fr ? 'Page précédente' : 'Previous page'}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> {fr ? 'Précédent' : 'Previous'}
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`min-w-[32px] rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              p === page
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={next}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label={fr ? 'Page suivante' : 'Next page'}
        >
          {fr ? 'Suivant' : 'Next'} <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </nav>
    </div>
  )
}

export const Pagination = memo(PaginationImpl)
