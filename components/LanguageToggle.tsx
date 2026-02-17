'use client'

import { useTranslation } from '@/lib/LanguageContext'
import { useEffect, useState } from 'react'

export default function LanguageToggle() {
  const { lang, setLang } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isSwedish = lang === 'sv'

  return (
    <button
      onClick={() => setLang(isSwedish ? 'da' : 'sv')}
      className="
        relative w-20 h-10
        rounded-full
        bg-gray-700 ring-1 ring-gray-600
        overflow-hidden
        transition-all duration-300
      "
      aria-label="Skift sprog"
    >
      {/* Background slider */}
      <span
        className={`
          absolute top-1 left-1
          w-8 h-8 rounded-full
          border-[2.5px] border-white
          transition-all duration-300 ease-in-out
          ${isSwedish ? 'translate-x-10' : 'translate-x-0'}
        `}
      />

      {/* Two equal halves */}
      <div className="relative z-10 flex h-full text-sm font-medium text-white">
        <div className="w-1/2 flex items-center justify-center">
          <span className={!isSwedish ? 'opacity-100' : 'opacity-40'}>
            DK
          </span>
        </div>

        <div className="w-1/2 flex items-center justify-center">
          <span className={isSwedish ? 'opacity-100' : 'opacity-40'}>
            SE
          </span>
        </div>
      </div>
    </button>
  )
}
