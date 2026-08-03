import { notFound } from 'next/navigation'
import FoodWasteLocationPage from '@/components/food-waste/FoodWasteLocationPage'
import { FOOD_WASTE_LOCATIONS, getFoodWasteLocation } from '@/lib/foodWasteLocations'

export function generateStaticParams() {
  return FOOD_WASTE_LOCATIONS.map((location) => ({ location: location.slug }))
}

type Props = {
  params: Promise<{
    location: string
  }>
}

export default async function Page({ params }: Props) {
  const { location } = await params
  const foodWasteLocation = getFoodWasteLocation(location)

  if (!foodWasteLocation) {
    notFound()
  }

  return (
    <FoodWasteLocationPage
      locationName={foodWasteLocation.name}
      vessel="pearl"
      basePath="/pearl"
    />
  )
}
