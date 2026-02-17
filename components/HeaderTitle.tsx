'use client'

import { useDepartment } from '@/lib/DepartmentContext'

export default function HeaderTitle() {
  const { department } = useDepartment()

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold tracking-tight">
        HandoverPro
      </h1>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {department === 'galley' ? 'Galley' : 'Shop'}
      </p>
    </div>
  )
}
