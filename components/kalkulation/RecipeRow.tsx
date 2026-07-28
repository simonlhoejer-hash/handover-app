// RecipeRow.tsx

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/lib/LanguageContext'

type Ingredient = {
  id: string
  name: string
  unit: string
  price: number
  supplier: string
}

type Props = {
  row: {
    id: number
  }
}

export default function RecipeRow({
  row,
}: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [quantity, setQuantity] =
    useState('')

  const [results, setResults] =
    useState<Ingredient[]>([])

  const [selected, setSelected] =
    useState<Ingredient | null>(null)

  async function searchIngredient(
    value: string
  ) {
    setSearch(value)

    if (value.length < 2) {
      setResults([])
      return
    }

    const { data } = await supabase
      .from('ingredients')
      .select(`
        id,
        name,
        unit,
        price,
        supplier
      `)
      .ilike('name', `%${value}%`)
      .order('name')
      .limit(10)

    setResults(data || [])
  }

  function selectIngredient(
    ingredient: Ingredient
  ) {
    setSelected(ingredient)
    setSearch(ingredient.name)
    setResults([])
  }

  const qty = Number(quantity) || 0

  const lineTotal =
    selected && qty
      ? selected.price * qty
      : 0

  return (
    <tr className="border-b">

      <td className="py-3">
        {row.id}
      </td>

      <td className="relative py-3 pr-4">

        <input
          value={search}
          onChange={(e) =>
            searchIngredient(
              e.target.value
            )
          }
          placeholder={t.searchIngredient}
          className="
            w-full
            border
            rounded-xl
            px-3
            py-3
          "
        />

        {results.length > 0 && (
          <div
            className="
              absolute
              left-0
              right-4
              top-full
              mt-1
              bg-white
              border
              rounded-xl
              shadow-xl
              z-50
              overflow-hidden
            "
          >
            {results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  selectIngredient(item)
                }
                className="
                  block
                  w-full
                  text-left
                  px-4
                  py-3
                  hover:bg-gray-100
                "
              >
                <div className="font-medium">
                  {item.name}
                </div>

                <div
                  className="
                    text-xs
                    text-gray-500
                    mt-1
                  "
                >
                  {item.supplier}
                  {' â€¢ '}
                  {item.price} kr
                  {' â€¢ '}
                  {item.unit}
                </div>
              </button>
            ))}
          </div>
        )}

      </td>

      <td className="py-3 pr-4">
        <input
          value={quantity}
          onChange={(e) =>
            setQuantity(
              e.target.value
            )
          }
          placeholder="0"
          className="
            w-24
            border
            rounded-xl
            px-3
            py-3
          "
        />
      </td>

      <td className="py-3">
        {selected?.unit || '-'}
      </td>

      <td className="py-3">
        {selected
          ? `${selected.price} kr`
          : '-'}
      </td>

      <td className="py-3">
        {lineTotal > 0
          ? `${lineTotal.toFixed(
              2
            )} kr`
          : '-'}
      </td>

    </tr>
  )
}


