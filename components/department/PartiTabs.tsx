'use client'

import HandoverPage from '@/components/handover/HandoverPage'

type Props = {
  parti: string
}

export default function PartiTabs({ parti }: Props) {
  return (
    <div className="w-full">
      <HandoverPage
        department="galley"
        itemName={parti}
      />
    </div>
  )
}