"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function KalkulationPage() {
  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecipes() {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      setRecipes(data || [])
      setLoading(false)
    }

    fetchRecipes()
  }, [])

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Kalkulationer</h1>

        <Link href="/admin/kalkulation/ny">
          <button className="bg-black text-white px-4 py-2 rounded-xl hover:opacity-80 transition">
            + Ny kalkulation
          </button>
        </Link>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-[#162338] rounded-2xl shadow overflow-hidden">

        <div className="grid grid-cols-2 px-4 py-3 text-sm text-gray-500 border-b">
          <span>Ret</span>
          <span>Food cost</span>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="p-6 text-center text-gray-400">
            Loader...
          </div>
        )}

        {/* EMPTY */}
        {!loading && recipes.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            Ingen kalkulationer endnu
          </div>
        )}

        {/* DATA */}
        {recipes.map((r) => {
          const total = (r.ingredients || []).reduce((sum: number, i: any) => {
            const wasteFactor = 1 + i.waste / 100
            const realPrice = i.price * wasteFactor
            return sum + realPrice * i.amount
          }, 0)

          const pricePerPortion =
            r.portions > 0 ? total / r.portions : 0

          const foodCost =
            r.sale_price > 0
              ? (pricePerPortion / r.sale_price) * 100
              : 0

          return (
            <Link key={r.id} href={`/admin/kalkulation/${r.id}`}>
              <div className="grid grid-cols-2 px-4 py-4 hover:bg-gray-100 dark:hover:bg-[#1d2e46] transition cursor-pointer border-b">

                <span className="font-medium">
                  {r.name}
                </span>

                <span
                  className={`font-medium ${
                    foodCost < 25
                      ? "text-green-400"
                      : foodCost < 30
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {foodCost.toFixed(1)}%
                </span>

              </div>
            </Link>
          )
        })}

      </div>

    </div>
  )
}