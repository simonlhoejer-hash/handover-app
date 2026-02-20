import DepartmentHome from '@/components/department/DepartmentHome'

const OUTLETS = [
  'Tøj',
  'Sprut',
  'Slik',
  'Parfume',
]

export default function Page() {
  return (
    <DepartmentHome
      department="shop"
      items={OUTLETS}
      basePath="/shop/outlet"
    />
  )
}
