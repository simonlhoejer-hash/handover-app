import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useCrewSchedule(year:number, month:number){

  const [crew,setCrew] = useState<any[]>([])

  useEffect(()=>{

    const fetchCrew = async()=>{

      const start =
        `${year}-${String(month+1).padStart(2,'0')}-01`

      const lastDay =
        new Date(year, month + 1, 0).getDate()

      const end =
        `${year}-${String(month+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`

      const { data, error } = await supabase
        .from('crew_schedule')
        .select('*')
        .gte('date',start)
        .lte('date',end)

      if(error){
        console.error(error)
        return
      }

      if(data){
        setCrew(data)
      }

    }

    fetchCrew()

  },[year,month])

  return crew

}