'use client'

import { useDepartment } from '@/lib/DepartmentContext'
import GalleyHome from '@/components/GalleyHome'
import ShopHome from '@/components/ShopHome'

export default function Page() {
  const { department } = useDepartment()

  return department === 'galley'
    ? <GalleyHome />
    : <ShopHome />
}
