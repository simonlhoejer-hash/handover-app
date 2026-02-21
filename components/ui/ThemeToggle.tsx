'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`
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
      `}
      aria-label="Skift tema"
    >
      {/* Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-3">
        <Sun
          size={16}
          className={`
            transition-all duration-200
            ${isDark ? 'opacity-40 text-white/50' : 'opacity-100 text-gray-700'}
          `}
        />
        <Moon
          size={16}
          className={`
            transition-all duration-200
            ${isDark ? 'opacity-100 text-white' : 'opacity-40 text-gray-500'}
          `}
        />
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

          ${isDark ? 'translate-x-10' : 'translate-x-0'}
        `}
      />
    </button>
  )
}