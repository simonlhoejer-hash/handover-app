import AdminDepartmentHome from '@/components/department/AdminDepartmentHome'
import { OUTLETS } from '@/lib/outlets'

export default function Page() {
  return (
    <AdminDepartmentHome
      items={OUTLETS.admin}
      basePath="/admin"
    />
  )
}