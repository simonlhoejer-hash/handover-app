'use client'

import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import LanguageToggle from '@/components/ui/LanguageToggle'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useTranslation } from '@/lib/LanguageContext'
import {
  BarChart3,
  LayoutGrid,
  Trash2,
  MoreHorizontal,
  ShieldCheck,
  LogOut,
} from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const basePath = pathname.startsWith('/pearl') ? '/pearl' : '/crown'

  const tabs = [
    {
      icon: LayoutGrid,
      href: basePath,
      active: pathname === basePath,
      label: t.handoverTitle,
    },
    {
      icon: Trash2,
      href: `${basePath}/food-waste`,
      active:
        pathname === `${basePath}/food-waste` ||
        (
          pathname.startsWith(`${basePath}/food-waste/`) &&
          pathname !== `${basePath}/food-waste/overblik`
        ),
      label: t.foodWaste,
    },
    {
      icon: BarChart3,
      href: `${basePath}/food-waste/overblik`,
      active: pathname === `${basePath}/food-waste/overblik`,
      label: t.overview,
    },
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
        bg-white/90
        border-t border-[#064e4c]/10
        dark:bg-[#073f3d]/90
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

          const active = tab.active

          return (
            <a
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              className={`
                flex items-center justify-center
                w-12 h-12
                rounded-2xl
                transition-all duration-200
                active:scale-95
                ${
                  active
                    ? `
                      bg-[#e7f1ef]
                      text-[#064e4c]
                      shadow-sm
                      dark:bg-white/10
                      dark:text-white
                    `
                    : `
                      text-[#347f7a]/60
                      hover:bg-black/5
                      dark:text-white/50
                      dark:hover:bg-white/10
                    `
                }
              `}
            >
              <Icon size={20} strokeWidth={1.8} />
            </a>
          )
        })}

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
                w-[min(20rem,calc(100vw-2rem))]
                rounded-3xl
                p-5
                bg-white
                border border-black/5
                shadow-[0_20px_50px_rgba(0,0,0,0.08)]
                dark:bg-[#0d3b3a]
                dark:border-white/10
                dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]
              "
            >
              <div className="space-y-6">

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-white/70">
                    {t.language}
                  </span>
                  <LanguageToggle />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-white/70">
                    {t.theme}
                  </span>
                  <ThemeToggle />
                </div>

                <a
                  href={`${basePath}/indstillinger`}
                  onClick={() => setOpen(false)}
                  className="
                    flex items-center gap-3
                    border-t border-black/5 pt-5
                    text-sm font-medium text-gray-700
                    transition hover:text-[#064e4c]
                    dark:border-white/10 dark:text-white/80
                    dark:hover:text-white
                  "
                >
                  <ShieldCheck size={18} strokeWidth={1.8} />
                  <span className="whitespace-nowrap">{t.privacy}</span>
                </a>

                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/access', { method: 'DELETE' })
                    setOpen(false)
                    window.location.assign('/')
                  }}
                  className="flex w-full items-center gap-3 text-sm font-medium text-gray-700 transition hover:text-red-600 dark:text-white/80 dark:hover:text-red-300"
                >
                  <LogOut size={18} strokeWidth={1.8} />
                  <span>{t.lockApp}</span>
                </button>

              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
