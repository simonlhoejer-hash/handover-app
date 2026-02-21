'use client'

import { usePathname } from 'next/navigation'
import SideMenu from '@/components/layout/SideMenu'
import BottomNav from '@/components/layout/BottomNav'
import HeaderTitle from '@/components/layout/HeaderTitle'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdmin = pathname === '/'

  const isPartiPage =
    pathname.startsWith('/galley/') ||
    pathname.startsWith('/shop/')

  if (isAdmin) {
    return <div className="min-h-screen">{children}</div>
  }

return (
  <>
    <div className="flex min-h-screen">

      {/* Sidebar */}
      <div className="hidden md:block">
        <SideMenu />
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col">

        <header
          className="
            w-full
            max-w-3xl
            mx-auto
            px-4
            pt-6
            pb-2
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          {!isPartiPage && <HeaderTitle />}
        </header>

        <main
          className="
            flex-1
            w-full
            max-w-3xl
            mx-auto
            px-4
            pb-24
            md:pb-8
          "
        >
          {children}
        </main>

      </div>
    </div>

    {/* Bottom nav mobile */}
    <div className="md:hidden">
      <BottomNav />
    </div>
  </>
)
}
