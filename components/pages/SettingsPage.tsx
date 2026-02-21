'use client'

import { useState } from 'react'
import LanguageToggle from '@/components/ui/LanguageToggle'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useTranslation } from '@/lib/LanguageContext'
import { ChevronDown } from 'lucide-react'

export default function SettingsPage() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)

  return (
    <main className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-10">

      {/* HEADER */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {t.indstillinger}
        </h1>
      </div>

      {/* CARD */}
      <section
        className="
          rounded-3xl
          overflow-hidden

          bg-white
          border border-black/5
          shadow-[0_20px_40px_rgba(0,0,0,0.06)]

          dark:bg-[#162338]
          dark:border-white/10
          dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]
        "
      >

        {/* TOGGLE HEADER */}
        <button
          onClick={() => setOpen(!open)}
          className="
            group
            w-full
            flex items-center justify-between
            px-6 py-5
            text-lg font-semibold
            transition-all duration-300
            active:scale-[0.98]
          "
        >
          <span className="tracking-tight text-gray-900 dark:text-white">
            App
          </span>

          <ChevronDown
            className={`
              text-gray-500 dark:text-white/70
              transition-all duration-300
              ${open ? 'rotate-180 scale-110' : ''}
              group-hover:scale-110
            `}
          />
        </button>

        {/* CONTENT */}
        <div
          className={`
            overflow-hidden
            transition-all duration-500 ease-in-out
            ${open ? 'max-h-60 opacity-100 px-6 pb-6' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="space-y-5 border-t border-black/5 dark:border-white/10 pt-6">

            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-white/70">
                Sprog
              </span>
              <LanguageToggle />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-white/70">
                Tema
              </span>
              <ThemeToggle />
            </div>

          </div>
        </div>

      </section>

    </main>
  )
}