'use client'

import CalendarHeader from '@/components/calendar/CalendarHeader'
import CalendarGrid from '@/components/calendar/CalendarGrid'
import CalendarInfo from '@/components/calendar/CalendarInfo'
import { useCrewSchedule } from '@/lib/hooks/useCrewSchedule'
import { useState } from 'react'

export default function Page(){

  const today = new Date()

  const [currentDate,setCurrentDate] = useState(today)
  const [selectedDate,setSelectedDate] = useState(today)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year,month,1)
  const lastDayOfMonth = new Date(year,month+1,0)

  const startDay = (firstDayOfMonth.getDay()+6)%7
  const daysInMonth = lastDayOfMonth.getDate()

  const days:(Date|null)[] = []

  for(let i=0;i<startDay;i++) days.push(null)
  for(let d=1;d<=daysInMonth;d++)
    days.push(new Date(year,month,d))

  const crew = useCrewSchedule(year,month,'galley')

  return(

    <main className="max-w-3xl mx-auto px-4 pt-6 pb-24 space-y-10">

      <CalendarHeader
        year={year}
        month={month}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
      />

      <CalendarGrid
        days={days}
        crew={crew}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      <CalendarInfo
        selectedDate={selectedDate}
        crew={crew}
      />

    </main>

  )

}