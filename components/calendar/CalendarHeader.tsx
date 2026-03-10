import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CalendarHeader({
  year,
  month,
  currentDate,
  setCurrentDate
}:any){

  return(

    <section className="rounded-3xl p-6 sm:p-8 bg-white border border-black/5 shadow dark:bg-[#162338] dark:border-white/10">

      <div className="flex items-center justify-between">

        <button
          onClick={()=>setCurrentDate(new Date(year,month-1,1))}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-black/5 dark:bg-white/10"
        >
          <ChevronLeft size={18}/>
        </button>

        <h1 className="text-xl font-semibold capitalize text-gray-900 dark:text-white">
          {currentDate.toLocaleString('da-DK',{month:'long'})} {year}
        </h1>

        <button
          onClick={()=>setCurrentDate(new Date(year,month+1,1))}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-black/5 dark:bg-white/10"
        >
          <ChevronRight size={18}/>
        </button>

      </div>

    </section>

  )

}