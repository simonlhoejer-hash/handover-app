type Props = {
  salePrice: string
}

export default function RecipeSummary({
  salePrice,
}: Props) {
  return (
    <div>
      <h2>Resultat</h2>

      <div>
        Food Cost
      </div>

      <div>
        Kostpris
      </div>

      <div>
        Salgspris: {salePrice}
      </div>
    </div>
  )
}