'use client'

import { useTranslation } from '@/lib/LanguageContext'

type Props = {
  salePrice: string
}

export default function RecipeSummary({
  salePrice,
}: Props) {
  const { t } = useTranslation()

  return (
    <div>
      <h2>{t.result}</h2>

      <div>
        {t.foodCost}
      </div>

      <div>
        {t.costPrice}
      </div>

      <div>
        {t.salesPrice}: {salePrice}
      </div>
    </div>
  )
}
