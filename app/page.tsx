'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const PARTIER = [
  'NORD',
  'SYD',
  'KULL varmt',
  'KULL koldt',
  'Konditor',
  'Besætning',
  'Opsætter',
  'Skagerak',
  'Stilling 2',
  'Stilling 1',
  'Slagter',
]

type StatusMap = Record<
  string,
  {
    hasNotes: boolean
    lastDate?: string
    readBy?: string | null
  }
>

export default function Page() {
  const [status, setStatus] = useState<StatusMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      const result: StatusMap = {}

      for (const parti of PARTIER) {
        const { data } = await supabase
          .from('handover_notes')
          .select('shift_date, read_by')
          .eq('parti', parti)
          .order('shift_date', { ascending: false })
          .limit(1)

        result[parti] = {
          hasNotes: !!data && data.length > 0,
          lastDate: data?.[0]?.shift_date,
          readBy: data?.[0]?.read_by ?? null,
        }
      }

      setStatus(result)
      setLoading(false)
    }

    fetchStatus()
  }, [])

  if (loading) {
    return <p className="p-6">Indlæser…</p>
  }

  return (
    <main className="px-4 py-6 max-w-5xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PARTIER.map((parti) => {
          const info = status[parti]

          const isRead = info?.hasNotes && info.readBy
          const isMissing = !info?.hasNotes || !info.readBy

          return (
            <Link
              key={parti}
              href={`/parti/${encodeURIComponent(parti)}`}
              className="block rounded-xl bg-white dark:bg-gray-800 shadow p-4 active:scale-[0.98] transition"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold">
                  {parti}
                </h2>

                {isRead ? (
                  <span className="text-green-600 text-sm font-semibold">
                    ✓ Opdateret
                  </span>
                ) : (
                  <span className="text-red-600 text-sm font-semibold">
                    ⚠ Mangler
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-2">
                {info?.lastDate ? (
                  <>
                    Sidst: {info.lastDate}
                    {info.readBy && ` · Læst af ${info.readBy}`}
                  </>
                ) : (
                  'Ingen overleveringer endnu'
                )}
              </p>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
