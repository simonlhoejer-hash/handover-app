"use client"

import { useState } from "react"

export default function NyKalkulation() {

  const [name,setName] = useState("")
  const [salePrice,setSalePrice] = useState("")

  return (

    <div>

      <h1>Ny kalkulation</h1>

      <input
        placeholder="Ret navn"
        value={name}
        onChange={(e)=>setName(e.target.value)}
      />

      <input
        placeholder="Salgspris"
        value={salePrice}
        onChange={(e)=>setSalePrice(e.target.value)}
      />

      <button>Gem</button>

    </div>

  )
}