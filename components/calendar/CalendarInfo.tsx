import { createHolidayEngine } from '@/lib/holidays/holidayEngine'
import { isWorking } from '@/lib/utils/isWorkingDay'

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

  const holidayEngine =
  createHolidayEngine(selectedDate.getFullYear())

  const dateString =
  `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`

  const workingCrew =
  crew.filter((c)=>
    c.date === dateString &&
    isWorking(c.status)
  )

  const sections: Record<string, CrewMember[]> = {}

  workingCrew.forEach((c)=>{

    const section = c.section || "Andet"

    if(!sections[section]){
      sections[section] = []
    }

    sections[section].push(c)

  })

  // find de 2 største hold
  const activeHolds =
  Object.entries(sections)
  .sort((a,b)=> b[1].length - a[1].length)
  .slice(0,2)
  .map(([section])=>section)

  // fordel alle personer på de 2 hold
  const holdA: CrewMember[] = []
  const holdB: CrewMember[] = []

  workingCrew.forEach((person,index)=>{

    if(index % 2 === 0){
      holdA.push(person)
    }else{
      holdB.push(person)
    }

  })

  const holiday =
  holidayEngine.get(selectedDate)

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

<div className="mt-6 space-y-8">

<div className="text-center">

<p className="font-semibold text-gray-800 dark:text-white mb-3">
{activeHolds[0]}
</p>

<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-center">

{holdA.map((c,i)=>(
<p
key={i}
className="text-gray-700 dark:text-white/80 px-2 py-1 rounded-lg bg-gray-100 dark:bg-[#1d2e46]"
>
{c.name}
</p>
))}

</div>

</div>

<div className="text-center">

<p className="font-semibold text-gray-800 dark:text-white mb-3">
{activeHolds[1]}
</p>

<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-center">

{holdB.map((c,i)=>(
<p
key={i}
className="text-gray-700 dark:text-white/80 px-2 py-1 rounded-lg bg-gray-100 dark:bg-[#1d2e46]"
>
{c.name}
</p>
))}

</div>

</div>

</div>

</section>

  )

}