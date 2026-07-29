'use client'

import { usePathname } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import AdminBottomNav from '@/components/layout/AdminBottomNav'
import HeaderTitle from '@/components/layout/HeaderTitle'
import ConnectionStatus from '@/components/pwa/ConnectionStatus'
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLogin = pathname === '/'

  const isAdmin =
    pathname === '/' ||
    pathname.startsWith('/admin')

  if (isLogin) {
    return (
      <>
        <ServiceWorkerRegistration />
        {children}
      </>
    )
  }

  return (
    <>
      <ServiceWorkerRegistration />
      {!isAdmin && <ConnectionStatus />}

      <div className="min-h-screen flex flex-col">

        <header
          className="
            w-full
            px-5
            pt-3
            pb-3
            flex
            flex-col
            items-center
            bg-white/90
            border-b border-[#0f4f4a]/10
            backdrop-blur-xl
            dark:bg-[#073f3d]/90
            dark:border-white/10
            sticky top-0 z-30
          "
        >
          <HeaderTitle />
        </header>

        <main
          className="
            flex-1
            w-full
            max-w-5xl
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
