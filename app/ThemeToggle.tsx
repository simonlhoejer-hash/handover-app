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
      className="
        rounded-full p-2 text-sm shadow
        bg-white text-gray-800
        dark:bg-gray-800 dark:text-gray-100
        opacity-80 hover:opacity-100
        transition
      "
      aria-label="Skift tema"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
