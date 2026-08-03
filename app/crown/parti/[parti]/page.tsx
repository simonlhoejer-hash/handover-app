import PartiTabs from '@/components/department/PartiTabs'
import { PARTIS } from '@/lib/partis'

export function generateStaticParams() {
  return PARTIS.galley.map((parti) => ({ parti }))
}

export default async function Page({
  params,
}: {
  params: Promise<{ parti: string }>
}) {
  const { parti } = await params

  return <PartiTabs parti={decodeURIComponent(parti)} />
}
