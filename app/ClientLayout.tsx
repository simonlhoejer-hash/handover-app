'use client'

import { usePathname } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import AdminBottomNav from '@/components/layout/AdminBottomNav'
import HeaderTitle from '@/components/layout/HeaderTitle'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isAdmin =
    pathname === '/' ||
    pathname.startsWith('/admin')

  const isPartiPage =
    pathname.startsWith('/galley/parti/')

  return (
    <>
      <div className="min-h-screen flex flex-col">

        <header
          className="
            w-full
            max-w-3xl
            mx-auto
            px-4
            pt-2
            pb-1
            flex
            flex-col
            items-center
            gap-1
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
          "
        >
          {children}
        </main>

      </div>

      {isAdmin ? (
        <AdminBottomNav />
      ) : (
        <BottomNav />
      )}
    </>
  )
}
