import PartiTabs from '@/components/department/PartiTabs'
import { PARTIS } from '@/lib/partis'
import { validHandoverFolderNames } from '@/lib/handoverFolderConfig'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return PARTIS.galley.map((parti) => ({ parti }))
}

export default async function Page({
  params,
}: {
  params: Promise<{ parti: string }>
}) {
  const { parti } = await params
  const decodedParti = decodeURIComponent(parti)

  const isKnownFolder = PARTIS.galley.includes(decodedParti) ||
    (await validHandoverFolderNames('crown')).includes(decodedParti)
  if (!isKnownFolder) {
    notFound()
  }

  return <PartiTabs parti={decodedParti} />
}
