import HandoverPage from '@/components/HandoverPage'

export default async function Page({
  params,
}: {
  params: Promise<{ parti: string }>
}) {
  const { parti } = await params

  return (
    <HandoverPage
      department="galley"
      itemName={decodeURIComponent(parti)}
    />
  )
}
