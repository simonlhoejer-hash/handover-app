'use client'

import HandoverPage from '@/components/handover/HandoverPage'

type Props = {
  outlet: string
}

export default function AdminTabs({ outlet }: Props) {
  return (
    <div className="space-y-6">

      <div className="rounded-3xl bg-white dark:bg-[#162338] border border-black/5 dark:border-white/10 p-6">

        <HandoverPage
          department="admin"
          itemName={outlet}
          hideHeader
          createLabel="Ny opfølgning"
        />

      </div>

    </div>
  )
}