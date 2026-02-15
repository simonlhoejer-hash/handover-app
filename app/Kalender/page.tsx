'use client'

import { useState } from 'react'
import { createHolidayEngine } from '@/lib/holidays/holidayEngine'

export default function CalendarPage() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(today)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const holidayEngine = createHolidayEngine(year)

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  const startDay = (firstDayOfMonth.getDay() + 6) % 7
  const daysInMonth = lastDayOfMonth.getDate()

  const days: (Date | null)[] = []

  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day))
  }

  return (
    <div className="p-6">

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:opacity-80 transition"
        >
          ←
        </button>

        <h1 className="text-2xl font-bold capitalize">
          {currentDate.toLocaleString('da-DK', { month: 'long' })} {year}
        </h1>

        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:opacity-80 transition"
        >
          →
        </button>
      </div>

      {/* Calendar */}
      <div className="grid grid-cols-7 gap-2">
        {['Man','Tir','Ons','Tor','Fre','Lør','Søn'].map((d) => (
          <div key={d} className="font-semibold text-center">
            {d}
          </div>
        ))}

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
              className={`h-20 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200

                ${!isSelected && info.isDK && !info.isNO ? 'bg-green-300' : ''}
                ${!isSelected && info.isNO && !info.isDK ? 'bg-blue-300' : ''}
                ${!isSelected && info.isDK && info.isNO ? 'bg-gradient-to-r from-green-300 to-blue-300' : ''}
                ${!isSelected && !info.isDK && !info.isNO ? 'bg-gray-100 dark:bg-gray-700' : ''}

                ${isToday && !isSelected ? 'ring-2 ring-black dark:ring-white' : ''}

                ${isSelected ? 'bg-black text-white dark:bg-white dark:text-black scale-105 shadow-md' : ''}
              `}
            >
              {date ? date.getDate() : ''}
            </div>
          )
        })}
      </div>

      {/* Info box */}
      {selectedDate && (
        <div className="mt-6 p-4 rounded-xl bg-white dark:bg-gray-800 shadow border dark:border-gray-700">
          <p className="font-semibold">
            {selectedDate.toLocaleDateString('da-DK')}
          </p>

          {(() => {
            const info = holidayEngine.get(selectedDate)

            return (
              <>
                {info.isDK && (
                  <p className="text-green-600 mt-2">
                    🇩🇰 {info.dkName}
                  </p>
                )}
                {info.isNO && (
                  <p className="text-blue-600 mt-2">
                    🇳🇴 {info.noName}
                  </p>
                )}
                {!info.isDK && !info.isNO && (
                  <p className="text-gray-500 mt-2">
                    Normal dag
                  </p>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
