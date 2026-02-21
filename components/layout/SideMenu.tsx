'use client'

import LanguageToggle from '@/components/ui/LanguageToggle'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useTranslation } from '@/lib/LanguageContext'
import Image from 'next/image'

export default function SideMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
const { t } = useTranslation()
const isGalley = pathname.startsWith('/galley')
const isShop = pathname.startsWith('/shop')

  return (
    <>
      {/* Burger */}
      <button
        onClick={() => setOpen(true)}
className="
  fixed top-4 left-4 z-50
  h-10 w-10
  flex items-center justify-center
  rounded-2xl
  transition-all duration-200
  active:scale-95

  bg-white/80
  border border-black/5
  backdrop-blur-xl
  shadow-md

  dark:bg-[#0f1b2d]/80
  dark:border-white/10
  dark:text-white
"        aria-label="Åbn menu"
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
className={`
  fixed top-0 left-0 h-screen w-80 z-50
  transform transition-transform duration-300 ease-in-out
  flex flex-col

  bg-white
  border-r border-black/5
  shadow-[0_25px_60px_rgba(0,0,0,0.15)]

  dark:bg-[#162338]
  dark:border-white/10
  dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)]

  ${open ? 'translate-x-0' : '-translate-x-full'}
`}
      >
        {/* Header i menu */}
<div className="px-6 pt-10 pb-6 border-b border-black/5 dark:border-white/10 flex justify-center">
  <Link
    href={isGalley ? '/galley' : '/shop'}
    onClick={() => setOpen(false)}
  >
    {/* Light */}
    <Image
      src="/logo-light.svg"
      alt="HandoverPro"
      width={220}
      height={60}
      className="h-10 w-auto dark:hidden"
      priority
    />

    {/* Dark */}
    <Image
      src="/logo-dark.svg"
      alt="HandoverPro"
      width={220}
      height={60}
      className="h-10 w-auto hidden dark:block"
      priority
    />
  </Link>
</div>

        {/* Menu links */}
<div className="p-6 space-y-2 flex-1">

{/* Partier */}
<Link
  href={isGalley ? '/galley' : '/shop'}
  onClick={() => setOpen(false)}
className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
  pathname === (isGalley ? '/galley' : '/shop')
    ? `
      bg-black/5
      text-gray-900

      dark:bg-white/10
      dark:text-white
    `
    : `
      text-gray-600
      hover:bg-black/5

      dark:text-white/60
      dark:hover:bg-white/10
    `
}`}
>
  {isGalley ? t.partier : t.outlets}
</Link>

{/* Afdelingsmøde */}
<Link
  href={isGalley ? '/galley/afdelingsmoede' : '/shop/afdelingsmoede'}
  onClick={() => setOpen(false)}
className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
  pathname === (isGalley ? '/galley' : '/shop')
    ? `
      bg-black/5
      text-gray-900

      dark:bg-white/10
      dark:text-white
    `
    : `
      text-gray-600
      hover:bg-black/5

      dark:text-white/60
      dark:hover:bg-white/10
    `
}`}
>
  {isGalley ? t.galleyMoede : t.shopMoede}
</Link>

{/* Kalender */}
<Link
  href={isGalley ? '/galley/kalender' : '/shop/kalender'}
  onClick={() => setOpen(false)}
className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
  pathname === (isGalley ? '/galley' : '/shop')
    ? `
      bg-black/5
      text-gray-900

      dark:bg-white/10
      dark:text-white
    `
    : `
      text-gray-600
      hover:bg-black/5

      dark:text-white/60
      dark:hover:bg-white/10
    `
}`}
>
  {t.kalender}
</Link>

{/* Idé parkering */}
<Link
  href={isGalley ? '/galley/ideas' : '/shop/ideas'}
  onClick={() => setOpen(false)}
className={`block px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
  pathname === (isGalley ? '/galley' : '/shop')
    ? `
      bg-black/5
      text-gray-900

      dark:bg-white/10
      dark:text-white
    `
    : `
      text-gray-600
      hover:bg-black/5

      dark:text-white/60
      dark:hover:bg-white/10
    `
}`}
>
  Idé parkering
</Link>
</div>


{/* Bottom section */}
<div className="mt-auto px-6 pb-8 pt-6 border-t border-black/5 dark:border-white/10">
  <div className="flex items-center justify-center gap-6">
    <LanguageToggle />
    <ThemeToggle />
  </div>
</div>

      </aside>
    </>
  )
}
