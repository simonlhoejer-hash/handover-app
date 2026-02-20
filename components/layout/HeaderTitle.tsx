'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function HeaderTitle() {
  const pathname = usePathname()
  const isGalley = pathname.startsWith('/galley')
  const basePath = isGalley ? '/galley' : '/shop'

  return (
    <div className="w-full flex flex-col items-center py-3">

      <Link href={basePath} className="flex items-center">
        
        {/* Light mode */}
        <Image
          src="/logo-light.svg"
          alt="HandoverPro"
          width={320}
          height={80}
          className="h-12 w-auto dark:hidden"
          priority
        />

        {/* Dark mode */}
        <Image
          src="/logo-dark.svg"
          alt="HandoverPro"
          width={320}
          height={80}
          className="h-12 w-auto hidden dark:block"
          priority
        />

      </Link>

      <div className="mt-1 text-xs uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
        {isGalley ? 'Galley' : 'Shop'}
      </div>

    </div>
  )
}
