'use client'

import { useState } from 'react'
import { createHolidayEngine } from '@/lib/holidays/holidayEngine'
import { isWorking } from '@/lib/utils/isWorkingDay'
import CrewModal from '@/components/calendar/CrewModal'

type CrewMember = {
  date: string
  name: string
  status: string
  section?: string
}

type Props = {
  selectedDate: Date
  crew: CrewMember[]
}

export default function CalendarInfo({ selectedDate, crew }: Props) {

  const [selectedPerson,setSelectedPerson] = useState<CrewMember | null>(null)

  const holidayEngine =
  createHolidayEngine(selectedDate.getFullYear())

  const dateString =
  `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`

const workingCrew =
crew
.filter((c)=>
  c.date === dateString &&
  ["A","+DS"].includes(c.status?.trim())
)
.sort((a,b)=>a.name.localeCompare(b.name))

  const holiday =
  holidayEngine.get(selectedDate)

  const firstNameCount: Record<string, number> = {}

  workingCrew.forEach((c)=>{
    const first = c.name.split(" ")[0]
    firstNameCount[first] = (firstNameCount[first] || 0) + 1
  })

  return (

<section className="rounded-3xl p-6 sm:p-8 bg-white border border-black/5 shadow dark:bg-[#162338] dark:border-white/10">

<p className="font-semibold text-gray-900 dark:text-white mb-2 text-center">
{selectedDate.toLocaleDateString('da-DK')}
</p>

{holiday.isDK && (
<p className="text-green-500 text-center">
🇩🇰 {holiday.dkName}
</p>
)}

{holiday.isNO && (
<p className="text-blue-500 text-center">
🇳🇴 {holiday.noName}
</p>
)}

{workingCrew.length === 0 && (
<p className="text-gray-500 mt-4 text-center">
Ingen på arbejde
</p>
)}

{workingCrew.length > 0 && (

<div className="mt-6">

<div className="
grid
grid-cols-2
sm:grid-cols-3
md:grid-cols-4
lg:grid-cols-5
gap-2
justify-items-center
">

{workingCrew.map((c,i)=>{

const parts = c.name.split(" ")
const first = parts[0]
const lastInitial = parts[1] ? parts[1][0] : ""

const displayName =
firstNameCount[first] > 1
? `${first} ${lastInitial}`
: first

return (

<p
key={`${c.name}-${i}`}
onClick={()=>setSelectedPerson(c)}
className="
cursor-pointer
text-gray-700
dark:text-white/80
w-28
text-center
py-1
rounded-lg
bg-gray-100
dark:bg-[#1d2e46]
hover:bg-gray-200
dark:hover:bg-[#2a3e5e]
transition
"
>
{displayName}
</p>

)

})}

</div>

</div>

)}

<CrewModal
person={selectedPerson}
selectedDate={selectedDate}
onClose={()=>setSelectedPerson(null)}
/>

</section>

  )

}