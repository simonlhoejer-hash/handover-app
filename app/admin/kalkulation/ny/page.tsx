"use client"

import { useState } from "react"

type Ingredient = {
  name: string
  price: number // kr/kg
  waste: number // %
  amount: number // kg
}

export default function NyKalkulation() {

  const [name, setName] = useState("")
  const [salePrice, setSalePrice] = useState(0)
  const [portions, setPortions] = useState(1)

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", price: 0, waste: 0, amount: 0 }
  ])

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: "", price: 0, waste: 0, amount: 0 }
    ])
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  // 📊 Beregninger
  const total = ingredients.reduce((sum, i) => {
    const wasteFactor = 1 + i.waste / 100
    const realPrice = i.price * wasteFactor
    return sum + realPrice * i.amount
  }, 0)

  const pricePerPortion = portions > 0 ? total / portions : 0

  const foodCost =
    salePrice > 0 ? (pricePerPortion / salePrice) * 100 : 0

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-semibold">Ny kalkulation</h1>

      {/* BASICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div>
          <label className="text-sm">Ret navn</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-gray-100 dark:bg-[#1d2e46] rounded-xl"
          />
        </div>

        <div>
          <label className="text-sm">Salgspris (kr)</label>
          <input
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(Number(e.target.value))}
            className="w-full p-3 bg-gray-100 dark:bg-[#1d2e46] rounded-xl"
          />
        </div>

        <div>
          <label className="text-sm">Portioner</label>
          <input
            type="number"
            value={portions}
            onChange={(e) => setPortions(Number(e.target.value))}
            className="w-full p-3 bg-gray-100 dark:bg-[#1d2e46] rounded-xl"
          />
        </div>

      </div>

      {/* INGREDIENSER */}
      <div className="space-y-3">

        <h2 className="font-medium">Ingredienser</h2>

        {/* HEADER */}
        <div className="hidden md:grid grid-cols-5 gap-2 text-sm text-gray-500">
          <span>Navn</span>
          <span>Pris (kr/kg)</span>
          <span>Svind (%)</span>
          <span>Mængde (kg)</span>
          <span></span>
        </div>

        {ingredients.map((ing, index) => (
          <div
            key={index}
            className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center"
          >

            <input
              placeholder="Navn"
              value={ing.name}
              onChange={(e) =>
                updateIngredient(index, "name", e.target.value)
              }
              className="p-2 bg-gray-100 dark:bg-[#1d2e46] rounded-xl"
            />

            <input
              type="number"
              step="0.01"
              placeholder="kr/kg"
              value={ing.price}
              onChange={(e) =>
                updateIngredient(index, "price", Number(e.target.value))
              }
              className="p-2 bg-gray-100 dark:bg-[#1d2e46] rounded-xl"
            />

            <input
              type="number"
              step="0.1"
              placeholder="%"
              value={ing.waste}
              onChange={(e) =>
                updateIngredient(index, "waste", Number(e.target.value))
              }
              className="p-2 bg-gray-100 dark:bg-[#1d2e46] rounded-xl"
            />

            <input
              type="number"
              step="0.01"
              placeholder="kg"
              value={ing.amount}
              onChange={(e) =>
                updateIngredient(index, "amount", Number(e.target.value))
              }
              className="p-2 bg-gray-100 dark:bg-[#1d2e46] rounded-xl"
            />

            <button
              onClick={() => removeIngredient(index)}
              className="bg-red-500 text-white rounded-xl px-3 py-2"
            >
              X
            </button>

          </div>
        ))}

        <button
          onClick={addIngredient}
          className="px-4 py-2 bg-black text-white rounded-xl"
        >
          + Tilføj ingrediens
        </button>

      </div>

      {/* RESULTAT */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#162338] space-y-2">

        <p>Total råvarepris: <b>{total.toFixed(2)} kr</b></p>

        <p>Pris pr portion: <b>{pricePerPortion.toFixed(2)} kr</b></p>

        <p>
          Food cost:{" "}
          <b className={
            foodCost < 25
              ? "text-green-400"
              : foodCost < 30
              ? "text-yellow-400"
              : "text-red-400"
          }>
            {foodCost.toFixed(1)}%
          </b>
        </p>

      </div>

      <button className="px-6 py-3 bg-black text-white rounded-2xl">
        Gem kalkulation
      </button>

    </div>
  )
}