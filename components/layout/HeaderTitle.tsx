'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function HeaderTitle() {
  return (
    <div className="w-full max-w-5xl flex items-center justify-between">

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
      </Link>

      <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#347f7a] dark:text-white/60">
        <span className="h-px w-8 bg-current opacity-40" />
        Crew operations
      </div>

    </div>
  )
}
