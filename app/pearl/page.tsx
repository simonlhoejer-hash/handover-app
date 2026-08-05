import DepartmentHome from '@/components/department/DepartmentHome'
import { PARTIS, PEARL_PARTI_GROUPS } from '@/lib/partis'

export default function Page() {
  return (
    <DepartmentHome
      department="pearl"
      items={PARTIS.pearl}
      groups={PEARL_PARTI_GROUPS.map((group) => ({
        title: group.title,
        items: [...group.items],
      }))}
      basePath="/pearl/parti"
    />
  )
}
