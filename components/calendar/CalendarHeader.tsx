'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

export default function CalendarHeader({
  year,
  month,
  currentDate,
  setCurrentDate
}: any){

  return(

    <div className="space-y-5">

      {/* LOGO */}
      <div className="flex justify-center">
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
      </div>

      {/* CALENDAR HEADER */}
      <section className="
        rounded-2xl
        px-4 py-3
        bg-white
        border border-black/5
        shadow-sm
        dark:bg-[#162338]
        dark:border-white/10
      ">

        <div className="flex items-center justify-between">

          <button
            onClick={()=>setCurrentDate(new Date(year,month-1,1))}
            className="
              w-8 h-8
              flex items-center justify-center
              rounded-xl
              bg-black/5
              hover:bg-black/10
              transition
              dark:bg-white/10
              dark:hover:bg-white/20
            "
          >
            <ChevronLeft size={16}/>
          </button>

          <h1 className="
            text-base sm:text-lg
            font-semibold
            capitalize
            text-gray-900
            dark:text-white
          ">
            {currentDate.toLocaleString('da-DK',{month:'long'})} {year}
          </h1>

          <button
            onClick={()=>setCurrentDate(new Date(year,month+1,1))}
            className="
              w-8 h-8
              flex items-center justify-center
              rounded-xl
              bg-black/5
              hover:bg-black/10
              transition
              dark:bg-white/10
              dark:hover:bg-white/20
            "
          >
            <ChevronRight size={16}/>
          </button>

        </div>

      </section>

    </div>

  )

}