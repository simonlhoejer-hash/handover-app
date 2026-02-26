import DepartmentHome from '@/components/department/DepartmentHome'
import { PARTIS } from '@/lib/partis'

export default function Page() {
  return (
    <DepartmentHome
      department="galley"
      items={PARTIS.galley}
      basePath="/galley/parti"
    />
  )
}