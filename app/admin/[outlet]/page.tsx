import AdminTabs from '@/components/admin/AdminTabs'

export default async function Page({
  params,
}: {
  params: Promise<{ outlet: string }>
}) {
  const { outlet } = await params

  return (
    <AdminTabs outlet={decodeURIComponent(outlet)} />
  )
}