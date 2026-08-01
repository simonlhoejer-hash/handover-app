'use client'

import HandoverPage from '@/components/handover/HandoverPage'

type Props = {
  parti: string
  department?: 'crown' | 'pearl'
}

export default function PartiTabs({ parti, department = 'crown' }: Props) {
  return (
    <div className="w-full">
      <HandoverPage
        department={department}
        itemName={parti}
      />
    </div>
  )
}
