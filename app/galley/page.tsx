import DepartmentHome from '@/components/department/DepartmentHome'

const PARTIER = [
  'NORD',
  'SYD',
  'KULL varmt',
  'KULL koldt',
  'Konditor',
  'Besætning',
  'Opsætter',
  'Skagerak',
  'Stilling 2',
  'Stilling 1',
  'Slagter',
]

export default function Page() {
  return (
    <DepartmentHome
      department="galley"
      items={PARTIER}
      basePath="/galley/parti"
    />
  )
}
