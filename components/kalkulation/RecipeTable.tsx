// RecipeTable.tsx

import RecipeRow from './RecipeRow'

type Props = {
  rows: {
    id: number
  }[]
}

export default function RecipeTable({
  rows,
}: Props) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="w-12 text-left py-4">
            #
          </th>

          <th className="text-left py-4">
            Råvare
          </th>

          <th className="w-32 text-left py-4">
            Mængde
          </th>

          <th className="w-24 text-left py-4">
            Enhed
          </th>

          <th className="w-32 text-left py-4">
            Pris
          </th>

          <th className="w-32 text-left py-4">
            I alt
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