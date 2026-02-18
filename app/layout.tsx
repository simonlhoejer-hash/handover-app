import type { Metadata } from 'next'
import './globals.css'

import SideMenu from '@/components/SideMenu'
import BottomNav from '@/components/BottomNav'
import { Providers } from './providers'
import { LanguageProvider } from '@/lib/LanguageContext'
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
          <LanguageProvider>

            <div className="flex min-h-screen">

              {/* Desktop SideMenu */}
              <div className="hidden md:block">
                <SideMenu />
              </div>

              {/* Main content area */}
              <div className="flex-1 flex flex-col">

                <header
                  className="
                    flex flex-col items-center gap-3
                    sm:flex-row sm:justify-between
                    p-4 max-w-3xl mx-auto w-full
                  "
                >
                  <HeaderTitle />
                </header>

                <main className="flex-1 max-w-3xl mx-auto px-4 pb-20 md:pb-6 w-full">
                  {children}
                </main>

              </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden">
              <BottomNav />
            </div>

          </LanguageProvider>
        </Providers>
      </body>
    </html>
  )
}
