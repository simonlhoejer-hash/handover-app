'use client'

import { useTranslation } from '@/lib/LanguageContext'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export default function LanguageToggle() {
  const { lang, setLang, t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = resolvedTheme === 'dark'
  const options = [
    { value: 'da' as const, label: 'DA' },
    { value: 'sv' as const, label: 'SV' },
    { value: 'en' as const, label: 'EN' },
  ]

  return (
    <div
      className="
        relative flex
        w-32 h-10 p-1
        rounded-full
        transition-all duration-300
        active:scale-95

        border border-black/5
        bg-gray-100

        dark:border-white/10
        dark:bg-[#124744]

        shadow-[inset_0_2px_6px_rgba(0,0,0,0.06)]
        dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]
      "
      role="group"
      aria-label={t.switchLanguage}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLang(option.value)}
          aria-pressed={lang === option.value}
          className={`relative z-10 flex flex-1 items-center justify-center rounded-full text-xs font-bold transition-all ${
            lang === option.value
              ? 'bg-white text-[#005a57] shadow-md'
              : `text-gray-500 opacity-70 hover:opacity-100 ${isDark ? 'dark:text-white' : ''}`
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
