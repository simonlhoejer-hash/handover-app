'use client'

import { ChefHat, ShoppingBag } from 'lucide-react'
import { useDepartment } from '@/lib/DepartmentContext'

export default function DepartmentToggle() {
  const { department, setDepartment } = useDepartment()
  const isGalley = department === 'galley'

  return (
    <div
      className={`
        relative w-48 h-11
        rounded-full
        overflow-hidden
        cursor-pointer select-none
        transition-all duration-300 ease-in-out
        ${isGalley 
          ? 'bg-blue-600' 
          : 'bg-green-600'}
      `}
      onClick={() =>
        setDepartment(isGalley ? 'shop' : 'galley')
      }
    >
      {/* Active background */}
      <div
        className={`
          absolute top-0 left-0
          h-full w-1/2
          bg-white/20
          transition-transform duration-300 ease-in-out
          ${isGalley ? 'translate-x-0' : 'translate-x-full'}
        `}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full text-white font-medium">
        <div className="flex-1 flex items-center justify-center gap-2">
          <ChefHat size={16} />
          Galley
        </div>

        <div className="flex-1 flex items-center justify-center gap-2">
          <ShoppingBag size={16} />
          Shop
        </div>
      </div>
    </div>
  )
}
