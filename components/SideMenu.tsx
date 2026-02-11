'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SideMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Burger-knap */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-800 text-white"
      >
        ☰
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40"
        />
      )}

      {/* Selve menuen */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 z-50 transform transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 text-lg font-semibold border-b">
          Menu
        </div>

        <nav className="flex flex-col gap-2 p-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            🏠 Partier
          </Link>

          <Link
            href="/kalender"
            onClick={() => setOpen(false)}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            📅 Kalender
          </Link>

          <Link
            href="/egenkontrol"
            onClick={() => setOpen(false)}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ✅ Egenkontrol
          </Link>
        </nav>
      </aside>
    </>
  )
}
