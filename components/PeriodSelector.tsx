'use client'

import { useLanguage } from '@/lib/LanguageContext'

export interface Period {
  value: string
  label: { fr: string; en: string }
}

interface Props {
  periods: Period[]
  selected: string
  onChange: (value: string) => void
  className?: string
}

export default function PeriodSelector({ periods, selected, onChange, className = '' }: Props) {
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  return (
    <div className={`inline-flex items-center gap-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 ${className}`}>
      {periods.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            selected === p.value
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {fr ? p.label.fr : p.label.en}
        </button>
      ))}
    </div>
  )
}
