'use client'

import LanguageToggle from '@/components/LanguageToggle'
import ThemeToggle from '@/components/ThemeToggle'

type SettingsSheetProps = {
  open: boolean
  onClose: () => void
}

export default function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  if (!open) return null

return (
  <>
    {/* Overlay */}
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
    />

    {/* Sheet wrapper */}
<div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
  <div
    className="
      w-[95%] sm:w-[90%] md:w-full
      max-w-3xl
      mb-4
      bg-white dark:bg-gray-900
      rounded-3xl
      p-6
      shadow-2xl
      animate-slideUp
      pointer-events-auto
    "
  >

        {/* Handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

        <h2 className="text-xl font-semibold mb-6">
          Indstillinger
        </h2>

<div className="flex items-center justify-end gap-6">
  <span className="text-sm text-gray-600 dark:text-gray-400">
    Sprog
  </span>
  <LanguageToggle />
</div>

<div className="flex items-center justify-end gap-6">
  <span className="text-sm text-gray-600 dark:text-gray-400">
    Tema
  </span>
  <ThemeToggle />
</div>

        </div>
      </div>
  </>
)
}