import PartiTabs from '@/components/department/PartiTabs'

export default async function Page({
  params,
}: {
  params: Promise<{ parti: string }>
}) {
  const { parti } = await params

  return <PartiTabs parti={decodeURIComponent(parti)} />
}