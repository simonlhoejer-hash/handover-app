'use client'

import { useDepartment } from '@/lib/DepartmentContext'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'

export default function SideMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
const { department } = useDepartment()

  return (
    <>
      {/* Burger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 h-10 w-10 flex items-center justify-center rounded-xl bg-white/90 text-gray-900 shadow-lg backdrop-blur border border-gray-200 dark:bg-gray-800/90 dark:text-white dark:border-gray-700 transition active:scale-95"
        aria-label="Åbn menu"
      >
        ☰
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-80 z-50 
        bg-white dark:bg-gray-900 
        border-r border-gray-200 dark:border-gray-800 
        shadow-2xl 
        transform transition-transform duration-300 ease-in-out 
        flex flex-col
        ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header i menu */}
        <div className="px-6 pt-10 pb-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
            Kitchen Handover
          </h2>
        </div>

        {/* Menu links */}
<div className="p-6 space-y-2 flex-1">

  {/* Partier */}
<Link
  href="/"
  onClick={() => setOpen(false)}
  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
    pathname === '/'
      ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
  }`}
>
  {department === 'galley' ? 'Partier' : 'Outlets'}
</Link>


  {/* Afdelingsmøde – kan evt. ændre navn pr afdeling */}
  <Link
    href="/afdelingsmoede"
    onClick={() => setOpen(false)}
    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      pathname === '/afdelingsmoede'
        ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    {department === 'galley' ? 'Galley Afdelingsmøde' : 'Shop Afdelingsmøde'}
  </Link>

  {/* Kalender – måske kun Galley */}
  {department === 'galley' && (
    <Link
      href="/kalender"
      onClick={() => setOpen(false)}
      className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
        pathname === '/kalender'
          ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      Kalender
    </Link>
  )}

  {/* Egenkontrol – måske kun Shop */}
  {department === 'shop' && (
    <Link
      href="/egenkontrol"
      onClick={() => setOpen(false)}
      className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
        pathname === '/egenkontrol'
          ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      Egenkontrol
    </Link>
  )}

</div>


        {/* Bottom section */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-center">
          <ThemeToggle />

        </div>
      </aside>
    </>
  )
}
