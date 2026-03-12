'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type Props = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function Accordion({
  title,
  children,
  defaultOpen = false
}: Props) {

  const [open,setOpen] = useState(defaultOpen)

  return(

    <section className="space-y-4">

      <button
        onClick={() => setOpen(!open)}
        className="
          group
          w-full
          flex items-center justify-between
          px-6 py-4
          rounded-3xl
          text-lg font-semibold
          transition-all duration-300
          active:scale-[0.98]

          bg-white
          border border-black/5
          shadow-[0_10px_30px_rgba(0,0,0,0.06)]

          dark:bg-white/5
          dark:border-white/10
          dark:shadow-[0_10px_40px_rgba(0,0,0,0.6)]
        "
      >

        <span className="tracking-tight text-gray-900 dark:text-white">
          {title}
        </span>

        <ChevronDown
          className={`
            text-gray-500 dark:text-gray-300
            transition-all duration-300
            ${open ? 'rotate-180 scale-110' : ''}
            group-hover:scale-110
          `}
        />

      </button>

      <div
        className={`
          overflow-hidden
          transition-all
          duration-500
          ease-in-out
          will-change-[max-height,opacity]
          ${open ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}
        `}
      >

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
          {children}
        </div>

      </div>

    </section>

  )

}