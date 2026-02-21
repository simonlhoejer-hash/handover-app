'use client'

import { useState } from 'react'
import { createHolidayEngine } from '@/lib/holidays/holidayEngine'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CalendarPage() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(today)
  const [selectedDate, setSelectedDate] = useState<Date>(today)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const holidayEngine = createHolidayEngine(year)

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  const startDay = (firstDayOfMonth.getDay() + 6) % 7
  const daysInMonth = lastDayOfMonth.getDate()

  const days: (Date | null)[] = []

  for (let i = 0; i < startDay; i++) days.push(null)
  for (let day = 1; day <= daysInMonth; day++)
    days.push(new Date(year, month, day))

  return (
    <main className="max-w-3xl mx-auto px-4 pt-6 pb-24 space-y-10">

      {/* HEADER CARD */}
      <section
        className="
          rounded-3xl
          p-6 sm:p-8

          bg-white
          border border-black/5
          shadow-[0_20px_40px_rgba(0,0,0,0.06)]

          dark:bg-[#162338]
          dark:border-white/10
          dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]
        "
      >
        <div className="flex items-center justify-between">

          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="
              w-10 h-10
              flex items-center justify-center
              rounded-2xl
              transition-all duration-200
              active:scale-95

              bg-black/5
              dark:bg-white/10
            "
          >
            <ChevronLeft size={18} />
          </button>

          <h1 className="text-xl font-semibold capitalize text-gray-900 dark:text-white">
            {currentDate.toLocaleString('da-DK', { month: 'long' })} {year}
          </h1>

          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="
              w-10 h-10
              flex items-center justify-center
              rounded-2xl
              transition-all duration-200
              active:scale-95

              bg-black/5
              dark:bg-white/10
            "
          >
            <ChevronRight size={18} />
          </button>

        </div>
      </section>

      {/* CALENDAR GRID */}
      <section
        className="
          rounded-3xl
          p-6 sm:p-8

          bg-white
          border border-black/5
          shadow-[0_20px_40px_rgba(0,0,0,0.06)]

          dark:bg-[#162338]
          dark:border-white/10
          dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]
        "
      >

        <div className="grid grid-cols-7 gap-3 mb-4 text-sm font-semibold text-gray-600 dark:text-white/70">
          {['Man','Tir','Ons','Tor','Fre','Lør','Søn'].map((d) => (
            <div key={d} className="text-center">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {days.map((date, index) => {
            const info =
              date ? holidayEngine.get(date) : { isDK: false, isNO: false }

            const isSelected =
              selectedDate &&
              date &&
              selectedDate.toDateString() === date.toDateString()

            const isToday =
              date &&
              date.toDateString() === new Date().toDateString()

            return (
              <div
                key={index}
                onClick={() => date && setSelectedDate(date)}
                className={`
                  aspect-square
                  rounded-2xl
                  flex items-center justify-center
                  cursor-pointer
                  text-sm
                  transition-all duration-200
                  active:scale-95

                  ${
                    !isSelected && info.isDK && !info.isNO
                      ? 'bg-green-500/20 text-green-600'
                      : ''
                  }

                  ${
                    !isSelected && info.isNO && !info.isDK
                      ? 'bg-blue-500/20 text-blue-600'
                      : ''
                  }

                  ${
                    !isSelected && info.isDK && info.isNO
                      ? 'bg-gradient-to-r from-green-400/30 to-blue-400/30'
                      : ''
                  }

                  ${
                    !isSelected && !info.isDK && !info.isNO
                      ? 'bg-gray-100 dark:bg-[#1d2e46]'
                      : ''
                  }

                  ${
                    isToday && !isSelected
                      ? 'ring-2 ring-black dark:ring-white'
                      : ''
                  }

                  ${
                    isSelected
                      ? 'bg-black text-white dark:bg-white dark:text-black scale-105 shadow-lg'
                      : 'hover:scale-105'
                  }
                `}
              >
                {date ? date.getDate() : ''}
              </div>
            )
          })}
        </div>

      </section>

      {/* INFO BOX */}
      {selectedDate && (
        <section
          className="
            rounded-3xl
            p-6 sm:p-8

            bg-white
            border border-black/5
            shadow-[0_20px_40px_rgba(0,0,0,0.06)]

            dark:bg-[#162338]
            dark:border-white/10
            dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]
          "
        >
          <p className="font-semibold text-gray-900 dark:text-white">
            {selectedDate.toLocaleDateString('da-DK')}
          </p>

          {(() => {
            const info = holidayEngine.get(selectedDate)

            return (
              <>
                {info.isDK && (
                  <p className="text-green-500 mt-3">
                    🇩🇰 {info.dkName}
                  </p>
                )}
                {info.isNO && (
                  <p className="text-blue-500 mt-3">
                    🇳🇴 {info.noName}
                  </p>
                )}
                {!info.isDK && !info.isNO && (
                  <p className="text-gray-500 dark:text-white/50 mt-3">
                    Normal dag
                  </p>
                )}
              </>
            )
          })()}
        </section>
      )}

    </main>
  )
}