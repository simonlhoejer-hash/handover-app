'use client'

import { useState } from 'react'
import { getDanishSchoolHolidays } from '@/lib/danishSchoolHolidays'

export default function CalendarPage() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(today)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const holidays = getDanishSchoolHolidays(year)

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  const startDay = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const days = []

  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day))
  }

  function isHoliday(date: Date) {
    return holidays.some(
      (h) => date >= h.start && date <= h.end
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        {currentDate.toLocaleString('da-DK', { month: 'long' })} {year}
      </h1>

      <div className="grid grid-cols-7 gap-2">
        {['Man','Tir','Ons','Tor','Fre','Lør','Søn'].map((d) => (
          <div key={d} className="font-semibold text-center">{d}</div>
        ))}

        {days.map((date, index) => (
          <div
            key={index}
            className={`h-20 rounded-lg flex items-center justify-center
              ${date && isHoliday(date) ? 'bg-green-300' : 'bg-gray-100'}
            `}
          >
            {date ? date.getDate() : ''}
          </div>
        ))}
      </div>
    </div>
  )
}
