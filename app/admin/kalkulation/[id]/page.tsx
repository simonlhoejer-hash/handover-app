"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Ingredient = {
  name: string
  price: number
  waste: number
  amount: number
}

export default function KalkulationDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [recipe, setRecipe] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    async function fetchData() {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      setRecipe(data)
      setLoading(false)
    }

    fetchData()
  }, [id])

  if (loading) {
    return <p className="p-6">Loader...</p>
  }

  if (!recipe) {
    return (
      <div className="p-6">
        <p>Kunne ikke finde kalkulation</p>
        <button
          onClick={() => router.push("/admin/kalkulation")}
          className="mt-4 px-4 py-2 bg-black text-white rounded-xl"
        >
          Tilbage
        </button>
      </div>
    )
  }

  // 📊 Beregninger
  const total = (recipe.ingredients || []).reduce(
    (sum: number, i: Ingredient) => {
      const wasteFactor = 1 + i.waste / 100
      const realPrice = i.price * wasteFactor
      return sum + realPrice * i.amount
    },
    0
  )

  const pricePerPortion =
    recipe.portions > 0 ? total / recipe.portions : 0

  const foodCost =
    recipe.sale_price > 0
      ? (pricePerPortion / recipe.sale_price) * 100
      : 0

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <div className="space-y-1">
          <button
            onClick={() => router.push("/admin/kalkulation")}
            className="text-sm text-gray-400 hover:underline"
          >
            ← Tilbage
          </button>

          <h1 className="text-2xl font-semibold">
            {recipe.name}
          </h1>

          <p className="text-gray-500">
            {recipe.portions} portioner
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/opskrift/${recipe.id}`)}
            className="px-4 py-2 bg-gray-200 dark:bg-[#1d2e46] rounded-xl"
          >
            Se opskrift
          </button>

          <button className="px-4 py-2 bg-black text-white rounded-xl">
            Rediger
          </button>
        </div>

      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="p-4 rounded-2xl bg-white dark:bg-[#162338]">
          <p className="text-sm text-gray-500">Total råvarepris</p>
          <p className="text-xl font-semibold">
            {total.toFixed(2)} kr
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#162338]">
          <p className="text-sm text-gray-500">Pris pr portion</p>
          <p className="text-xl font-semibold">
            {pricePerPortion.toFixed(2)} kr
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#162338]">
          <p className="text-sm text-gray-500">Food cost</p>
          <p
            className={`text-xl font-semibold ${
              foodCost < 25
                ? "text-green-400"
                : foodCost < 30
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {foodCost.toFixed(1)}%
          </p>
        </div>

      </div>

      {/* INGREDIENSER */}
      <div className="bg-white dark:bg-[#162338] rounded-2xl overflow-hidden">

        <div className="grid grid-cols-4 px-4 py-3 text-sm text-gray-500 border-b">
          <span>Navn</span>
          <span>Pris</span>
          <span>Svind</span>
          <span>Mængde</span>
        </div>

        {(recipe.ingredients || []).map((i: Ingredient, index: number) => (
          <div
            key={index}
            className="grid grid-cols-4 px-4 py-3 border-b"
          >
            <span>{i.name}</span>
            <span>{i.price} kr/kg</span>
            <span>{i.waste}%</span>
            <span>{i.amount} kg</span>
          </div>
        ))}

      </div>

    </div>
  )
}