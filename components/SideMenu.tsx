'use client'

import { useState } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/app/ThemeToggle'

export default function SideMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Burger */}
      <button
        onClick={() => setOpen(true)}
        className="
          fixed top-4 left-4 z-50
          h-10 w-10 flex items-center justify-center
          rounded-xl
          bg-white/90 text-gray-900
          shadow-lg backdrop-blur
          border border-gray-200
          dark:bg-gray-800/90 dark:text-white dark:border-gray-700
          transition active:scale-95
        "
        aria-label="Åbn menu"
      >
        ☰
      </button>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
className={`
  fixed top-0 left-0 h-screen w-80 z-50
  bg-white dark:bg-gray-800
  border-r border-gray-200 dark:border-gray-700
  shadow-2xl
  transform
  transition-transform duration-300 ease-in-out
  ${open ? 'translate-x-0' : '-translate-x-full'}
`}

      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-80 z-50
          bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          shadow-2xl
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Top section */}
        <div className="p-6 pt-16 space-y-4 flex-1">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            🏠 <span>Partier</span>
          </Link>

          <Link
            href="/kalender"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            📅 <span>Kalender</span>
          </Link>

          <Link
            href="/egenkontrol"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            ✅ <span>Egenkontrol</span>
          </Link>
        </div>

        {/* Bottom section */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <ThemeToggle />
        </div>
      </aside>
    </>
  )
}
