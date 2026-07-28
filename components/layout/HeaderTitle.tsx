'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function HeaderTitle() {
  return (
    <div className="w-full flex flex-col items-center pt-1 pb-1">

      <Link
        href="/admin"
        className="flex items-center transition-transform duration-200 active:scale-95"
      >
        <Image
          src="/go-nordic-logo.png"
          alt="HandoverPro"
          width={420}
          height={120}
          className="
            h-12 sm:h-16 lg:h-20 w-auto
            dark:invert
          "
          priority
        />
      </Link>

    </div>
  )
}
