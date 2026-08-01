import ShipAccessForm from '@/components/access/ShipAccessForm'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>
}) {
  const { code } = await searchParams

  return (
    <ShipAccessForm
      ship="crown"
      destination="/crown"
      initialCode={typeof code === 'string' ? code : ''}
    />
  )
}
