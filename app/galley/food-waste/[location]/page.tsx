import { notFound } from 'next/navigation'
import FoodWasteLocationPage from '@/components/food-waste/FoodWasteLocationPage'
import { getFoodWasteLocation } from '@/lib/foodWasteLocations'

export const dynamic = 'force-dynamic'

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

  return <FoodWasteLocationPage locationName={foodWasteLocation.name} />
}
