'use client'

import { useState } from 'react'
import LanguageToggle from '@/components/LanguageToggle'
import ThemeToggle from '@/components/ThemeToggle'
import { useTranslation } from '@/lib/LanguageContext'

export default function SettingsPage() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">
        {t.indstillinger}
      </h1>

      {/* Accordion */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">

        {/* Header */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex justify-between items-center p-5 text-left"
        >
          <span className="font-semibold">App</span>
          <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>
            ⌄
          </span>
        </button>

        {/* Content */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            open ? 'max-h-40 p-5 pt-0' : 'max-h-0'
          }`}
        >
          <div className="flex items-center justify-between py-3">
            <span>Sprog</span>
            <LanguageToggle />
          </div>

          <div className="flex items-center justify-between py-3">
            <span>Tema</span>
            <ThemeToggle />
          </div>
        </div>

      </div>

    </div>
  )
}
