'use client'

import { useDepartment } from '@/lib/DepartmentContext'

export default function HeaderTitle() {
  const { department } = useDepartment()

  return (
    <h1 className="text-2xl font-bold">
      Handover – {department === 'galley' ? 'Galley' : 'Shop'}
    </h1>
  )
}
