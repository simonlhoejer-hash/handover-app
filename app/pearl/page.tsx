import DepartmentHome from '@/components/department/DepartmentHome'
import { PARTIS } from '@/lib/partis'

export default function Page() {
  return (
    <DepartmentHome
      department="pearl"
      items={PARTIS.pearl}
      basePath="/pearl/parti"
    />
  )
}
