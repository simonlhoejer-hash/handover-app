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
        relative w-20 h-10
        rounded-full
        cursor-pointer select-none
        transition-all duration-300 ease-in-out
        shadow-inner
        ${isDark 
          ? 'bg-gray-700 ring-1 ring-gray-600' 
          : 'bg-gray-200 ring-1 ring-gray-300'}
      `}
      aria-label="Skift tema"
    >
      {/* Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-3">
        <Sun 
          size={16} 
          className={`transition-opacity duration-200 ${
            isDark ? 'opacity-40' : 'opacity-100'
          }`} 
        />
        <Moon 
          size={16} 
          className={`transition-opacity duration-200 ${
            isDark ? 'opacity-100' : 'opacity-40'
          }`} 
        />
      </div>

      {/* Active ring */}
      <span
        className={`
          absolute left-1 top-1
          w-8 h-8 rounded-full
          border-[2.5px]
          ${isDark 
            ? 'border-white' 
            : 'border-gray-700 shadow-[0_0_4px_rgba(0,0,0,0.15)]'}
          transition-all duration-300 ease-in-out
          ${isDark ? 'translate-x-10' : 'translate-x-0'}
        `}
      />
    </button>
  )
}
