'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function HeaderTitle() {
  return (
    <div className="w-full max-w-5xl flex items-center justify-center">

      <Link
        href="/"
        aria-label="Go Nordic Cruiseline"
        className="flex flex-col items-center transition-transform duration-200 active:scale-95"
      >
        <Image
          src="/go-nordic-logo.png"
          alt="Go Nordic Cruiseline"
          width={420}
          height={120}
          className="
            h-10 sm:h-12 w-auto
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
            hidden h-10 sm:h-12 w-auto
            dark:block
          "
          priority
        />
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-[#347f7a] dark:text-white/55">
          Powered by HandoverPro
        </span>
      </Link>

    </div>
  )
}
