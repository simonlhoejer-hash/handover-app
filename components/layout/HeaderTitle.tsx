'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function HeaderTitle() {
  const pathname = usePathname()
  const isGalley = pathname.startsWith('/galley')
  const basePath = isGalley ? '/galley' : '/shop'

  return (
    <div className="w-full flex flex-col items-center pt-8 pb-6">

      <Link
        href={basePath}
        className="flex items-center transition-transform duration-200 active:scale-95"
      >

        <Image
          src="/go-nordic-logo.png"
          alt="Go Nordic Cruiseline"
          width={420}
          height={120}
          className="
            h-16 sm:h-20 lg:h-24 w-auto
            dark:invert
          "
          priority
        />

      </Link>

      <div
className="
mt-4
px-5 py-2
rounded-full
text-[12px]
font-semibold
uppercase
tracking-[0.35em]

bg-[#e8f0ef]
text-[#1f5c58]

border border-[#1f5c58]/20

dark:bg-[#1f5c58]/25
dark:text-[#a6d2cd]
"
      >
        {isGalley ? 'Galley' : 'Crew'}
      </div>

    </div>
  )
}