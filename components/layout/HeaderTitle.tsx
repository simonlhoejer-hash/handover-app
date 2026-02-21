'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function HeaderTitle() {
  const pathname = usePathname()
  const isGalley = pathname.startsWith('/galley')
  const basePath = isGalley ? '/galley' : '/shop'

return (
  <div
    className="
      w-full
      flex flex-col items-center
      pt-6 pb-4
    "
  >

    <Link
      href={basePath}
      className="
        flex items-center
        transition-transform duration-200
        active:scale-95
      "
    >
      {/* Light */}
      <Image
        src="/logo-light.svg"
        alt="HandoverPro"
        width={320}
        height={80}
        className="h-12 sm:h-14 w-auto dark:hidden"
        priority
      />

      {/* Dark */}
      <Image
        src="/logo-dark.svg"
        alt="HandoverPro"
        width={320}
        height={80}
        className="h-12 sm:h-14 w-auto hidden dark:block"
        priority
      />
    </Link>

    <div
      className="
        mt-3
        px-4 py-1.5
        rounded-full
        text-[11px]
        font-semibold
        uppercase
        tracking-[0.25em]

        bg-black/5
        text-gray-600

        dark:bg-white/10
        dark:text-white/70
      "
    >
      {isGalley ? 'Galley' : 'Shop'}
    </div>

  </div>
)
}