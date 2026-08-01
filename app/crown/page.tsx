import DepartmentHome from '@/components/department/DepartmentHome'
import { PARTIS } from '@/lib/partis'

export default function Page() {
  return (
    <>

      <DepartmentHome
        department="crown"
        items={PARTIS.galley}
        basePath="/crown/parti"
      />
    </>
  )
}
