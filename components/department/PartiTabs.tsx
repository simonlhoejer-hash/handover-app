'use client'

import HandoverPage from '@/components/handover/HandoverPage'

type Props = {
  parti: string
  department?: 'galley' | 'pearl'
}

export default function PartiTabs({ parti, department = 'galley' }: Props) {
  return (
    <div className="w-full">
      <HandoverPage
        department={department}
        itemName={parti}
      />
    </div>
  )
}
