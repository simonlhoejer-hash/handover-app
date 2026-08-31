import DepartmentHome from '@/components/department/DepartmentHome'
import { CROWN_PARTI_GROUPS, PARTIS } from '@/lib/partis'

export default function Page() {
  return (
    <>

      <DepartmentHome
        department="crown"
        items={PARTIS.galley}
        groups={CROWN_PARTI_GROUPS.map((group) => ({
          title: group.title,
          items: [...group.items],
        }))}
        basePath="/crown/parti"
      />
    </>
  )
}
