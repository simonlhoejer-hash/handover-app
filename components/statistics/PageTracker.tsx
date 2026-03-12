'use client'

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function PageTracker(){

  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(()=>{

    const track = async () => {

      if(!pathname) return

      let page = decodeURIComponent(pathname)

      if(page === "/") return

      if(page.startsWith("/galley/parti")){
        page = "/galley/parti"
      }

      let session = localStorage.getItem("handover_session")

      if(!session){
        session = crypto.randomUUID()
        localStorage.setItem("handover_session",session)
      }

      console.log("TRACKING PAGE:", page)

      await supabase
        .from("page_visits")
        .insert({
          page,
          session_id: session
        })

    }

    track()

  },[pathname, searchParams])

  return null
}