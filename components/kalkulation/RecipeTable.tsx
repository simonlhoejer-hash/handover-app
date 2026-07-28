// RecipeTable.tsx

'use client'

import { useTranslation } from '@/lib/LanguageContext'
import RecipeRow from './RecipeRow'

type Props = {
  rows: {
    id: number
  }[]
}

export default function RecipeTable({
  rows,
}: Props) {
  const { t } = useTranslation()

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="w-12 text-left py-4">
            #
          </th>

          <th className="text-left py-4">
            {t.rawIngredient}
          </th>

          <th className="w-32 text-left py-4">
            {t.amount}
          </th>

          <th className="w-24 text-left py-4">
            {t.unit}
          </th>

          <th className="w-32 text-left py-4">
            {t.price}
          </th>

          <th className="w-32 text-left py-4">
            {t.total}
          </th>
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => (
          <RecipeRow
            key={row.id}
            row={row}
          />
        ))}
      </tbody>
    </table>
  )
}


