'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/lib/LanguageContext'
import LanguageToggle from '@/components/LanguageToggle'
import ThemeToggle from '@/components/ThemeToggle'
import { LayoutGrid, CalendarDays, Users, MoreHorizontal } from 'lucide-react'

export default function BottomNav() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isGalley = pathname.startsWith('/galley')
  const basePath = isGalley ? '/galley' : '/shop'

  const tabs = [
    { icon: LayoutGrid, href: basePath, exact: true },
    { icon: CalendarDays, href: `${basePath}/kalender` },
    { icon: Users, href: `${basePath}/afdelingsmoede` },
  ]

  // Luk settings ved klik udenfor
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
      <div className="flex justify-center items-center gap-4 py-3">

        {tabs.map((tab, index) => {
          const Icon = tab.icon

          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href)

          return (
            <div key={tab.href} className="flex items-center gap-4">

              <Link
                href={tab.href}
                className={`
                  flex items-center justify-center
                  w-11 h-11
                  rounded-xl
                  transition-all duration-200
                  ${
                    active
                      ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <Icon size={20} strokeWidth={1.8} />
              </Link>

              {/* Separator */}
              {index !== tabs.length - 1 && (
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
          )
        })}

        {/* Separator before settings */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Settings button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className={`
              flex items-center justify-center
              w-11 h-11
              rounded-xl
              transition-all duration-200
              ${
                open
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            <MoreHorizontal size={20} strokeWidth={1.8} />
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
