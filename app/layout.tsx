import type { Metadata } from 'next'
import './globals.css'
import SideMenu from '@/components/SideMenu'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Kitchen Handover',
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
          <SideMenu />

          <div className="min-h-screen">
            <header
              className="
                flex flex-col items-center gap-2
                sm:flex-row sm:justify-between
                p-4 max-w-3xl mx-auto
              "
            >
              <h1 className="text-2xl font-bold">
                Kitchen Handover
              </h1>
            </header>

            <main className="max-w-3xl mx-auto px-4 pb-10">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
