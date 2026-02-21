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
      className="
        relative
        w-20 h-10
        rounded-full
        transition-all duration-300
        active:scale-95

        border border-black/5
        bg-gray-100

        dark:border-white/10
        dark:bg-[#1d2e46]

        shadow-[inset_0_2px_6px_rgba(0,0,0,0.06)]
        dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]
      "
      aria-label="Skift sprog"
    >
      {/* Labels */}
      <div className="absolute inset-0 flex text-sm font-medium">
        <div className="w-1/2 flex items-center justify-center">
          <span
            className={`
              transition-all duration-200
              ${!isSwedish ? 'opacity-100 text-gray-700' : 'opacity-40 text-gray-500'}
              ${isDark ? 'dark:text-white' : ''}
            `}
          >
            DK
          </span>
        </div>

        <div className="w-1/2 flex items-center justify-center">
          <span
            className={`
              transition-all duration-200
              ${isSwedish ? 'opacity-100 text-gray-700' : 'opacity-40 text-gray-500'}
              ${isDark ? 'dark:text-white' : ''}
            `}
          >
            SE
          </span>
        </div>
      </div>

      {/* Slider */}
      <span
        className={`
          absolute top-1 left-1
          w-8 h-8
          rounded-full
          transition-all duration-300

          bg-white
          shadow-md

          dark:bg-white
          dark:shadow-lg

          ${isSwedish ? 'translate-x-10' : 'translate-x-0'}
        `}
      />
    </button>
  )
}