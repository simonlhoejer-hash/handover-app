'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Stats = {
  today: number
  week: number
  month: number
  total: number
}

type PageStat = {
  page: string
  count: number
}

export default function AdminStats(){

  const [stats,setStats] = useState<Stats>({
    today:0,
    week:0,
    month:0,
    total:0
  })

  const [pages,setPages] = useState<PageStat[]>([])

  useEffect(()=>{

    const fetchStats = async ()=>{

      const now = new Date()

      const startOfDay = new Date()
      startOfDay.setHours(0,0,0,0)

      const startOfWeek = new Date()
      startOfWeek.setDate(now.getDate()-7)

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const { count:today } = await supabase
        .from("page_visits")
        .select("*",{count:"exact",head:true})
        .gte("created_at",startOfDay.toISOString())

      const { count:week } = await supabase
        .from("page_visits")
        .select("*",{count:"exact",head:true})
        .gte("created_at",startOfWeek.toISOString())

      const { count:month } = await supabase
        .from("page_visits")
        .select("*",{count:"exact",head:true})
        .gte("created_at",startOfMonth.toISOString())

      const { count:total } = await supabase
        .from("page_visits")
        .select("*",{count:"exact",head:true})

      const { data:pageData } = await supabase
        .from("page_visits")
        .select("page")

      const grouped:Record<string,number> = {}

      pageData?.forEach((row)=>{
        grouped[row.page] = (grouped[row.page] || 0) + 1
      })

      const pageStats = Object.entries(grouped)
        .map(([page,count])=>({page,count}))
        .sort((a,b)=>b.count-a.count)

      setPages(pageStats)

      setStats({
        today: today || 0,
        week: week || 0,
        month: month || 0,
        total: total || 0
      })

    }

    fetchStats()

  },[])

  return(

    <div className="space-y-6">

      {/* OVERVIEW */}
      <div className="grid grid-cols-2 gap-4">

        <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5">
          <div className="text-sm opacity-70">Besøg i dag</div>
          <div className="text-xl font-semibold">{stats.today}</div>
        </div>

        <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5">
          <div className="text-sm opacity-70">Besøg uge</div>
          <div className="text-xl font-semibold">{stats.week}</div>
        </div>

        <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5">
          <div className="text-sm opacity-70">Besøg måned</div>
          <div className="text-xl font-semibold">{stats.month}</div>
        </div>

        <div className="p-4 rounded-xl bg-gray-100 dark:bg-white/5">
          <div className="text-sm opacity-70">Total</div>
          <div className="text-xl font-semibold">{stats.total}</div>
        </div>

      </div>

      {/* PAGE STATS */}
      <div className="space-y-2">

        <div className="text-sm uppercase opacity-60">
          Mest besøgte sider
        </div>

        <div className="space-y-2">

          {pages.map((p)=>(
            <div
              key={p.page}
              className="flex justify-between p-3 rounded-lg bg-gray-100 dark:bg-white/5"
            >
              <span>{p.page}</span>
              <span className="font-semibold">{p.count}</span>
            </div>
          ))}

        </div>

      </div>

    </div>

  )

}