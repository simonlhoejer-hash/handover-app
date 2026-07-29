'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function HeaderTitle() {
  return (
    <div className="w-full flex flex-col items-center pt-1 pb-1">

      <Link
        href="/admin"
        aria-label="Go Nordic Cruiseline"
        className="flex items-center transition-transform duration-200 active:scale-95"
      >
        <Image
          src="/go-nordic-logo.png"
          alt="Go Nordic Cruiseline"
          width={420}
          height={120}
          className="
            h-12 sm:h-16 lg:h-20 w-auto
            dark:hidden
          "
          priority
        />
        <Image
          src="/go-nordic-logo-dark.png"
          alt=""
          aria-hidden="true"
          width={420}
          height={120}
          className="
            hidden h-12 sm:h-16 lg:h-20 w-auto
            dark:block
          "
          priority
        />
      </Link>

    </div>
  )
}
