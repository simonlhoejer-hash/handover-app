'use client'

import { usePathname } from 'next/navigation'

export default function HeaderTitle() {
  const pathname = usePathname()
  const isGalley = pathname.startsWith('/galley')

return (
  <div className="w-full flex flex-col items-center py-6">
    
    <h1 className="
      text-3xl 
      sm:text-4xl 
      font-semibold 
      tracking-tight 
      text-gray-900 
      dark:text-white
    ">
      HandoverPro
    </h1>

    <div className="
      mt-2
      px-3 py-1
      text-[11px]
      font-medium
      uppercase
      tracking-wider
      rounded-full
      bg-gray-100 text-gray-600
      dark:bg-gray-800 dark:text-gray-400
    ">
      {isGalley ? 'Galley' : 'Shop'}
    </div>

  </div>
)
}