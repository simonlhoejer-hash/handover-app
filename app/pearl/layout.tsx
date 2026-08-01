import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HandoverPro Nordic Pearl',
  manifest: '/manifest-pearl.json',
}

export default function PearlLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
