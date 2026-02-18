'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/lib/LanguageContext'
import LanguageToggle from '@/components/LanguageToggle'
import ThemeToggle from '@/components/ThemeToggle'

export default function BottomNav() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isGalley = pathname.startsWith('/galley')
  const basePath = isGalley ? '/galley' : '/shop'

  const tabs = [
    {
      label: isGalley ? t.partier : t.outlets,
      href: basePath,
      exact: true,
    },
    {
      label: t.kalender,
      href: `${basePath}/kalender`,
    },
    {
      label: isGalley ? t.galleyMoede : t.shopMoede,
      href: `${basePath}/afdelingsmoede`,
    },
  ]

  // Luk menu ved klik udenfor
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () =>
      document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-30">
      <div className="relative flex justify-around items-center py-3 px-4">

        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                px-4 py-2
                rounded-xl
                text-sm font-medium
                transition-all duration-200
                ${
                  active
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              {tab.label}
            </Link>
          )
        })}

        {/* Settings button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className={`
              px-4 py-2
              rounded-xl
              text-sm font-medium
              transition-all duration-200
              ${
                open
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            {t.indstillinger}
          </button>

          {open && (
            <div className="absolute bottom-14 right-0 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 animate-fadeIn">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sprog</span>
                  <LanguageToggle />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Tema</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </nav>
  )
}
