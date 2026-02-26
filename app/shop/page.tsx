import DepartmentHome from '@/components/department/DepartmentHome'
import { PARTIS } from '@/lib/partis'

export default function Page() {
  return (
    <DepartmentHome
      department="shop"
      items={PARTIS.shop}
      basePath="/shop/outlet"
    />
  )
}