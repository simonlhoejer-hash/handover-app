'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type CrewMember = {
  date: string
  name: string
  status: string
}

type Props = {
  person: CrewMember | null
  selectedDate: Date
  onClose: () => void
}

export default function CrewModal({ person, selectedDate, onClose }: Props){

const [entries,setEntries] = useState<CrewMember[]>([])

useEffect(()=>{

if(!person) return

async function load(){

const { data } =
await supabase
.from('crew_schedule')
.select('*')
.eq('name', person!.name)
.order('date', { ascending:true })

if(data){
setEntries(data)
}

}

load()

},[person])

if(!person) return null


// kun entries i den måned man står i
const monthEntries =
entries.filter(e => {

const d = new Date(e.date)

return (
d.getMonth() === selectedDate.getMonth() &&
d.getFullYear() === selectedDate.getFullYear()
)

})


// sorter
const sorted =
[...entries].sort(
(a,b)=>
new Date(a.date).getTime() -
new Date(b.date).getTime()
)


let startDate: Date | null = null
let endDate: Date | null = null


// find seneste +DS før eller på selectedDate
for(const entry of sorted){

if(entry.status === '+DS'){

const start = new Date(entry.date)

if(start <= selectedDate){
startDate = start
}

}

}


// find første -DS efter start
if(startDate){

for(const entry of sorted){

if(entry.status === '-DS'){

const end = new Date(entry.date)

if(end >= startDate){
endDate = end
break
}

}

}

}


// beregn tørnperiode
let days = 0

if(startDate && endDate){

days =
Math.round(
(endDate.getTime() - startDate.getTime()) /
(1000*60*60*24)
)

}


function formatDate(date:Date){
return date.toLocaleDateString('da-DK')
}


return(

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white dark:bg-[#162338] rounded-2xl p-6 w-80 shadow-xl">

<h3 className="text-lg font-semibold mb-4 text-center">
{person.name}
</h3>

<div className="space-y-3 text-sm text-center">

{startDate && (
<p>
<span className="font-semibold">Påmønstring</span><br/>
{formatDate(startDate)}
</p>
)}

{endDate && (
<p>
<span className="font-semibold">Afmønstring</span><br/>
{formatDate(endDate)}
</p>
)}

{days > 0 && (
<p>
<span className="font-semibold">Tørnperiode</span><br/>
{days} dage
</p>
)}

</div>

<button
onClick={onClose}
className="mt-6 w-full py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black"
>
Luk
</button>

</div>

</div>

)

}