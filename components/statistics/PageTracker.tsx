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

      // ignorer interne sider
      if(
        page === "/" ||
        page.startsWith("/admin") ||
        page.startsWith("/kalkulation")
      ){
        return
      }

      // saml alle parti sider
      if(page.startsWith("/galley/parti")){
        page = "/galley/parti"
      }

      let session = localStorage.getItem("handover_session")

      if(!session){
        session = crypto.randomUUID()
        localStorage.setItem("handover_session",session)
      }

      console.log("TRACKING PAGE:", page)

      const { error } = await supabase
        .from("page_visits")
        .insert({
          page,
          session_id: session
        })

      if(error){
        console.error("Supabase tracking error:", error)
      }

    }

    track()

  },[pathname, searchParams])

  return null
}