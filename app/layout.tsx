import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { LanguageProvider } from '@/lib/LanguageContext'
import ClientLayout from './ClientLayout'

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
            <ClientLayout>
              {children}
            </ClientLayout>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  )
}
