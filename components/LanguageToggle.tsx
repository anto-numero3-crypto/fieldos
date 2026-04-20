'use client'

import { useLanguage } from '@/lib/LanguageContext'

interface Props {
  className?: string
}

export function LanguageToggle({ className = '' }: Props) {
  const { lang, setLang } = useLanguage()
  return (
    <div className={`inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold overflow-hidden shadow-sm ${className}`}>
      <button
        type="button"
        onClick={() => setLang('fr')}
        className={`px-2.5 py-1 transition ${lang === 'fr' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
        aria-pressed={lang === 'fr'}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 transition ${lang === 'en' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </div>
  )
}
