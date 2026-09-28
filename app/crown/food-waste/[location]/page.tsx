import { notFound } from 'next/navigation'
import FoodWasteLocationPage from '@/components/food-waste/FoodWasteLocationPage'
import { FOOD_WASTE_LOCATIONS, getFoodWasteLocation } from '@/lib/foodWasteLocations'
import { getConfiguredFoodWasteStations } from '@/lib/foodWasteStationsServer'

export const dynamicParams = true

export function generateStaticParams() {
  return FOOD_WASTE_LOCATIONS.map((location) => ({ location: location.slug }))
}

type Props = {
  params: Promise<{
    location: string
  }>
}

export default async function CrownFoodWasteLocationPage({ params }: Props) {
  const { location } = await params
  const foodWasteLocation = getFoodWasteLocation(location) ?? (await getConfiguredFoodWasteStations('crown')).find((station) => station.slug === location && station.active)

  if (!foodWasteLocation) {
    notFound()
  }

  return <FoodWasteLocationPage locationName={foodWasteLocation.name} />
}
