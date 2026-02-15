import type { Metadata } from 'next'
import './globals.css'
import SideMenu from '@/components/SideMenu'
import { Providers } from './providers'
import { DepartmentProvider } from '@/lib/DepartmentContext'
import DepartmentToggle from '@/components/DepartmentToggle'
import HeaderTitle from '@/components/HeaderTitle'

export const metadata: Metadata = {
  title: 'Handover',
  description: 'Intern overlevering',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="da" suppressHydrationWarning>
      <body className="bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors">
        <Providers>
          <DepartmentProvider>
            <SideMenu />

            <div className="min-h-screen">
              <header
                className="
                  flex flex-col items-center gap-3
                  sm:flex-row sm:justify-between
                  p-4 max-w-3xl mx-auto
                "
              >
                <HeaderTitle />
                <DepartmentToggle />
              </header>

              <main className="max-w-3xl mx-auto px-4 pb-10">
                {children}
              </main>
            </div>
          </DepartmentProvider>
        </Providers>
      </body>
    </html>
  )
}
