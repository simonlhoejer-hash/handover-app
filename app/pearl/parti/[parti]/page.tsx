import PartiTabs from '@/components/department/PartiTabs'
import { PARTIS } from '@/lib/partis'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return PARTIS.pearl.map((parti) => ({ parti }))
}

export default async function Page({
  params,
}: {
  params: Promise<{ parti: string }>
}) {
  const { parti } = await params
  const decodedParti = decodeURIComponent(parti)

  if (!PARTIS.pearl.includes(decodedParti)) {
    notFound()
  }

  return (
    <PartiTabs
      parti={decodedParti}
      department="pearl"
    />
  )
}
