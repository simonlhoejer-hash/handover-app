'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function HeaderTitle() {
  return (
    <div className="w-full flex flex-col items-center pt-8 pb-6">

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
            h-16 sm:h-20 lg:h-24 w-auto
            dark:invert
          "
          priority
        />
      </Link>

    </div>
  )
}