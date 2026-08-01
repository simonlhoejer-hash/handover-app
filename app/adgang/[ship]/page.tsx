import { notFound } from 'next/navigation'
import ShipAccessForm from '@/components/access/ShipAccessForm'
import type { AccessShip } from '@/lib/shipAccess'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ ship: string }>
  searchParams: Promise<{ code?: string | string[] }>
}) {
  const { ship } = await params
  const { code } = await searchParams

  if (ship !== 'crown' && ship !== 'pearl') notFound()

  const accessShip = ship as AccessShip
  const destination = accessShip === 'crown' ? '/crown' : '/pearl'
  const initialCode = typeof code === 'string' ? code : ''

  return (
    <ShipAccessForm
      ship={accessShip}
      destination={destination}
      initialCode={initialCode}
    />
  )
}
