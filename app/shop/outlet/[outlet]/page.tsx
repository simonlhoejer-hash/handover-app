import HandoverPage from '@/components/HandoverPage'

export default async function Page({
  params,
}: {
  params: Promise<{ outlet: string }>
}) {
  const { outlet } = await params

  return (
    <HandoverPage
      department="shop"
      itemName={decodeURIComponent(outlet)}
    />
  )
}
