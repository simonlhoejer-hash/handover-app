'use client'

import { useTranslation } from '@/lib/LanguageContext'

type Props = {
  department: string
  setDepartment: (value: string) => void
  recipeType: 'ret' | 'grund'
  setRecipeType: (
    value: 'ret' | 'grund'
  ) => void
  name: string
  setName: (value: string) => void
  salePrice: string
  setSalePrice: (value: string) => void
}

export default function RecipeHeader({
  department,
  setDepartment,
  recipeType,
  setRecipeType,
  name,
  setName,
  salePrice,
  setSalePrice,
}: Props) {
  const { t } = useTranslation()

  return (
    <>
<div className="text-center mb-10">
  <h1 className="text-4xl font-semibold tracking-tight">
    {t.calculation}
  </h1>

  <p className="text-gray-500 mt-2">
    {t.createCalculationSubtitle}
  </p>
</div>

      <div className="max-w-6xl mx-auto bg-white rounded-2xl border p-6 mb-8">

        <div className="grid grid-cols-4 gap-4">

          <div>
            <label className="block text-sm mb-2">
              {t.department}
            </label>

            <select
              value={department}
              onChange={(e) =>
                setDepartment(e.target.value)
              }
              disabled={recipeType === 'grund'}
              className="
                w-full
                border
                rounded-xl
                px-4
                py-3
                disabled:bg-gray-100
              "
            >
              <option>Kull</option>
              <option>Syd</option>
              <option>Nord Banquet</option>
              <option>Skagerrak</option>
              <option>Kværn</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">
              {t.type}
            </label>

            <select
              value={recipeType}
              onChange={(e) =>
                setRecipeType(
                  e.target.value as
                    | 'ret'
                    | 'grund'
                )
              }
              className="
                w-full
                border
                rounded-xl
                px-4
                py-3
              "
            >
              <option value="ret">
                {t.dish}
              </option>

              <option value="grund">
                {t.baseCalculation}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">
              {t.name}
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="
                w-full
                border
                rounded-xl
                px-4
                py-3
              "
              placeholder={
                recipeType === 'grund'
                  ? 'Bearnaise'
                  : 'Burger'
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              {t.salesPrice}
            </label>

            <input
              type="number"
              value={salePrice}
              onChange={(e) =>
                setSalePrice(e.target.value)
              }
              disabled={
                recipeType === 'grund'
              }
              className="
                w-full
                border
                rounded-xl
                px-4
                py-3
                disabled:bg-gray-100
              "
              placeholder="189"
            />
          </div>

        </div>

      </div>
    </>
  )
}


