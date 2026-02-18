'use client'

import { usePathname } from 'next/navigation'

export default function HeaderTitle() {
  const pathname = usePathname()
  const isGalley = pathname.startsWith('/galley')

  return (
    <div className="w-full text-center flex flex-col items-center">
      <h1 className="text-3xl font-bold tracking-tight">
        HandoverPro
      </h1>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {isGalley ? 'Galley' : 'Shop'}
      </p>
    </div>
  )
}
