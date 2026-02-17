'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { translations } from './translations'

type Lang = 'da' | 'sv'

type LanguageContextType = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: typeof translations.da
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('da')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang
    if (saved) setLangState(saved)
  }, [])

  const setLang = (newLang: Lang) => {
    localStorage.setItem('lang', newLang)
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
