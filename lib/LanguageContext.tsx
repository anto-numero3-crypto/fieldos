'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import translations, { Lang } from './i18n'

type AnyTranslations = typeof translations.en | typeof translations.fr

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: AnyTranslations
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('fieldos-lang') as Lang | null
    if (saved === 'en' || saved === 'fr') {
      setLangState(saved)
      document.documentElement.lang = saved
    }
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('fieldos-lang', l)
    document.documentElement.lang = l
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
