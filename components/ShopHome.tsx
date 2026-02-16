'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDepartment } from '@/lib/DepartmentContext'

const OUTLETS = [
  'Tøj',
  'Sprut',
  'Slik',
  'Parfume',
]

type StatusMap = Record<
  string,
  {
    hasNotes: boolean
    lastDate?: string
    readBy?: string | null
    receiverName?: string | null
  }
>

function formatDanishDate(dateString?: string) {
  if (!dateString) return ''

  return new Date(dateString).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
  })
}

export default function ShopHome() {
  const { department } = useDepartment()
  const [status, setStatus] = useState<StatusMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('handover_notes')
        .select('parti, shift_date, read_by, receiver_name, created_at')
        .eq('department', department)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        return
      }

      const RESET_DAYS = 14
      const result: StatusMap = {}

      for (const outlet of OUTLETS) {
        const latest = data?.find(d => d.parti === outlet)

        let isExpired = false

        if (latest?.created_at) {
          const daysOld = Math.floor(
            (Date.now() - new Date(latest.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )

          if (daysOld >= RESET_DAYS) {
            isExpired = true
          }
        }

        result[outlet] = {
          hasNotes: !!latest && !isExpired,
          lastDate: latest?.shift_date,
          readBy: isExpired ? null : latest?.read_by ?? null,
          receiverName: isExpired ? null : latest?.receiver_name ?? null,
        }
      }

      setStatus(result)
      setLoading(false)
    }

    fetchStatus()
  }, [department])

  if (loading) {
    return <p className="p-6">Indlæser…</p>
  }

  return (
    <main className="px-4 py-6 max-w-5xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OUTLETS.map((outlet) => {
          const info = status[outlet]

          const hasNotes = info?.hasNotes
          const isRead = hasNotes && !!info.readBy
          const isUnread = hasNotes && !info.readBy

          return (
            <Link
              key={outlet}
              href={`/parti/${encodeURIComponent(outlet)}`}
              className="block rounded-xl bg-white dark:bg-gray-800 shadow p-4 transition active:scale-[0.98] hover:shadow-lg"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {outlet}
                </h2>

                {!hasNotes && (
                  <span className="text-red-600 text-sm font-semibold">
                    ❌ Mangler
                  </span>
                )}

                {isUnread && (
                  <span className="text-yellow-600 text-sm font-semibold">
                    🕒 Afventer
                  </span>
                )}

                {isRead && (
                  <span className="text-green-600 text-sm font-semibold">
                    ✓ Læst
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-2">
                {info?.lastDate ? (
                  <>
                    Sidst: {formatDanishDate(info.lastDate)}

                    {isUnread && info.receiverName && (
                      <>
                        {' · '}
                        <span className="font-semibold text-yellow-500">
                          {info.receiverName}
                        </span>
                      </>
                    )}

                    {isRead && info.readBy && (
                      <>
                        {' · '}
                        <span className="font-semibold text-green-600">
                          {info.readBy}
                        </span>
                      </>
                    )}
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
