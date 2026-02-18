'use client'

import { useTranslation } from '@/lib/LanguageContext'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export default function LanguageToggle() {
  const { lang, setLang } = useTranslation()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isSwedish = lang === 'sv'
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setLang(isSwedish ? 'da' : 'sv')}
      className={`
        relative w-20 h-10
        rounded-full
        cursor-pointer select-none
        transition-all duration-300 ease-in-out
        shadow-inner
        ${isDark 
          ? 'bg-gray-700 ring-1 ring-gray-600' 
          : 'bg-gray-200 ring-1 ring-gray-300'}
      `}
      aria-label="Skift sprog"
    >
      {/* Labels */}
      <div className="absolute inset-0 flex text-sm font-medium">
        <div className="w-1/2 flex items-center justify-center">
          <span
            className={`
              transition-opacity duration-200
              ${!isSwedish ? 'opacity-100' : 'opacity-40'}
              ${isDark ? 'text-white' : 'text-gray-800'}
            `}
          >
            DK
          </span>
        </div>

        <div className="w-1/2 flex items-center justify-center">
          <span
            className={`
              transition-opacity duration-200
              ${isSwedish ? 'opacity-100' : 'opacity-40'}
              ${isDark ? 'text-white' : 'text-gray-800'}
            `}
          >
            SE
          </span>
        </div>
      </div>

      {/* Active ring */}
      <span
        className={`
          absolute top-1 left-1
          w-8 h-8 rounded-full
          border-[2.5px]
          transition-all duration-300 ease-in-out
          ${isDark 
            ? 'border-white' 
            : 'border-gray-700 shadow-[0_0_4px_rgba(0,0,0,0.15)]'}
          ${isSwedish ? 'translate-x-10' : 'translate-x-0'}
        `}
      />
    </button>
  )
}
