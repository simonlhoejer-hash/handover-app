import type { Metadata } from 'next'

export const metadata: Metadata = {
  manifest: '/manifest-galley.json',
}

export default function GalleyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}