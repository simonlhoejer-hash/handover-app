'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/lib/LanguageContext'
import LanguageToggle from '@/components/ui/LanguageToggle'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { 
  LayoutGrid, 
  CalendarDays, 
  Users, 
  MoreHorizontal,
  Lightbulb
} from 'lucide-react'

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
    { icon: Lightbulb, href: `${basePath}/ideas` }, // ✅ NY
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
<nav
  className="
    fixed bottom-0 left-0 right-0
    backdrop-blur-xl
    z-40

    bg-white/80
    border-t border-black/5

    dark:bg-[#0f1b2d]/80
    dark:border-white/10
  "
>
  <div
    className="
      max-w-xl mx-auto
      flex justify-between items-center
      px-6 py-3
    "
  >
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
            active:scale-95
            ${
              active
                ? `
                  bg-black/5
                  text-gray-900
                  shadow-sm

                  dark:bg-white/10
                  dark:text-white
                `
                : `
                  text-gray-400
                  hover:bg-black/5

                  dark:text-white/50
                  dark:hover:bg-white/10
                `
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
          active:scale-95
          ${
            open
              ? `
                bg-black/5
                text-gray-900
                shadow-sm

                dark:bg-white/10
                dark:text-white
              `
              : `
                text-gray-400
                hover:bg-black/5

                dark:text-white/50
                dark:hover:bg-white/10
              `
          }
        `}
      >
        <MoreHorizontal size={20} strokeWidth={1.8} />
      </button>

      {open && (
        <div
          className="
            absolute bottom-16 right-0
            w-64
            rounded-3xl
            p-5
            transition-all duration-300

            bg-white
            border border-black/5
            shadow-[0_20px_50px_rgba(0,0,0,0.08)]

            dark:bg-[#162338]
            dark:border-white/10
            dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]
          "
        >
          <div className="space-y-6">

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-white/70">
                Sprog
              </span>
              <LanguageToggle />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-white/70">
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