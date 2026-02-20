'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/lib/LanguageContext'
import LanguageToggle from '@/components/ui/LanguageToggle'
import ThemeToggle from '@/components/ui/ThemeToggle'
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
    <nav className="
      fixed bottom-0 left-0 right-0
      bg-white/90 dark:bg-gray-900/90
      backdrop-blur-md
      border-t border-gray-200 dark:border-gray-800
      z-30
    ">
      <div className="
        max-w-xl mx-auto
        flex justify-between items-center
        px-6 py-3
      ">

        {tabs.map((tab) => {
          const Icon = tab.icon

          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex items-center justify-center
                w-12 h-12
                rounded-2xl
                transition-all duration-200
                ${
                  active
                    ? 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white shadow-sm scale-105'
                    : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <Icon size={20} strokeWidth={1.8} />
            </Link>
          )
        })}

        {/* Settings */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className={`
              flex items-center justify-center
              w-12 h-12
              rounded-2xl
              transition-all duration-200
              ${
                open
                  ? 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white shadow-sm scale-105'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            <MoreHorizontal size={20} strokeWidth={1.8} />
          </button>

          {open && (
            <div className="
              absolute bottom-16 right-0
              w-64
              bg-white dark:bg-gray-900
              rounded-2xl
              shadow-2xl
              border border-gray-200 dark:border-gray-700
              p-4
              animate-fadeIn
            ">
              <div className="space-y-5">

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Sprog
                  </span>
                  <LanguageToggle />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Tema
                  </span>
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
