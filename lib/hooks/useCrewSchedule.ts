import { useEffect, useState } from 'react'
import { queryString, secureFetch } from '@/lib/secureApi'

export function useCrewSchedule(
  year:number,
  month:number,
  department:'galley' | 'shop'
){

  const [crew,setCrew] = useState<any[]>([])

  useEffect(()=>{

    const fetchCrew = async()=>{

      const start =
        `${year}-${String(month+1).padStart(2,'0')}-01`

      const lastDay =
        new Date(year, month + 1, 0).getDate()

      const end =
        `${year}-${String(month+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`

      try {
        const { data } = await secureFetch<{ data: any[] }>(
          `/api/crew-schedule?${queryString({ department, from: start, to: end })}`
        )
        setCrew(data)
      } catch (error) {
        console.error(error)
      }

    }

    fetchCrew()

  },[year,month,department])

  return crew

}
