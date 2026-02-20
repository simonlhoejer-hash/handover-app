import type { Metadata } from 'next'

export const metadata: Metadata = {
  manifest: '/manifest-shop.json',
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}