'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
function formatDanishDate(dateString?: string) {
  if (!dateString) return ''

  return new Date(dateString).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
  })
}
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
    receiverName?: string | null
  }
>

export default function Page() {
  const [status, setStatus] = useState<StatusMap>({})
  const [loading, setLoading] = useState(true)

 useEffect(() => {
  const fetchStatus = async () => {
    const result: StatusMap = {}

    for (const parti of PARTIER) {
      const { data, error } = await supabase
        .from('handover_notes')
        .select('shift_date, read_by, receiver_name')
        .eq('parti', parti)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error(error)
      }

      const latest = data?.[0]

      result[parti] = {
        hasNotes: !!latest,
        lastDate: latest?.shift_date,
        readBy: latest?.read_by ?? null,
        receiverName: latest?.receiver_name ?? null,
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

          const hasNotes = info?.hasNotes
          const isRead = hasNotes && !!info.readBy
          const isUnread = hasNotes && !info.readBy

          return (
            <Link
              key={parti}
              href={`/parti/${encodeURIComponent(parti)}`}
              className="block rounded-xl bg-white dark:bg-gray-800 shadow p-4 active:scale-[0.98] transition"
            >
             <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
  <h2 className="text-lg font-semibold">{parti}</h2>

  <div className="sm:text-right">
    {/* 🔴 Ingen overlevering */}
    {!hasNotes && (
      <span className="text-red-600 text-sm font-semibold whitespace-normal">
        ❌ Mangler
      </span>
    )}
{/* 🟡 Overlevering findes – men ikke læst */}
{isUnread && (
  <span className="text-yellow-600 text-sm font-semibold whitespace-normal">
    🕒 Afventer
  </span>
)}
{/* 🟢 Overlevering læst */}
{isRead && (
  <span className="text-green-600 text-sm font-semibold whitespace-normal">
    ✓ Læst
  </span>
)}
  </div>
</div>
<p className="text-sm text-gray-500 mt-2">
  {info?.lastDate ? (
    <>
      Sidst: {formatDanishDate(info.lastDate)}

      {isUnread && info.receiverName && (
        <>
          {' · '}
          <span className="font-semibold text-yellow-400">
            {info.receiverName}
          </span>
        </>
      )}

      {isRead && info.readBy && (
        <>
          {' · '}
          <span className="font-semibold text-green-400">
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
