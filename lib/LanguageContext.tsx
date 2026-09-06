'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { translations } from './translations'
import { safeStorageGet, safeStorageSet } from './safeStorage'

export type Lang = 'da' | 'sv' | 'en'

export function localeFor(lang?: string) {
  return lang === 'sv' ? 'sv-SE' : lang === 'en' ? 'en-GB' : 'da-DK'
}

type LanguageContextType = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: typeof translations.da
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('da')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = safeStorageGet('lang')
      if (saved === 'da' || saved === 'sv' || saved === 'en') setLangState(saved)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const setLang = (newLang: Lang) => {
    safeStorageSet('lang', newLang)
    setLangState(newLang)
  }

  const value = {
    lang,
    setLang,
    t: translations[lang],
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used inside LanguageProvider')
  }
  return context
}
