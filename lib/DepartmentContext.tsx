'use client'

import { createContext, useContext, useState, useEffect } from 'react'

export type Department = 'galley' | 'shop'

type DepartmentContextType = {
  department: Department
  setDepartment: (d: Department) => void
}

const DepartmentContext = createContext<DepartmentContextType | null>(null)

export function DepartmentProvider({ children }: { children: React.ReactNode }) {
  const [department, setDepartment] = useState<Department>('galley')

useEffect(() => {
  const saved = localStorage.getItem('department')

  if (saved === 'galley' || saved === 'shop') {
    setDepartment(saved)
  }
}, [])


  const changeDepartment = (d: Department) => {
    setDepartment(d)
    localStorage.setItem('department', d)
  }

  return (
    <DepartmentContext.Provider value={{ department, setDepartment: changeDepartment }}>
      {children}
    </DepartmentContext.Provider>
  )
}

export function useDepartment() {
  const context = useContext(DepartmentContext)
  if (!context) {
    throw new Error('useDepartment must be used inside DepartmentProvider')
  }
  return context
}
