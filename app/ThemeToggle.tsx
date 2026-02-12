'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

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
        relative w-20 h-10 flex items-center
        rounded-full px-1.5
        transition-all duration-300 ease-in-out
        shadow-inner
        ${isDark 
          ? 'bg-gray-700 ring-1 ring-gray-600' 
          : 'bg-gray-200 ring-1 ring-gray-300'}
      `}
      aria-label="Skift tema"
    >
      {/* Sun */}
      <span className="absolute left-3 text-base opacity-70">
        ☀️
      </span>

      {/* Moon */}
      <span className="absolute right-3 text-base opacity-70">
        🌙
      </span>

      {/* Knob */}
      <span
        className={`
          w-8 h-8 rounded-full
          ${isDark 
            ? 'bg-white shadow-lg' 
            : 'bg-gray-900 shadow-lg'}
          transform transition-transform duration-300 ease-in-out
          ${isDark ? 'translate-x-10' : 'translate-x-0'}
        `}
      />
    </button>
  )
}
