'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSideMenu from '@/components/admin/AdminSideMenu'
import Image from 'next/image'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const isAuth = localStorage.getItem('admin-auth')
    if (isAuth !== 'true') {
      router.push('/')
    }
  }, [])

  return (
    <>
      {/* Side menu */}
      <AdminSideMenu />

      {/* Content */}
      <main className="min-h-screen px-4 pt-24 pb-24">

        {/* 🔥 GLOBAL ADMIN HEADER */}
        <div className="flex flex-col items-center text-center mb-10">
          
          <Image
            src="/go-nordic-logo.png"
            alt="Go Nordic"
            width={260}
            height={80}
            className="h-16 w-auto mb-4"
            priority
          />

        </div>

        {children}
      </main>
    </>
  )
}