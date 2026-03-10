import { isWorking } from '@/lib/utils/isWorkingDay'
import { isShiftDay } from '@/lib/utils/isShiftDay'

type CrewMember = {
  date: string
  name: string
  status: string
  section?: string
}

type Props = {
  days: (Date | null)[]
  crew: CrewMember[]
  selectedDate: Date
  setSelectedDate: (date:Date)=>void
}

export default function CalendarGrid({
  days,
  crew,
  selectedDate,
  setSelectedDate
}: Props){

  return(

<section className="rounded-3xl p-6 sm:p-8 bg-white border border-black/5 shadow dark:bg-[#162338] dark:border-white/10">

<div className="grid grid-cols-7 gap-3 mb-4 text-sm font-semibold text-gray-600 dark:text-white/70">
{['Man','Tir','Ons','Tor','Fre','Lør','Søn'].map((d)=>(
<div key={d} className="text-center">{d}</div>
))}
</div>

<div className="grid grid-cols-7 gap-3">

{days.map((date,index)=>{

if(!date){
return(
<div key={index} className="aspect-square rounded-2xl bg-gray-100 dark:bg-[#1d2e46]"/>
)
}

const dateString =
`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`

const workingCrew =
crew.filter((c)=>
c.date === dateString &&
isWorking(c.status)
)

const shiftDay =
isShiftDay(date)

const isSelected =
selectedDate.toDateString() === date.toDateString()

return(

<div
key={index}
onClick={()=>setSelectedDate(date)}
className={`
aspect-square
rounded-2xl
flex flex-col
items-center
justify-center
cursor-pointer
text-sm
transition-all

${
shiftDay
? "bg-blue-200 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200"
: workingCrew.length>0
? "bg-green-500/20 text-green-600"
: "bg-gray-100 dark:bg-[#1d2e46]"
}

${isSelected ? "ring-2 ring-black dark:ring-white scale-105" : ""}
`}
>

<span>
{date.getDate()}
</span>

{workingCrew.length>0 &&(
<span className="text-[10px] opacity-70 mt-1">
👨‍🍳 {workingCrew.length}
</span>
)}

{shiftDay && (
<span className="text-[10px] mt-1">
🔄
</span>
)}

</div>

)

})}

</div>

</section>

  )

}