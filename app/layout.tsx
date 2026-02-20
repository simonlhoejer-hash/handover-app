import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { LanguageProvider } from '@/lib/LanguageContext'
import ClientLayout from './ClientLayout'

export const metadata: Metadata = {
  title: 'Handover',
  description: 'Intern overlevering',


  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Handover',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
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