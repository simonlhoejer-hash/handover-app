import ShipAccessForm from '@/components/access/ShipAccessForm'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[]; error?: string | string[] }>
}) {
  const { code, error } = await searchParams

  return (
    <ShipAccessForm
      ship="pearl"
      destination="/pearl"
      initialCode={typeof code === 'string' ? code : ''}
      initialError={typeof error === 'string' ? error : ''}
    />
  )
}
