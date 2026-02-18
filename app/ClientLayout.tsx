'use client'

import { usePathname } from 'next/navigation'
import SideMenu from '@/components/SideMenu'
import BottomNav from '@/components/BottomNav'
import HeaderTitle from '@/components/HeaderTitle'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdmin = pathname === '/'

  if (isAdmin) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <>
      <div className="flex min-h-screen">

        <div className="hidden md:block">
          <SideMenu />
        </div>

        <div className="flex-1 flex flex-col">

          <header className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between p-4 max-w-3xl mx-auto w-full">
            <HeaderTitle />
          </header>

          <main className="flex-1 max-w-3xl mx-auto px-4 pb-20 md:pb-6 w-full">
            {children}
          </main>

        </div>
      </div>

      <div className="md:hidden">
        <BottomNav />
      </div>
    </>
  )
}
