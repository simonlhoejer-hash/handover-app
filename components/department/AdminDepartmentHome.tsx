'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  items: string[]
  basePath: string
}

type StatusMap = Record<
  string,
  {
    hasNotes: boolean
    lastDate?: string
  }
>

export default function AdminDepartmentHome({
  items,
  basePath,
}: Props) {
  const [status, setStatus] = useState<StatusMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('handover_notes')
        .select('parti, shift_date, created_at')
        .eq('department', 'admin')
        .order('created_at', { ascending: false })

      const result: StatusMap = {}

      for (const item of items) {
        const latest = data?.find(d => d.parti === item)

        result[item] = {
          hasNotes: !!latest,
          lastDate: latest?.shift_date,
        }
      }

      setStatus(result)
      setLoading(false)
    }

    fetchStatus()
  }, [items])

  return (
    <main className="px-4 py-8 max-w-5xl mx-auto">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {items.map((item) => {
          const info = status[item]
          const hasNotes = info?.hasNotes

          return (
            <Link
              key={item}
              href={`${basePath}/${encodeURIComponent(item)}`}
              className="
                rounded-xl
                p-5
                h-[110px]

                flex items-center justify-center

                bg-[#ffffff]
                border border-gray-200/70

                text-gray-900
                shadow-sm

                hover:shadow-md
                hover:-translate-y-[1px]

                transition-all duration-200

                dark:bg-[#162338]
                dark:border-white/10
                dark:text-white
              "
            >

              <div className="flex flex-col items-center text-center space-y-2">

                <h2 className="text-lg font-semibold tracking-tight">
                  {item}
                </h2>

                {/* ADMIN STATUS */}

                {hasNotes && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/15 text-blue-600">
                    Ny opfølgning
                  </span>
                )}

                {/* INFO */}

                <div className="text-sm text-gray-500 dark:text-white/60">

                  {info?.lastDate ? (

                    <span className="opacity-70">
                      {new Date(info.lastDate).toLocaleDateString('da-DK', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>

                  ) : (

                    <div className="text-xs opacity-50">
                      Ingen opfølgning endnu
                    </div>

                  )}

                </div>

              </div>

            </Link>
          )
        })}

      </div>
    </main>
  )
}